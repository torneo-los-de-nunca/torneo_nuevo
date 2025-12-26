import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../Firebase";
import { collection, onSnapshot } from "firebase/firestore";
import "../styles/estadisticas.css";
import GraficoCarrera from "../components/GraficoCarrera";
import iconEstadisticas from "../assets/icons/ldn-estadisticas.png";
import IndiceParticipacion from "../components/IndiceParticipacion";
import IntervalosAparicion from "../components/IntervalosAparicion";
import DensidadMensual from "../components/DensidadMensual";

// ===============================
// FECHAS INICIALES (antes del sistema)
// ===============================
const fechasIniciales = {
  Picante: "2025-11-30",
  Oso: "2025-11-30",
  Místico: "2025-11-29",
  Potencia: "2025-11-29",
  Germán: "2025-11-29",
  Profesor: "2025-11-08",
  Sombra: "2025-11-08",
  Tía: "2025-11-28",
  Navai: "2025-11-09",
  Conejo: "2025-11-29",
  Marcelito: "2025-10-30",
};

// ===============================
// RACHAS HISTÓRICAS (base manual)
// ===============================
const rachasHistoricas = {
  Picante: 10,
  Oso: 10,
  Místico: 17,
  Potencia: 14,
  Germán: 30,
  Profesor: 21,
  Sombra: 33,
  Tía: 34,
  Navai: 54,
  Conejo: 97,
  Marcelito: 75,
};
// ===============================
// PUNTOS INICIALES DEL TORNEO
// ===============================
const puntosIniciales = {
  Oso: 0,
  Picante: 0,
  Místico: 0,
  Potencia: 0,
  Germán: 0,
  Profesor: 0,
  Sombra: 0,
  Tía: 0,
  Navai: 0,
  Conejo: 0,
  Marcelito: 0,
};
// ===============================
// HELPERS
// ===============================
function parseFecha(fechaStr) {
  if (!fechaStr) return null;
  if (fechaStr instanceof Date) return fechaStr;

  const hoy = new Date();
  const s = String(fechaStr).trim();

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(+iso[1], iso[2] - 1, +iso[3]);

  if (s.includes("/")) {
    const p = s.split("/");
    if (p.length >= 2) {
      let dd = +p[0];
      let mm = +p[1];
      let yy = p[2] ? +p[2] : hoy.getFullYear();
      if (yy < 100) yy += 2000;
      return new Date(yy, mm - 1, dd);
    }
  }

const dash = s.split("-");
if (dash.length >= 2) {
  let dd = +dash[0];
  let mm = +dash[1];
  let yy = dash[2] ? +dash[2] : hoy.getFullYear();
  if (yy < 100) yy += 2000;
  return new Date(yy, mm - 1, dd);
}

  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function diffDias(a, b) {
  return Math.floor((a - b) / (1000 * 60 * 60 * 24));
}

function formatTiempo(dias) {
  if (dias <= 0) return "0 días";
  let meses = Math.floor(dias / 30);
  let semanas = Math.floor((dias % 30) / 7);
  let d = dias % 7;
  const partes = [];
  if (meses > 0) partes.push(`${meses} mes${meses > 1 ? "es" : ""}`);
  if (semanas > 0) partes.push(`${semanas} semana${semanas > 1 ? "s" : ""}`);
  if (d > 0) partes.push(`${d} día${d > 1 ? "s" : ""}`);
  return partes.join(" ");
}
function puntosDeOpciones(opts) {
  if (!opts || !opts.selected) return 0;

  // Penalizaciones / no suma (excluyentes)
  if (opts.penal10) return -10;
  if (opts.penal1) return -1;
  if (opts.nosuma) return 0;

  // Base
  let puntos = 1;

  // Bonificaciones
  if (opts.oro) puntos += 1;
  if (opts.doble) puntos += 1;
  if (opts.triple) puntos += 2;

  return puntos;
}

function getZona(racha) {
  if (racha >= 45) return { color: "#ff0033", icon: "☠️" };
  if (racha >= 30) return { color: "#ff8c00", icon: "🔥" };
  if (racha >= 10) return { color: "#ffeb3b", icon: "⚠️" };
  return { color: "#4af0ff", icon: "❄️" };
}
function calcularIndiceParticipacion(semanasSnap, jugadores) {
  const semanasConFichas = (semanasSnap || []).filter((docu) => {
    const raw = docu.data();
    return (raw?.eventos || []).length > 0;
  });

  const totalSemanas = semanasConFichas.length;
  if (!totalSemanas) return [];

  const data = jugadores.map((j) => {
    let semanasPresente = 0;

    semanasConFichas.forEach((docu) => {
      const eventos = docu.data()?.eventos || [];
const estuvo = eventos.some((ev) => {
  const opts = ev?.opciones?.[j.nombre];
  if (!opts || !opts.selected) return false;

  // 🔥 regla LDN: si NO SUMA o es penalización, cuenta como "no estuvo"
  if (opts.nosuma) return false;
  if (opts.penal1) return false;
  if (opts.penal10) return false;

  // Si llegó hasta acá, por lo menos sumó 1 base
  return true;
});

      if (estuvo) semanasPresente++;
    });

    return {
      nombre: j.nombre,
      semanasPresente,
      totalSemanas,
      porcentaje: Math.round((semanasPresente / totalSemanas) * 100),
    };
  });

  return data.sort((a, b) => a.porcentaje - b.porcentaje);
}
function calcularIntervalosAparicion(jugadores, eventos, fechasIniciales) {
  const hoy = new Date();

  return jugadores.map((j) => {
    const nombre = j.nombre;

    // usamos Set para evitar duplicar días
    const diasSet = new Set();

    const fi = fechasIniciales[nombre];
    if (fi) {
      const f = parseFecha(fi);
      if (f && f <= hoy) {
        diasSet.add(f.toISOString().slice(0, 10));
      }
    }

    eventos.forEach((ev) => {
      const opts = ev.opciones?.[nombre];
      if (!opts || !opts.selected) return;
      if (opts.nosuma || opts.penal1 || opts.penal10) return;

      const dia = ev.fecha.toISOString().slice(0, 10);
      diasSet.add(dia); // 👈 solo 1 por día
    });

    const diasOrdenados = [...diasSet]
      .map(d => new Date(d))
      .sort((a, b) => a - b);

    const intervalos = [];
    for (let i = 1; i < diasOrdenados.length; i++) {
      intervalos.push(diffDias(diasOrdenados[i], diasOrdenados[i - 1]));
    }

    return {
      nombre,
      intervalos,
    };
  });
}


// ===============================
// CARRERA DE PUNTOS DESDE EVENTOS
// ===============================
function calcularCarreraDesdeSemanas(semanasSnap, jugadores, puntosIniciales) {
  const acumulados = {};
  jugadores.forEach(j => {
    acumulados[j.nombre] = puntosIniciales[j.nombre] ?? 0;
  });

  const data = [];

  // Semana 0
  const filaInicial = { semana: 0 };
  jugadores.forEach(j => {
    filaInicial[j.nombre] = acumulados[j.nombre];
  });
  data.push(filaInicial);

  semanasSnap.forEach((docu, index) => {
    const raw = docu.data();
    const eventos = raw.eventos || [];

    // 🔥 AGRUPAR EVENTOS POR FECHA
    const eventosPorDia = {};
    eventos.forEach(ev => {
      if (!ev.fecha || !ev.opciones) return;
      if (!eventosPorDia[ev.fecha]) eventosPorDia[ev.fecha] = [];
      eventosPorDia[ev.fecha].push(ev);
    });

    // Procesar día por día
    Object.values(eventosPorDia).forEach(eventosDelDia => {
      const baseSumada = {}; // jugador → true

      eventosDelDia.forEach(ev => {
        jugadores.forEach(j => {
          const nombre = j.nombre;
          const opts = ev.opciones?.[nombre];
          if (!opts || !opts.selected) return;

          let puntos = 0;

          // 👉 BASE: solo una vez por día
          if (
            !baseSumada[nombre] &&
            !opts.nosuma &&
            !opts.penal1 &&
            !opts.penal10
          ) {
            puntos += 1;
            baseSumada[nombre] = true;
          }

          // 👉 BONOS
          if (opts.oro) puntos += 1;
          if (opts.doble) puntos += 1;
          if (opts.triple) puntos += 2;

          // 👉 PENALES
          if (opts.penal1) puntos -= 1;
          if (opts.penal10) puntos -= 10;

          acumulados[nombre] += puntos;
        });
      });
    });

    // Snapshot de la semana
    const fila = { semana: index + 1 };
    jugadores.forEach(j => {
      fila[j.nombre] = acumulados[j.nombre];
    });
    data.push(fila);
  });

  return data;
}



// ===============================
// COMPONENTE
// ===============================
export default function Estadisticas() {
const [jugadores, setJugadores] = useState([]);
const [eventos, setEventos] = useState([]);
const [loading, setLoading] = useState(true);
const navigate = useNavigate();

const [mostrarCarrera, setMostrarCarrera] = useState(false);
const [mostrarParticipacion, setMostrarParticipacion] = useState(false);
const [mostrarIntervalos, setMostrarIntervalos] = useState(false);
const [mostrarDensidad, setMostrarDensidad] = useState(false);

const [semanasSnapshot, setSemanasSnapshot] = useState([]);

  // cargar jugadores
  useEffect(() => {
    fetch("/jugadores.json")
      .then((res) => res.json())
      .then((data) => setJugadores(data));
  }, []);

  // escuchar semanas
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "semanas"), (snap) => {
      setSemanasSnapshot(snap.docs);
      const lista = [];
      snap.forEach((docu) => {
        const raw = docu.data();
        const evs = raw.eventos || [];
        evs.forEach((ev) => {
          const f = parseFecha(ev.fecha);
          if (f) lista.push({ ...ev, fecha: f });
        });
      });
      lista.sort((a, b) => a.fecha - b.fecha);
      setEventos(lista);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading || jugadores.length === 0) {
    return <h1 style={{ color: "white" }}>Cargando estadísticas...</h1>;
  }

  const hoy = new Date();

  // ===============================
  // CÁLCULO
  // ===============================
  const resultados = jugadores.map((j) => {
    const nombre = j.nombre;
    const apariciones = [];

    const fi = fechasIniciales[nombre];
    if (fi) {
      const f = parseFecha(fi);
if (f && f <= hoy) apariciones.push(f);
    }

    eventos.forEach((ev) => {
      if (!ev.opciones || typeof ev.opciones !== "object") return;
      const opts = ev.opciones[nombre];
      if (!opts || !opts.selected) return;

      let positivos = 0;
      if (!opts.nosuma && !opts.penal1 && !opts.penal10) positivos += 1;
      if (opts.oro) positivos += 1;
      if (opts.doble) positivos += 1;
      if (opts.triple) positivos += 2;

if (positivos > 0 && ev.fecha <= hoy) apariciones.push(ev.fecha);
    });

    apariciones.sort((a, b) => a - b);

    const ultima = apariciones.length
      ? apariciones[apariciones.length - 1]
      : hoy;

    const rachaActual = diffDias(hoy, ultima);

    // ---- récord de temporada (previo) ----
    let recordTempPrev = 0;
    for (let i = 1; i < apariciones.length; i++) {
      const gap = diffDias(apariciones[i], apariciones[i - 1]);
      if (gap > recordTempPrev) recordTempPrev = gap;
    }

    const rompeTemporada = rachaActual > recordTempPrev;
    const recordTemporada = Math.max(recordTempPrev, rachaActual);

    // ---- récord histórico (correcto) ----
const historicoBase = rachasHistoricas[nombre] || 0;

// récord previo antes de HOY (lo que ya existe “registrado”)
const recordHistoricoPrev = Math.max(historicoBase, recordTempPrev);

// dispara animación cuando HOY supera el récord previo
const rompeHistorico = rachaActual > recordHistoricoPrev;

// récord histórico mostrado (no se “olvida” cuando se corta la racha)
const recordHistorico = Math.max(recordHistoricoPrev, rachaActual);


    const rompeRecord = rompeTemporada || rompeHistorico;

    return {
      nombre,
      rachaActual,
      tiempoActual: formatTiempo(rachaActual),
      recordTemporada,
      tiempoTemporada: formatTiempo(recordTemporada),
      recordHistorico,
      tiempoHistorico: formatTiempo(recordHistorico),
      ultima: ultima.toLocaleDateString("es-AR"),
      rompeTemporada,
      rompeHistorico,
      rompeRecord,
    };
  }).sort((a, b) => b.rachaActual - a.rachaActual);
const carreraFirestore = calcularCarreraDesdeSemanas(
  semanasSnapshot,
  jugadores,
  puntosIniciales
);

const dataIntervalos = calcularIntervalosAparicion(
  jugadores,
  eventos,
  fechasIniciales
);

const puntosTotales = {};
jugadores.forEach(j => {
  puntosTotales[j.nombre] = puntosIniciales[j.nombre] ?? 0;
});
const dataParticipacion = calcularIndiceParticipacion(semanasSnapshot, jugadores);

semanasSnapshot.forEach(docu => {
  const raw = docu.data();
  const eventos = raw.eventos || [];

  eventos.forEach(ev => {
    if (!ev.opciones) return;

    jugadores.forEach(j => {
      const opts = ev.opciones[j.nombre];
      if (!opts || !opts.selected) return;

      let suma = 0;
      if (!opts.nosuma && !opts.penal1 && !opts.penal10) suma += 1;
      if (opts.oro) suma += 1;
      if (opts.doble) suma += 1;
      if (opts.triple) suma += 2;

puntosTotales[j.nombre] += puntosDeOpciones(opts);
    });
  });
});


  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="estadisticas-wrapper">
    <div className="stats-panel">

  {/* LOGO ARRIBA – VUELVE A HOME */}
  <div className="estadisticas-header">
    <img
      src={iconEstadisticas}
      alt="LDN Estadísticas"
      className="logo-estadisticas"
      onClick={() => navigate("/")}
    />
  </div>

  <div className="stats-title">📊 Rachas de días sin aparecer</div>


        <table className="tabla-estadisticas">
          <thead>
            <tr>
              <th>Jugador</th>
              <th>Racha actual</th>
              <th>Última vez</th>
              <th>Record 25/26</th>
              <th>Record hist.</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r) => {
              const zona = getZona(r.rachaActual);

              return (
                <tr key={r.nombre} className="fila">
                  {/* JUGADOR */}
                  <td className="cell-name" style={{ color: zona.color }}>
                    {zona.icon} {r.nombre}
                  </td>
                  {/* RACHA ACTUAL */}
                  <td className="cell-compact" style={{ color: zona.color }}>
                    <div className="num">{r.rachaActual} días</div>
                    <div className="sub">{r.tiempoActual}</div>
                  </td>

                  {/* ÚLTIMA VEZ */}
                  <td className="cell-date">{r.ultima}</td>

                  {/* RECORD TEMPORADA */}
                  <td className="cell-compact">
                    <div className={`num ${r.rompeTemporada ? "record-cell" : ""}`}>
                      {r.recordTemporada} días
                      {r.rompeTemporada && (
                        <span className="badge-record">NEW RECORD</span>
                      )}
                    </div>
                    <div className="sub">{r.tiempoTemporada}</div>
                  </td>

                  {/* RECORD HISTÓRICO */}
                  <td className="cell-compact">
                    <div className={`num ${r.rompeHistorico ? "record-cell" : ""}`}>
                      {r.recordHistorico} días
                      {r.rompeHistorico && (
                        <span className="badge-record">NEW RECORD</span>
                      )}
                    </div>
                    <div className="sub">{r.tiempoHistorico}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
{/* ===============================
   INTERVALOS DE APARICIÓN
=============================== */}
<div className="grafico-carrera">
  <div
    className="grafico-toggle"
    onClick={() => setMostrarIntervalos(!mostrarIntervalos)}
    style={{
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      background: "#0f0f1a",
      borderRadius: "10px",
      marginBottom: "10px",
      border: "1px solid #333",
    }}
  >
    <h3 style={{ margin: 0 }}>
      📊 Intervalos de aparición
    </h3>
    <span style={{ fontSize: "20px" }}>
      {mostrarIntervalos ? "▲" : "▼"}
    </span>
  </div>

  {mostrarIntervalos && (
    <IntervalosAparicion data={dataIntervalos} />
  )}
</div>



{/* ===============================
    CARRERA DE PUNTOS (GRÁFICO)
=============================== */}
<div className="grafico-carrera">
  {/* TÍTULO DESPLEGABLE */}
  <div
    className="grafico-toggle"
    onClick={() => setMostrarCarrera(!mostrarCarrera)}
    style={{
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      background: "#0f0f1a",
      borderRadius: "10px",
      marginBottom: "10px",
      border: "1px solid #333",
    }}
  >
    <h3 style={{ margin: 0 }}>
      🏁 Carrera de puntos
    </h3>
    <span style={{ fontSize: "20px" }}>
      {mostrarCarrera ? "▲" : "▼"}
    </span>
  </div>

  {/* CONTENIDO DESPLEGABLE */}
   {mostrarCarrera && (
    <GraficoCarrera
      data={carreraFirestore}
      jugadores={jugadores}
    />
  )}
  {/* ===============================
    ÍNDICE DE PARTICIPACIÓN SEMANAL
=============================== */}
<div className="grafico-carrera">
  {/* TÍTULO DESPLEGABLE (MISMO ESTILO) */}
  <div
    className="grafico-toggle"
    onClick={() => setMostrarParticipacion(!mostrarParticipacion)}
    style={{
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      background: "#0f0f1a",
      borderRadius: "10px",
      marginBottom: "10px",
      border: "1px solid #333",
    }}
  >
    <h3 style={{ margin: 0 }}>📈 Índice de participación semanal</h3>
    <span style={{ fontSize: "20px" }}>
      {mostrarParticipacion ? "▲" : "▼"}
    </span>
  </div>

  {/* CONTENIDO DESPLEGABLE */}
  {mostrarParticipacion && <IndiceParticipacion data={dataParticipacion} />}
</div>

{/* ===============================
    DENSIDAD MENSUAL DE APARICIONES
=============================== */}
<div className="grafico-carrera">
  <div
    className="grafico-toggle"
    onClick={() => setMostrarDensidad(!mostrarDensidad)}
    style={{
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      background: "#0f0f1a",
      borderRadius: "10px",
      marginBottom: "10px",
      border: "1px solid #333",
    }}
  >
    <h3 style={{ margin: 0 }}>
      📊 Densidad mensual de apariciones
    </h3>
    <span style={{ fontSize: "20px" }}>
      {mostrarDensidad ? "▲" : "▼"}
    </span>
  </div>

  {mostrarDensidad && (
    <DensidadMensual
      eventos={eventos}
      jugadores={jugadores}
    />
  )}
</div>




</div>
</div>
</div>
);
}
