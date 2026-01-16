import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { db } from "../Firebase";
import GraficoCarrera from "../components/GraficoCarrera";
import { HISTORICO_DATA } from "../data/historicoData";
import "../styles/historico.css";

const CANON_NAMES = {
  picante: "Picante",
  oso: "Oso",
  mistico: "Mistico",
  mstico: "Mistico",
  potencia: "Potencia",
  german: "German",
  germn: "German",
  profesor: "Profesor",
  sombra: "Sombra",
  tia: "Tia",
  ta: "Tia",
  toa: "Tia",
  navai: "Navai",
  conejo: "Conejo",
  marcelito: "Marcelito",
  gusty: "Gusty",
  falay: "Falay",
  chiquito: "Chiquito",
  pechuga: "Pechuga",
};

const COLOR_POR_JUGADOR = {
  Oso: "#00e676",
  Conejo: "#69f0ae",
  Potencia: "#2979ff",
  Picante: "#40c4ff",
  Tia: "#18ffff",
  German: "#ff9100",
  Profesor: "#a1887f",
  Mistico: "#8bc34a",
  Sombra: "#616161",
  Navai: "#9e9e9e",
  Marcelito: "#ff4081",
  Gusty: "#ffa726",
  Falay: "#ff5252",
  Chiquito: "#ffd54f",
  Pechuga: "#b388ff",
};

function nombreKey(nombre) {
  return String(nombre || "")
    .replace(/\u00a0/g, "")
    .replace(/¡/g, "i")
    .replace(/Ö/g, "i")
    .replace(/ö/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();
}

function canonNombre(nombre) {
  const key = nombreKey(nombre);
  return CANON_NAMES[key] || nombre;
}

function seasonOrder(id) {
  const match = String(id).match(/(\d{2})\/(\d{2})/);
  if (!match) return 0;
  return Number(`20${match[1]}`);
}

function buildCarrera(players) {
  const weeks = players[0]?.semanas?.length || 0;
  const acumulados = {};
  players.forEach((p) => {
    acumulados[p.nombre] = 0;
  });

  const data = [];
  for (let i = 0; i < weeks; i += 1) {
    const fila = { semana: i + 1 };
    players.forEach((p) => {
      acumulados[p.nombre] += p.semanas[i] || 0;
      fila[p.nombre] = acumulados[p.nombre];
    });
    data.push(fila);
  }
  return data;
}

function getFechaKey(fecha) {
  if (!fecha) return null;
  if (fecha instanceof Date) return fecha.toISOString().slice(0, 10);
  if (typeof fecha === "string") return fecha.slice(0, 10);
  return null;
}

function calcularTotalesActuales(semanasSnap, jugadores) {
  const totales = {};
  jugadores.forEach((j) => {
    totales[j.nombreCanon] = 0;
  });

  semanasSnap.forEach((docu) => {
    const eventos = docu.data()?.eventos || [];
    const eventosPorDia = {};

    eventos.forEach((ev) => {
      const key = getFechaKey(ev.fecha);
      if (!key || !ev.opciones) return;
      if (!eventosPorDia[key]) eventosPorDia[key] = [];
      eventosPorDia[key].push(ev);
    });

    Object.values(eventosPorDia).forEach((eventosDelDia) => {
      const baseSumada = {};

      eventosDelDia.forEach((ev) => {
        jugadores.forEach((j) => {
          const nombre = j.nombreOriginal;
          const opts = ev.opciones?.[nombre];
          if (!opts || !opts.selected) return;

          let puntos = 0;

          if (
            !baseSumada[nombre] &&
            !opts.nosuma &&
            !opts.penal1 &&
            !opts.penal10
          ) {
            puntos += 1;
            baseSumada[nombre] = true;
          }

          if (opts.oro) puntos += 1;
          if (opts.doble) puntos += 1;
          if (opts.triple) puntos += 2;

          if (opts.penal1) puntos -= 1;
          if (opts.penal10) puntos -= 10;

          totales[j.nombreCanon] += puntos;
        });
      });
    });
  });

  return totales;
}

function buildHistoricoSeries(seasonsSorted, totalesActuales, playersOrder) {
  const acumulados = {};
  playersOrder.forEach((p) => {
    acumulados[p] = 0;
  });

  const data = [{ temporada: "Inicio" }];
  playersOrder.forEach((p) => {
    data[0][p] = 0;
  });
  seasonsSorted.forEach((season) => {
    const fila = { temporada: season.id };
    const totalesSeason = season.players.reduce((acc, p) => {
      acc[p.nombre] = (acc[p.nombre] || 0) + p.total;
      return acc;
    }, {});

    playersOrder.forEach((p) => {
      acumulados[p] += totalesSeason[p] || 0;
      fila[p] = acumulados[p];
    });
    data.push(fila);
  });

  const filaActual = { temporada: "Actual" };
  playersOrder.forEach((p) => {
    acumulados[p] += totalesActuales[p] || 0;
    filaActual[p] = acumulados[p];
  });
  data.push(filaActual);

  return data;
}

function TooltipHistorico({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const ordenados = [...payload]
    .filter((p) => typeof p.value === "number")
    .sort((a, b) => b.value - a.value);

  return (
    <div className="tooltip-twitch">
      <div className="tooltip-title">Temporada {label}</div>
      {ordenados.map((p) => (
        <div key={p.dataKey} className="tooltip-row">
          <span className="tooltip-name">{p.dataKey}</span>
          <span className="tooltip-value">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function HistoricoTabla({ season }) {
  const semanasArray = Array.from(
    { length: season.weeks },
    (_, i) => i + 1
  );

  return (
    <div className="historico-table-wrap">
      <table className="historico-table">
        <thead>
          <tr>
            <th>JUGADOR</th>
            <th>TOTAL</th>
            {season.months.map((mes) => (
              <th
                key={mes.nombre + mes.desde}
                colSpan={mes.hasta - mes.desde + 1}
              >
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
          {season.players.map((p, idx) => (
            <tr key={p.nombre}>
              <td className="cell-name">
                {idx + 1} {p.nombre}
              </td>
              <td className="cell-total">{p.total}</td>
              {semanasArray.map((sem, i) => (
                <td key={sem}>{p.semanas[i] ?? 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Historico() {
  const [jugadores, setJugadores] = useState([]);
  const [semanasSnapshot, setSemanasSnapshot] = useState([]);
  const [openSeasonId, setOpenSeasonId] = useState(null);

  useEffect(() => {
    fetch("/jugadores.json")
      .then((res) => res.json())
      .then((data) => setJugadores(data));
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "semanas"), (snap) => {
      setSemanasSnapshot(snap.docs);
    });
    return () => unsub();
  }, []);

  const jugadoresCanon = useMemo(
    () =>
      jugadores.map((j) => ({
        nombreOriginal: j.nombre,
        nombreCanon: canonNombre(j.nombre),
      })),
    [jugadores]
  );

  const seasonsSorted = useMemo(() => {
    const seasons = HISTORICO_DATA.seasons.map((s) => {
      const players = s.players.map((p) => {
        const nombre = canonNombre(p.nombre);
        return { ...p, nombre };
      });
      const ordered = [...players].sort((a, b) => b.total - a.total);
      return {
        ...s,
        titulo: `Torneo ${s.id}`,
        players: ordered,
        carrera: buildCarrera(ordered),
        podium: ordered.slice(0, 3),
        champion: ordered[0],
      };
    });

    return seasons.sort((a, b) => seasonOrder(a.id) - seasonOrder(b.id));
  }, []);

  const totalesActuales = useMemo(() => {
    if (!jugadoresCanon.length || !semanasSnapshot.length) return {};
    return calcularTotalesActuales(semanasSnapshot, jugadoresCanon);
  }, [jugadoresCanon, semanasSnapshot]);

  const rankingGlobal = useMemo(() => {
    const totals = {};

    seasonsSorted.forEach((s) => {
      s.players.forEach((p) => {
        totals[p.nombre] = (totals[p.nombre] || 0) + p.total;
      });
    });

    Object.entries(totalesActuales).forEach(([nombre, total]) => {
      totals[nombre] = (totals[nombre] || 0) + total;
    });

    return Object.entries(totals)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);
  }, [seasonsSorted, totalesActuales]);

  const historicoSeries = useMemo(() => {
    if (!seasonsSorted.length) return [];
    const playersOrder = rankingGlobal.map((p) => p.nombre);
    return buildHistoricoSeries(
      seasonsSorted,
      totalesActuales,
      playersOrder
    );
  }, [seasonsSorted, totalesActuales, rankingGlobal]);

  return (
    <div className="historico-page">
      <header className="historico-hero">
        <div className="hero-title">Historico de Torneos</div>
        <div className="hero-sub">
          Campeones por temporada y tablas completas
        </div>
      </header>

      <section className="champions-section">
        <div className="section-title">Campeones</div>
        <div className="champions-grid">
          {seasonsSorted.map((season) => (
            <div key={season.id} className="champion-card">
              <div className="champion-top">
                <div className="champion-year">{season.id}</div>
                <div className="champion-cup">🏆</div>
              </div>
              <div className="champion-name">
                {season.champion?.nombre || "Sin datos"}
                {season.id === "23/24" && season.champion?.nombre === "Oso"
                  ? " (no participa)"
                  : ""}
              </div>
              <div className="podium">
                {season.podium.map((p, idx) => (
                  <div key={p.nombre} className={`podium-item p-${idx + 1}`}>
                    <span className="podium-rank">{idx + 1}</span>
                    <span className="podium-name">{p.nombre}</span>
                    <span className="podium-score">{p.total}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="historico-total">
        <div className="section-title">Puntaje historico total</div>
        <div className="historico-total-grid">
          <div className="total-table">
            <table className="miniTable">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {rankingGlobal.map((p, idx) => (
                  <tr key={p.nombre}>
                    <td className="miniName">
                      {idx + 1}. {p.nombre}
                    </td>
                    <td className="miniNum">{p.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="total-chart">
            <div className="chart-title">Grafico historico</div>
            {historicoSeries.length === 0 ? (
              <div className="chart-empty">Sin datos suficientes.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={historicoSeries}>
                  <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
                  <XAxis dataKey="temporada" tick={{ fill: "#aaa" }} interval={0} />
                  <YAxis tick={{ fill: "#aaa" }} />
                  <Tooltip
                    content={<TooltipHistorico />}
                    allowEscapeViewBox={{ x: true, y: true }}
                    wrapperStyle={{ zIndex: 20, pointerEvents: "none" }}
                  />
                  {rankingGlobal.map((p) => (
                    <Line
                      key={p.nombre}
                      type="monotone"
                      dataKey={p.nombre}
                      stroke={COLOR_POR_JUGADOR[p.nombre] || "#ffffff"}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="seasons-section">
        <div className="section-title">Temporadas</div>
        {seasonsSorted.map((season) => {
          const abierto = openSeasonId === season.id;
          return (
            <div key={season.id} className="season-card">
              <div
                className="season-header"
                onClick={() =>
                  setOpenSeasonId(abierto ? null : season.id)
                }
              >
                <div className="season-title">{season.titulo}</div>
                <div className="season-arrow">{abierto ? "▲" : "▼"}</div>
              </div>

              {abierto && (
                <div className="season-body">
                  <HistoricoTabla season={season} />
                  <div className="season-chart">
                    <div className="chart-title">Carrera de puntos</div>
                    <GraficoCarrera
                      data={season.carrera}
                      jugadores={season.players}
                      colorMap={COLOR_POR_JUGADOR}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
