import "../styles/indiceParticipacion.css";

function getEstadoParticipacion(porcentaje) {
  if (porcentaje <= 39) return { clase: "fuego", icono: "🔥" };
  if (porcentaje <= 69) return { clase: "warning", icono: "⚠️" };
  return { clase: "frio", icono: "❄️" };
}


export default function IndiceParticipacion({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ color: "#bbb", padding: "10px 4px" }}>No hay semanas con fichas todavía.</div>;
  }

return (
  <div className="participacion-wrapper">
    {data.map((j) => {
      const estado = getEstadoParticipacion(j.porcentaje);

      return (
        <div
          key={j.nombre}
          className={`participacion-row estado-${estado.clase}`}
        >
          <div className="participacion-top">
            <div className="participacion-nombre">
              <span className="participacion-ico">{estado.icono}</span>
              <span>{j.nombre}</span>
            </div>

            <div className="participacion-info">
              <span className="participacion-porc">{j.porcentaje}%</span>
              <span className="participacion-mini">
                ({j.semanasPresente}/{j.totalSemanas})
              </span>
            </div>
          </div>

          {/* BARRA (limpia, sin efectos adentro) */}
          <div className="participacion-bar-bg">
            <div
              className={`participacion-bar ${estado.clase}`}
              style={{ width: `${j.porcentaje}%` }}
            />
          </div>
        </div>
      );
    })}
  </div>
);

}
