import { useEffect, useState } from "react";
import jugadoresData from "../public/jugadores.json?raw";

function Admin() {
  const [permitido, setPermitido] = useState(false);
  const [jugadores, setJugadores] = useState([]);
  const [claveIngresada, setClaveIngresada] = useState("");

  const CLAVE = "LOSNUNCA2025";

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const c = urlParams.get("clave");

    if (c === CLAVE) {
      setPermitido(true);
      setJugadores(JSON.parse(jugadoresData));
    }
  }, []);

  if (!permitido) {
    return (
      <div style={{ padding: 40, color: "white" }}>
        <h2>Acceso restringido</h2>
        <p>Ingresá desde:</p>
        <p style={{ fontWeight: "bold" }}>
          /admin?clave=LOSNUNCA2025
        </p>
      </div>
    );
  }

  const handleChange = (jIndex, semanaIndex, value) => {
    const nuevo = [...jugadores];
    nuevo[jIndex].semanas[semanaIndex] = Number(value);
    setJugadores(nuevo);
  };

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h1>Panel Admin - Los de Nunca</h1>

      {jugadores.map((jug, jIndex) => (
        <div key={jug.nombre} style={{ marginBottom: 30 }}>
          <h2>{jug.nombre}</h2>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {jug.semanas.map((puntos, semanaIndex) => (
              <div key={semanaIndex}>
                <label>Sem {semanaIndex + 1}</label>
                <input
                  type="number"
                  value={puntos}
                  onChange={(e) =>
                    handleChange(jIndex, semanaIndex, e.target.value)
                  }
                  style={{
                    width: 50,
                    padding: 4,
                    fontSize: 14,
                    marginLeft: 5,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <p style={{ marginTop: 40 }}>
        ⚠️ Próximamente: Guardar cambios en Firebase (automático)
      </p>
    </div>
  );
}

export default Admin;
