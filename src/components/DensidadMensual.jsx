import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/*
  DENSIDAD MENSUAL DE JUNTADAS
  - Suma 1 punto por persona distinta por día
  - Máximo 1 punto por persona por día
  - Solo si está selected
  - NO suma: nosuma / penal1 / penal10
  - Oro / doble / triple suman 1 igual
  - Ordenado por fecha real (no alfabético)
*/

function calcularDensidadMensual(eventos, jugadores) {
  const meses = {};

  eventos.forEach((ev) => {
    if (!(ev.fecha instanceof Date)) return;

    const year = ev.fecha.getFullYear();
    const month = ev.fecha.getMonth(); // 0-11
    const keyMes = `${year}-${month}`;

    if (!meses[keyMes]) {
      meses[keyMes] = {
        mes: ev.fecha.toLocaleDateString("es-AR", {
          month: "long",
          year: "numeric",
        }),
        fechaOrden: new Date(year, month, 1),
        dias: {}, // { "Mon Dec 02 2025": Set() }
      };
    }

const keyDia = ev.fecha.toISOString().slice(0, 10);

    if (!meses[keyMes].dias[keyDia]) {
      meses[keyMes].dias[keyDia] = new Set();
    }

    jugadores.forEach((j) => {
      const opts = ev.opciones?.[j.nombre];
if (!opts || !opts.selected) return;

      // ❌ NO cuentan penalizaciones ni no suma
      if (opts.nosuma || opts.penal1 || opts.penal10) return;

      // ✅ Cuenta solo 1 vez por día
      meses[keyMes].dias[keyDia].add(j.nombre);
    });
  });

  return Object.values(meses)
    .map((m) => {
      let total = 0;
      Object.values(m.dias).forEach((set) => {
        total += set.size;
      });

      return {
        mes: m.mes,
        fechaOrden: m.fechaOrden,
        valor: total,
      };
    })
    .sort((a, b) => a.fechaOrden - b.fechaOrden);
}

export default function DensidadMensual({ eventos, jugadores }) {
  if (!eventos || !jugadores || eventos.length === 0) {
    return (
      <div style={{ color: "#aaa", padding: "8px 4px" }}>
        No hay datos suficientes todavía.
      </div>
    );
  }

  const data = calcularDensidadMensual(eventos, jugadores);

  if (data.length === 0) {
    return (
      <div style={{ color: "#aaa", padding: "8px 4px" }}>
        No hay actividad registrada aún.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#333" strokeDasharray="3 3" />
          <XAxis
            dataKey="mes"
            tick={{ fill: "#ccc", fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: "#ccc", fontSize: 11 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0f0f1a",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value) => [`${value}`, "Apariciones"]}
          />
          <Line
            type="monotone"
            dataKey="valor"
            stroke="#b44cff"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
