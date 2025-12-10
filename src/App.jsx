import { useEffect, useState } from "react";
import "./index.css";

// 🔥 Import único de Firestore (ESTE ES EL CORRECTO)
import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc
} from "firebase/firestore";

import { db } from "./Firebase";

// ===============================
// CONFIGURACIÓN BÁSICA
// ===============================
const TOTAL_SEMANAS = 52;
const SEMANA_ACTUAL = Number(localStorage.getItem("semana_actual") || 1);

// semanas que son FECHA DE ORO (columna entera dorada)
const FECHAS_DE_ORO = [1, 10, 14, 15, 17, 29, 30, 38, 45, 48, 50];

const MESES = [
  { nombre: "DICIEMBRE", desde: 1, hasta: 4 },
  { nombre: "ENERO", desde: 5, hasta: 9 },
  { nombre: "FEBRERO", desde: 10, hasta: 13 },
  { nombre: "MARZO", desde: 14, hasta: 17 },
  { nombre: "ABRIL", desde: 18, hasta: 22 },
  { nombre: "MAYO", desde: 23, hasta: 26 },
  { nombre: "JUNIO", desde: 27, hasta: 30 },
  { nombre: "JULIO", desde: 31, hasta: 35 },
  { nombre: "AGOSTO", desde: 36, hasta: 39 },
  { nombre: "SEPTIEMBRE", desde: 40, hasta: 43 },
  { nombre: "OCTUBRE", desde: 44, hasta: 48 },
  { nombre: "NOVIEMBRE", desde: 49, hasta: 52 },
];

// normaliza las semanas
const normalizarSemana = (entrada) => {
  if (entrada === null || entrada === undefined) return {};
  if (typeof entrada === "number") return { valor: entrada };
  return entrada;
};

// Fecha larga para las fichas
function formatearFechaLarga(fechaISO) {
  if (!fechaISO) return "";
  const fecha = new Date(fechaISO);

  const opciones = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  return fecha.toLocaleDateString("es-AR", opciones);
}
// Recalcula la tabla de jugadores a partir de las fichas guardadas en Firestore
function recalcularJugadoresDesdeFirestore(jugadoresBase, semanasDetalle) {
  if (!jugadoresBase.length) return jugadoresBase;

  // Mapa rápido: nombre -> índice
  const indicePorNombre = {};
  jugadoresBase.forEach((j, idx) => {
    indicePorNombre[j.nombre] = idx;
  });

  // Copia base con semanas vacías y total 0
  const resultado = jugadoresBase.map((j) => ({
    ...j,
    semanas: Array.from({ length: TOTAL_SEMANAS }, () => ({})),
    total: 0,
  }));

  // Recorremos todas las semanas y eventos
  Object.entries(semanasDetalle).forEach(([semanaStr, valorSemana]) => {
    const semanaIndex = Number(semanaStr) - 1;
    if (semanaIndex < 0 || semanaIndex >= TOTAL_SEMANAS) return;

    // Ahora SEMPRE tratamos la semana como array de eventos
    const eventos = Array.isArray(valorSemana)
      ? valorSemana
      : valorSemana?.eventos || [];

    eventos.forEach((evento) => {
      if (!evento.opciones) return;

      Object.entries(evento.opciones).forEach(([nombreJugador, opts]) => {
        if (!opts.selected) return;

        const idxJugador = indicePorNombre[nombreJugador];
        if (idxJugador === undefined) return;

        const puntos = calcularPuntosDeJugador(opts);
        const jug = resultado[idxJugador];

        const semanaObj = normalizarSemana(jug.semanas[semanaIndex]);

        jug.semanas[semanaIndex] = {
          ...semanaObj,
          valor: (semanaObj.valor || 0) + puntos,
          oro: !!opts.oro,
          doble: !!opts.doble,
          triple: !!opts.triple,
          penal1: !!opts.penal1,
          penal10: !!opts.penal10,
          nosuma: !!opts.nosuma,
        };

        jug.total += puntos;
      });
    });
  });

  // Ordenar por puntos
  resultado.sort((a, b) => b.total - a.total);
  return resultado;
}


function App() {
  const [jugadoresBase, setJugadoresBase] = useState([]); // solo nombres y datos fijos
  const [jugadores, setJugadores] = useState([]);         // tabla que se muestra
  const [semanasDetalle, setSemanasDetalle] = useState({});
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(SEMANA_ACTUAL);

  const [tapCount, setTapCount] = useState(0);
  const [adminVisible, setAdminVisible] = useState(false);

  // ===============================
  // 🔥 CARGA EN TIEMPO REAL DESDE FIRESTORE
  // ===============================
useEffect(() => {
  const unsub = onSnapshot(collection(db, "semanas"), (snap) => {
    let data = {};

    snap.forEach((docu) => {
      const docData = docu.data();
      // Siempre guardamos solo el array de eventos
      data[docu.id] = docData.eventos || [];
    });

    console.log("🔥 Firestore actualizado:", data);
    setSemanasDetalle(data);
  });

  return () => unsub();
}, []);



  // ADMIN MODE (contraseña)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isAdminLogged, setIsAdminLogged] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);

  // VARIABLES DEL FORMULARIO NUEVA FICHA
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventLugar, setNewEventLugar] = useState("");
  const [newEventContexto, setNewEventContexto] = useState("");
  const [newEventNota, setNewEventNota] = useState("");

  const [selectedPlayers, setSelectedPlayers] = useState({});

  function toggleOption(nombreJugador, opcion, value) {
    setSelectedPlayers((prev) => ({
      ...prev,
      [nombreJugador]: {
        ...(prev[nombreJugador] || {}),
        [opcion]: value,
        selected: true,
      },
    }));
  }

  function calcularPuntosDeJugador(opciones) {
    if (!opciones) return 0;

    // Si es "NO SUMA" → siempre 0
    if (opciones.nosuma) return 0;

    // Base por aparecer
    let puntosBase = 1;

    // Si tiene penalización, NO suma el punto base
    if (opciones.penal1 || opciones.penal10) {
      puntosBase = 0;
    }

    let puntos = puntosBase;

    if (opciones.oro) puntos += 1;
    if (opciones.doble) puntos += 1;
    if (opciones.triple) puntos += 2;

    if (opciones.penal1) puntos -= 1;
    if (opciones.penal10) puntos -= 10;

    return puntos;
  }

  const checkPassword = () => {
    if (passwordInput === "Cacona") {
      setIsAdminLogged(true);
      setShowPasswordPrompt(false);
      setPasswordInput("");
      alert("Bienvenido al ADMIN 😎");
    } else {
      alert("Contraseña incorrecta");
      setPasswordInput("");
    }
  };

  const semanasArray = Array.from({ length: TOTAL_SEMANAS }, (_, i) => i + 1);

  // ===============================
  // Cargar semanas desde Firebase (fichas)
  // ===============================
  useEffect(() => {
    async function cargarSemanas() {
      const colRef = collection(db, "semanas");
      const snapshot = await getDocs(colRef);

      const data = {};
      snapshot.forEach((docu) => {
        data[docu.id] = docu.data().eventos || [];
      });

      setSemanasDetalle(data);
    }

    cargarSemanas();
  }, []);

  // ===============================
  // Cargar jugadores (tabla principal)
  // ===============================
// 1) Cargo la lista base de jugadores (nombres, etc.) desde el JSON
useEffect(() => {
  fetch("/jugadores.json?cache=" + Date.now())
    .then((res) => res.json())
    .then((data) => {
      const base = data.map((j) => ({
        ...j,
        semanas: Array.from({ length: TOTAL_SEMANAS }, () => ({})),
        total: 0,
      }));
      setJugadoresBase(base);
    })
    .catch(() => console.error("Error cargando jugadores.json"));
}, []);

// 2) Cada vez que cambian las fichas o la base de jugadores,
//    recalculo la tabla completa desde Firestore
useEffect(() => {
  if (!jugadoresBase.length) return;
  const recalculados = recalcularJugadoresDesdeFirestore(
    jugadoresBase,
    semanasDetalle
  );
  setJugadores(recalculados);
}, [jugadoresBase, semanasDetalle]);


  // Guarda la nueva ficha en la semana seleccionada
// Guarda la nueva ficha en la semana seleccionada
async function handleSaveEvent() {
  const nuevaFicha = {
    fecha: newEventDate,
    jugadores: Object.keys(selectedPlayers).filter(
      (j) => selectedPlayers[j].selected
    ),
    lugar: newEventLugar,
    contexto: newEventContexto,
    nota: newEventNota,
    opciones: selectedPlayers,
  };

  // 1) Actualizo estado local
  setSemanasDetalle((prev) => ({
    ...prev,
    [semanaSeleccionada]: [
      ...(prev[semanaSeleccionada] || []),
      nuevaFicha,
    ],
  }));

  // 2) Guardo en Firestore (ESTO es lo que comparten todos)
  const eventosPrevios = semanasDetalle[semanaSeleccionada] || [];
  const nuevosEventos = [...eventosPrevios, nuevaFicha];

  await setDoc(
    doc(db, "semanas", String(semanaSeleccionada)),
    { eventos: nuevosEventos },
    { merge: true }
  );

  // 3) Reset formulario
  setNewEventDate("");
  setNewEventLugar("");
  setNewEventContexto("");
  setNewEventNota("");
  setSelectedPlayers({});
  setAddingEvent(false);
}



async function borrarFicha(index) {
    const semanaKey = String(semanaSeleccionada);
    const eventosSemana = semanasDetalle[semanaKey] || [];
    const evento = eventosSemana[index];

    if (!evento) return;

    // 1) Actualizar semanasDetalle (sacar la ficha de esa semana)
    const nuevaSemana = eventosSemana.filter((_, i) => i !== index);
    const nuevoDetalle = { ...semanasDetalle };

    if (nuevaSemana.length > 0) {
      nuevoDetalle[semanaKey] = nuevaSemana;
    } else {
      delete nuevoDetalle[semanaKey];
    }

    setSemanasDetalle(nuevoDetalle);
    // 🔥 Sincronizar cambios con Firestore
if (nuevaSemana.length > 0) {
  await setDoc(
    doc(db, "semanas", semanaKey),
    { eventos: nuevaSemana },
    { merge: false }
  );
} else {
  await deleteDoc(doc(db, "semanas", semanaKey));
}

    localStorage.setItem("semanasDetalle", JSON.stringify(nuevoDetalle));

    // 2) Actualizar puntos de los jugadores
    if (!evento.opciones) return; // fichas viejas que no tenían opciones

    setJugadores((prev) => {
      const copia = prev.map((j) => ({
        ...j,
        semanas: [...j.semanas],
      }));

      Object.entries(evento.opciones).forEach(([nombreJugador, opts]) => {
        if (!opts.selected) return;

        const puntos = calcularPuntosDeJugador(opts);
        const idxSemana = Number(semanaKey) - 1;

        copia.forEach((jug) => {
          if (jug.nombre !== nombreJugador) return;

          const semanaObj = normalizarSemana(jug.semanas[idxSemana]);
          const nuevoValor = (semanaObj.valor || 0) - puntos;

          jug.semanas[idxSemana] = {
            ...semanaObj,
            valor: nuevoValor,
            oro: false,
            doble: false,
            triple: false,
            penal1: false,
            penal10: false,
            nosuma: false,
          };

          jug.total -= puntos;
          if (jug.total < 0) jug.total = 0;
        });
      });

      // ordenar por puntos de nuevo
      copia.sort((a, b) => b.total - a.total);
      localStorage.setItem("jugadores", JSON.stringify(copia));
      return copia;
    });
  }

  return (
    <div className="page">
      {showPasswordPrompt && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#241b3d",
              padding: "20px",
              borderRadius: "10px",
              border: "2px solid #ff00c8",
              textAlign: "center",
              width: "300px",
              boxShadow: "0 0 20px #ff00c8",
            }}
          >
            <h3 style={{ color: "white" }}>Ingresá la contraseña</h3>

            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "6px",
                width: "100%",
                marginTop: "10px",
              }}
            />

            <div
              style={{
                marginTop: "15px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button
                onClick={checkPassword}
                style={{
                  padding: "8px 15px",
                  background: "#ff00c8",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  width: "45%",
                }}
              >
                Aceptar
              </button>

              <button
                onClick={() => setShowPasswordPrompt(false)}
                style={{
                  padding: "8px 15px",
                  background: "gray",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  width: "45%",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGO */}
      <div
        className="logo-container"
        onClick={() => {
          setTapCount((prev) => {
            const nuevo = prev + 1;
            if (nuevo >= 5) {
              setShowPasswordPrompt(true); // solo abre el popup
              return 0; // resetea el contador
            }
            return nuevo;
          });
        }}
      >
        <img src="/icons/logo-ldn.png" alt="LDN Logo" className="logo-ldn" />
      </div>

      {adminVisible && (
        <div style={{ textAlign: "center", marginBottom: "15px" }}>
          <button
            onClick={() => setShowPasswordPrompt(true)}
            style={{
              padding: "10px 20px",
              background: "#ff00c8",
              border: "2px solid white",
              color: "white",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 0 10px #ff00c8",
            }}
          >
            ADMIN MODE 🔒
          </button>
        </div>
      )}

      {/* TÍTULO */}
      <h1 className="titulo">TORNEO LOS DE NUNCA 25–26</h1>

      {/* LEYENDA COLORES */}
      <div className="leyenda">
        <div className="leyenda-item">
          <span className="leyenda-color leyenda-oro"></span>
          <span>Fecha de Oro</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color leyenda-doble"></span>
          <span>Doble Puntuación</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color leyenda-triple"></span>
          <span>Triple Puntuación</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color leyenda-penal"></span>
          <span>Penalización</span>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="tabla-wrapper">
        <table className="tabla-torneo">
          <thead>
            <tr>
              <th>JUGADOR</th>
              <th>PUNTOS</th>
              {MESES.map((mes) => (
                <th key={mes.nombre} colSpan={mes.hasta - mes.desde + 1}>
                  {mes.nombre}
                </th>
              ))}
            </tr>
            <tr>
              <th></th>
              <th></th>
              {semanasArray.map((sem) => (
                <th key={sem}>{sem}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jugadores.map((j, idx) => (
              <tr key={j.nombre}>
                <td className="celda-jugador">
                  {idx + 1}° {j.nombre}
                </td>
                <td className="celda-total">{j.total}</td>

                {semanasArray.map((sem) => {
                  const semana = normalizarSemana(j.semanas?.[sem - 1]);

                  const valor = semana.valor ?? "";

                  // FLAGS
                  const esOro = semana.oro;
                  const esDoble = semana.doble;
                  const esTriple = semana.triple;
                  const esPenal1 = semana.penal1;
                  const esPenal10 = semana.penal10;
                  const esNoSuma = semana.nosuma;
                  const esSimple =
                    !esOro &&
                    !esDoble &&
                    !esTriple &&
                    !esPenal1 &&
                    !esPenal10 &&
                    !esNoSuma &&
                    valor !== ""; // jugador seleccionado simple

                  const style = {};

                  // 👉 1. PENALIZACIONES (máxima prioridad)
                  if ((esPenal1 || esPenal10) && valor !== "") {
                    style.backgroundColor = "#e74c3c"; // rojo fuerte
                    style.color = "#ffffff";
                    return (
                      <td key={sem} style={style}>
                        {valor}
                      </td>
                    );
                  }

                  // 👉 2. ORO / DOBLE / TRIPLE (multicolor)
                  const colores = [];
                  if (esOro) colores.push("#f1c40f");
                  if (esDoble) colores.push("#3498db");
                  if (esTriple) colores.push("#9b59b6");

                  if (colores.length === 1 && valor !== "") {
                    style.backgroundColor = colores[0];
                  }

                  if (colores.length > 1 && valor !== "") {
                    const partes = colores.map((c, i) => {
                      const start = (100 / colores.length) * i;
                      const end = (100 / colores.length) * (i + 1);
                      return `${c} ${start}% ${end}%`;
                    });
                    style.backgroundImage = `linear-gradient(135deg, ${partes.join(
                      ", "
                    )})`;
                  }

                  // 👉 3. SELECCIONADO SIMPLE (sin ningún extra)
                  if (esSimple) {
                    style.backgroundColor = "#c59bff"; // lila suave
                  }

                  // 👉 4. NO SUMA (solo si no tiene nada más)
                  if (
                    esNoSuma &&
                    !esSimple &&
                    colores.length === 0 &&
                    valor !== ""
                  ) {
                    style.backgroundColor = "#808080"; // gris
                    style.color = "white";
                  }

                  return (
                    <td key={sem} style={style}>
                      {valor !== "" ? valor : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DESCRIPCIÓN DE PUNTOS */}
      <h2 className="detalle-titulo">Descripción de puntos</h2>

      {/* BOTÓN AGREGAR FICHA (solo admin real) */}
      {isAdminLogged && !addingEvent && (
        <div style={{ textAlign: "center", marginBottom: "15px" }}>
          <button
            onClick={() => setAddingEvent(true)}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(90deg, #ff00c8, #7000ff)",
              border: "2px solid white",
              color: "white",
              fontWeight: "700",
              borderRadius: "10px",
              cursor: "pointer",
              boxShadow: "0 0 10px #ff00c8",
            }}
          >
            + AGREGAR FICHA
          </button>
        </div>
      )}

      {/* Barra de semanas */}
      <div className="detalle-weeks-bar">
        {semanasArray.map((sem) => (
          <button
            key={sem}
            className={
              "week-btn" + (semanaSeleccionada === sem ? " week-selected" : "")
            }
            onClick={() => setSemanaSeleccionada(sem)}
          >
            {sem}
          </button>
        ))}
      </div>

      {/* FORMULARIO PARA AGREGAR FICHA */}
      {isAdminLogged && addingEvent && (
        <div
          style={{
            background: "#1e1b2e",
            padding: "15px",
            borderRadius: "10px",
            border: "2px solid #ff00c8",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{ textAlign: "center", marginBottom: "10px", color: "white" }}
          >
            Nueva Ficha – Semana {semanaSeleccionada}
          </h3>

          {/* FECHA */}
          <div style={{ marginBottom: "10px" }}>
            <label style={{ color: "white" }}>Fecha:</label>
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
              }}
            />
          </div>

          {/* JUGADORES */}
          <div style={{ marginBottom: "10px", color: "white" }}>
            <label>Jugadores:</label>

            {jugadores.map((j) => (
              <div key={j.nombre} style={{ marginBottom: "5px" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedPlayers[j.nombre]?.selected || false}
                    onChange={(e) => {
                      setSelectedPlayers((prev) => ({
                        ...prev,
                        [j.nombre]: {
                          ...(prev[j.nombre] || {}),
                          selected: e.target.checked,
                        },
                      }));
                    }}
                  />
                  {" " + j.nombre}
                </label>

                {selectedPlayers[j.nombre]?.selected && (
                  <div style={{ marginLeft: "20px", marginTop: "5px" }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedPlayers[j.nombre]?.oro || false}
                        onChange={(e) =>
                          toggleOption(j.nombre, "oro", e.target.checked)
                        }
                      />{" "}
                      Oro (+1)
                    </label>
                    <br />

                    <label>
                      <input
                        type="checkbox"
                        checked={selectedPlayers[j.nombre]?.doble || false}
                        onChange={(e) =>
                          toggleOption(j.nombre, "doble", e.target.checked)
                        }
                      />{" "}
                      Doble (+1)
                    </label>
                    <br />

                    <label>
                      <input
                        type="checkbox"
                        checked={selectedPlayers[j.nombre]?.triple || false}
                        onChange={(e) =>
                          toggleOption(j.nombre, "triple", e.target.checked)
                        }
                      />{" "}
                      Triple (+2)
                    </label>
                    <br />

                    <label>
                      <input
                        type="checkbox"
                        checked={selectedPlayers[j.nombre]?.penal1 || false}
                        onChange={(e) =>
                          toggleOption(j.nombre, "penal1", e.target.checked)
                        }
                      />{" "}
                      Penal -1
                    </label>
                    <br />

                    <label>
                      <input
                        type="checkbox"
                        checked={selectedPlayers[j.nombre]?.penal10 || false}
                        onChange={(e) =>
                          toggleOption(j.nombre, "penal10", e.target.checked)
                        }
                      />{" "}
                      Penal -10
                    </label>
                    <br />

                    <label>
                      <input
                        type="checkbox"
                        checked={selectedPlayers[j.nombre]?.nosuma || false}
                        onChange={(e) =>
                          toggleOption(j.nombre, "nosuma", e.target.checked)
                        }
                      />{" "}
                      NO SUMA (0)
                    </label>
                    <br />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* LUGAR */}
          <div style={{ marginBottom: "10px" }}>
            <label style={{ color: "white" }}>Lugar:</label>
            <input
              type="text"
              value={newEventLugar}
              onChange={(e) => setNewEventLugar(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
              }}
            />
          </div>

          {/* CONTEXTO */}
          <div style={{ marginBottom: "10px" }}>
            <label style={{ color: "white" }}>Contexto:</label>
            <input
              type="text"
              value={newEventContexto}
              onChange={(e) => setNewEventContexto(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
              }}
            />
          </div>

          {/* NOTA */}
          <div style={{ marginBottom: "10px" }}>
            <label style={{ color: "white" }}>Nota:</label>
            <input
              type="text"
              value={newEventNota}
              onChange={(e) => setNewEventNota(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
              }}
            />
          </div>

          {/* BOTONES */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={handleSaveEvent}
              style={{
                padding: "10px",
                background: "#00ff73",
                color: "black",
                fontWeight: "700",
                borderRadius: "10px",
                border: "none",
                width: "48%",
                cursor: "pointer",
              }}
            >
              GUARDAR FICHA
            </button>

            <button
              onClick={() => setAddingEvent(false)}
              style={{
                padding: "10px",
                background: "gray",
                color: "white",
                fontWeight: "700",
                borderRadius: "10px",
                border: "none",
                width: "48%",
                cursor: "pointer",
              }}
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

      {/* Lista de eventos */}
      <div className="detalle-lista">
        {(semanasDetalle[String(semanaSeleccionada)] || []).length === 0 ? (
          <p className="detalle-vacio">
            No hay puntos registrados para esta semana.
          </p>
        ) : (
          semanasDetalle[String(semanaSeleccionada)].map((evento, index) => (
            <div key={index} className="detalle-item">
              {/* CABECERA + BOTÓN BORRAR */}
              <div
                className="detalle-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div className="detalle-fecha">
                    {formatearFechaLarga(evento.fecha)}
                  </div>
                  <div className="detalle-sub">
                    {evento.opciones
                      ? (() => {
                          const sumaron = Object.entries(evento.opciones)
                            .filter(
                              ([_, opts]) =>
                                opts.selected && !opts.nosuma
                            )
                            .map(([nombre]) => nombre);

                          return sumaron.length
                            ? "Sumaron: " + sumaron.join(", ")
                            : "Sin jugadores registrados";
                        })()
                      : "Sin jugadores registrados"}
                  </div>
                </div>

                {/* BOTÓN BORRAR SOLO SI ES ADMIN */}
                {isAdminLogged && (
                  <button
                    onClick={() => borrarFicha(index)}
                    style={{
                      background: "red",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "700",
                    }}
                  >
                    X
                  </button>
                )}
              </div>

              {/* CUERPO DE LA FICHA */}
              <div className="detalle-body">
                {evento.lugar && (
                  <p>
                    <strong>Lugar:</strong> {evento.lugar}
                  </p>
                )}
                {evento.contexto && (
                  <p>
                    <strong>Contexto:</strong> {evento.contexto}
                  </p>
                )}
                {evento.nota && (
                  <p>
                    <strong>Notas:</strong> {evento.nota}
                  </p>
                )}

                {/* DETALLES SOLO SI TIENE OPCIONES MARCADAS */}
                {evento.opciones && (
                  <div style={{ marginTop: "10px", fontSize: "14px" }}>
                    <strong>Detalles por jugador:</strong>

                    {Object.entries(evento.opciones)
                      .filter(
                        ([_, opts]) =>
                          opts.oro ||
                          opts.doble ||
                          opts.triple ||
                          opts.penal1 ||
                          opts.penal10 ||
                          opts.nosuma
                      )
                      .map(([nombre, opts]) => (
                        <p key={nombre}>
                          <strong>{nombre}:</strong>{" "}
                          {opts.oro && "Oro (+1) "}
                          {opts.doble && "Doble (+1) "}
                          {opts.triple && "Triple (+2) "}
                          {opts.penal1 && "Penal -1 "}
                          {opts.penal10 && "Penal -10 "}
                          {opts.nosuma && "No Suma (0)"}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
