import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../Firebase";
import { useAdmin } from "../context/AdminContext";
import "../styles/reglamento.css";

export default function Reglamento() {
  const { isAdmin } = useAdmin();

  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  // ===============================
  // CARGAR REGLAMENTO
  // ===============================
  useEffect(() => {
    const cargar = async () => {
      const ref = doc(db, "reglamento", "oficial");
      const snap = await getDoc(ref);

      if (snap.exists() && snap.data().bloques) {
        setBloques(snap.data().bloques);
      }

      setLoading(false);
    };

    cargar();
  }, []);

  // ===============================
  // GUARDAR
  // ===============================
  const guardar = async () => {
    await setDoc(doc(db, "reglamento", "oficial"), {
      bloques,
      updatedAt: new Date()
    });
    alert("Reglamento guardado");
  };

  // ===============================
  // ADMIN ACTIONS
  // ===============================
  const agregarBloque = () => {
    setBloques([
      ...bloques,
      {
        id: crypto.randomUUID(),
        titulo: "",
        texto: ""
      }
    ]);
  };

  const eliminarBloque = (id) => {
    setBloques(bloques.filter((b) => b.id !== id));
  };

  const moverArriba = (index) => {
    if (index === 0) return;
    const copia = [...bloques];
    [copia[index - 1], copia[index]] = [copia[index], copia[index - 1]];
    setBloques(copia);
  };

  const moverAbajo = (index) => {
    if (index === bloques.length - 1) return;
    const copia = [...bloques];
    [copia[index + 1], copia[index]] = [copia[index], copia[index + 1]];
    setBloques(copia);
  };

  if (loading) {
    return <p style={{ padding: 20 }}>Cargando…</p>;
  }

  return (
    <div className="reglamento-container">
      {/* ===== HEADER ===== */}
      <div className="reglamento-header">
        <div className="reglamento-glow"></div>

        <h1 className="reglamento-main-title">
          REGLAMENTO OFICIAL
        </h1>

        <div className="reglamento-divider"></div>

        <div className="reglamento-subtitle">
          Torneo Los de Nunca
        </div>
      </div>

      {/* ===============================
          ADMIN
      =============================== */}
      {isAdmin && (
        <>
          <button
            className="reglamento-btn"
            onClick={agregarBloque}
            style={{ marginBottom: 20 }}
          >
            ➕ Agregar sección
          </button>

          {bloques.map((b, i) => (
            <div key={b.id} className="reglamento-card">
              <input
                type="text"
                placeholder="Título"
                value={b.titulo}
                onChange={(e) => {
                  const copia = [...bloques];
                  copia[i].titulo = e.target.value;
                  setBloques(copia);
                }}
                className="reglamento-input"
              />

              <textarea
                placeholder="Texto del reglamento"
                value={b.texto}
                onChange={(e) => {
                  const copia = [...bloques];
                  copia[i].texto = e.target.value;
                  setBloques(copia);
                }}
                className="reglamento-textarea"
              />

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  className="reglamento-btn"
                  onClick={() => moverArriba(i)}
                >
                  ⬆️
                </button>

                <button
                  className="reglamento-btn"
                  onClick={() => moverAbajo(i)}
                >
                  ⬇️
                </button>

                <button
                  className="reglamento-btn delete"
                  onClick={() => eliminarBloque(b.id)}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}

          <button
            className="reglamento-btn save"
            onClick={guardar}
            style={{ marginTop: 20 }}
          >
            💾 Guardar todo
          </button>
        </>
      )}

      {/* ===============================
          USUARIO NORMAL
      =============================== */}
      {!isAdmin &&
        bloques.map((b) => {
          const abierto = openId === b.id;

          return (
            <div key={b.id} className="reglamento-card">
              <h2
                className="reglamento-title"
onClick={(e) => {
  setOpenId(abierto ? null : b.id);

  setTimeout(() => {
    e.currentTarget.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 50);
}}

              >
                <span>{b.titulo}</span>
                <span className={`flecha ${abierto ? "abierta" : ""}`}>
                  ▼
                </span>
              </h2>

              <div className={`reglamento-text ${abierto ? "open" : ""}`}>
                {b.texto}
              </div>
            </div>
          );
        })}
    </div>
  );
}
