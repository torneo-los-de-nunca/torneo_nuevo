import "../styles/intervalosAparicion.css";

function getColorPorDias(dias) {
  if (dias >= 45) return "intervalo-muy-largo";
  if (dias >= 25) return "intervalo-largo";
  if (dias >= 10) return "intervalo-medio";
  return "intervalo-corto";
}

export default function IntervalosAparicion({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ color: "#aaa", padding: "8px 4px" }}>
        No hay datos suficientes todavía.
      </div>
    );
  }

  // 🔹 ordenar: sin intervalos primero, luego menos constante → más constante
  const dataOrdenada = [...data]
    .map((j) => {
      if (!j.intervalos || j.intervalos.length === 0) {
        return { ...j, promedio: Infinity };
      }

      const promedio =
        j.intervalos.reduce((a, b) => a + b, 0) / j.intervalos.length;

      return { ...j, promedio };
    })
    .sort((a, b) => b.promedio - a.promedio);

  return (
    <div className="intervalos-wrapper">
      {dataOrdenada.map((j) => (
        <div key={j.nombre} className="intervalos-row">
          <div className="intervalos-nombre">{j.nombre}</div>

          <div className="intervalos-lista">
            {j.intervalos.map((dias, idx) => (
              <span
                key={idx}
                className={`intervalo-chip ${getColorPorDias(dias)}`}
                title={`${dias} días sin aparecer`}
              >
                {dias}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
