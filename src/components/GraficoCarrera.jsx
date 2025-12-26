import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Brush,
} from "recharts";

// ===============================
// COLORES (vivos y consistentes)
// ===============================
const coloresPorJugador = {
  Oso: "#00e676",
  Conejo: "#69f0ae",

  Potencia: "#2979ff",
  Picante: "#40c4ff",

  Tía: "#18ffff",

  Germán: "#ff9100",
  Profesor: "#a1887f",
  Místico: "#8bc34a",

  Sombra: "#616161",
  Navai: "#9e9e9e",

  Marcelito: "#ff4081",
};

// ===============================
// TOOLTIP ORDENADO
// ===============================
function TooltipOrdenado({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const ordenados = [...payload]
    .filter((p) => typeof p.value === "number")
    .sort((a, b) => b.value - a.value);

  return (
    <div className="tooltip-twitch">
      <div className="tooltip-title">Semana {label}</div>

      {ordenados.map((p, i) => (
        <div
          key={p.dataKey}
          className="tooltip-row"
          style={{ color: p.value < 0 ? "#ff5252" : p.stroke }}
        >
          <span className="tooltip-name">
            {i + 1}. {p.dataKey}
          </span>
          <span className="tooltip-value">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ===============================
// LEYENDA (grid prolija)
// ===============================
function LegendGrid({ jugadores }) {
  return (
    <div className="legend-grid">
      {jugadores.map((j) => (
        <div key={j.nombre} className="legend-item">
          <span
            className="legend-dot"
            style={{ backgroundColor: coloresPorJugador[j.nombre] || "#fff" }}
          />
          <span className="legend-name">{j.nombre}</span>
        </div>
      ))}
    </div>
  );
}

// ===============================
// COMPONENTE PRINCIPAL
// ===============================
export default function GraficoCarrera({ data, jugadores }) {
  const [mostrarLeyenda, setMostrarLeyenda] = useState(false);

  if (!data || data.length === 0) return null;

  return (
    <div className="grafico-carrera-container">
      {/* GRAFICO */}
      <div className="grafico-wrapper">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={data}
            margin={{ top: 18, right: 18, left: 0, bottom: 8 }}
          >
            <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />
            <XAxis dataKey="semana" tick={{ fill: "#aaa" }} />
            <YAxis tick={{ fill: "#aaa" }} />

            <Tooltip
              content={<TooltipOrdenado />}
              cursor={{ stroke: "#555", strokeDasharray: "3 3" }}
              wrapperStyle={{
                outline: "none",
                pointerEvents: "none", // 👈 no molesta al tocar/arrastrar
              }}
              offset={18} // 👈 lo separa del cursor
              allowEscapeViewBox={{ x: true, y: true }}
            />

            {jugadores.map((j) => (
              <Line
                key={j.nombre}
                type="monotone"
                dataKey={j.nombre}
                stroke={coloresPorJugador[j.nombre] || "#ffffff"}
                strokeWidth={3}
                dot={false}
                isAnimationActive
              />
            ))}

            <Brush dataKey="semana" height={22} travellerWidth={10} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* TOGGLE LEYENDA */}
      <button
        type="button"
        className="legend-toggle"
        onClick={() => setMostrarLeyenda((v) => !v)}
      >
        🎨 Jugadores {mostrarLeyenda ? "▲" : "▼"}
      </button>

      {/* LEYENDA */}
      {mostrarLeyenda && <LegendGrid jugadores={jugadores} />}
    </div>
  );
}
