import { useState, useEffect } from "react";
import {
  TEMPORADAS_ORO,
  PARTICIPACION_ORO,
  ESTADOS_ORO,
} from "../data/participacionOro";
import { useAdmin } from "../context/AdminContext";
import "../styles/participacionOro.css";

import { db } from "../Firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

/* ===============================
   FIRESTORE DOC
================================ */
const ORO_DOC_REF = doc(db, "config", "participacionOro");

/* ===============================
   ICONOS
================================ */
const ICONO_ESTADO = {
  "✓": "👑",
  "✕": "❌",
  "○": "🚫",
  "—": "➖",
};

/* ===============================
   FUNCION PURA RESUMEN
================================ */
function calcularResumen(jugadorData) {
  let total = 0;
  let participo = 0;

  TEMPORADAS_ORO.forEach((t) => {
    Object.values(jugadorData[t]).forEach((v) => {
      const esValida = v === "✓" || v === "✕";
      if (esValida) total++;
      if (v === "✓") participo++;
    });
  });

  return { total, participo };
}

export default function ParticipacionOro() {
  const { isAdmin } = useAdmin();
  const [jugadorActivo, setJugadorActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(PARTICIPACION_ORO);

  /* ===============================
     CARGA FIRESTORE
  ================================ */
  useEffect(() => {
    const cargar = async () => {
      try {
        const snap = await getDoc(ORO_DOC_REF);
        if (snap.exists()) {
          const remoto = snap.data()?.data;
          if (remoto) setData(remoto);
        } else {
          await setDoc(ORO_DOC_REF, {
            data: PARTICIPACION_ORO,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (e) {
        console.error("Error Firestore:", e);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const siguienteEstado = (actual) => {
    const idx = ESTADOS_ORO.indexOf(actual);
    return ESTADOS_ORO[(idx + 1) % ESTADOS_ORO.length];
  };

  const cambiarEstado = async (jugador, temporada, cumple) => {
    if (!isAdmin) return;

    setData((prev) => {
      const nuevo = {
        ...prev,
        [jugador]: {
          ...prev[jugador],
          [temporada]: {
            ...prev[jugador][temporada],
            [cumple]: siguienteEstado(
              prev[jugador][temporada][cumple]
            ),
          },
        },
      };

      updateDoc(ORO_DOC_REF, {
        data: nuevo,
        updatedAt: serverTimestamp(),
      }).catch(console.error);

      return nuevo;
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 20, color: "#fff" }}>
        Cargando participación oro...
      </div>
    );
  }

  return (
    <div>
      {Object.keys(data).map((jugador) => {
        const resumen = calcularResumen(data[jugador]);

        return (
          <div key={jugador} className="oro-jugador">
            <div
              className="oro-jugador-header"
              onClick={() =>
                setJugadorActivo(
                  jugadorActivo === jugador ? null : jugador
                )
              }
            >
              <span className="oro-nombre">{jugador}</span>

              <span className="oro-resumen">
                👑 {resumen.participo}/{resumen.total}
              </span>

              <span className="oro-flecha">
                {jugadorActivo === jugador ? "▲" : "▼"}
              </span>
            </div>

            {jugadorActivo === jugador && (
              <div className="oro-jugador-content">
                <div className="oro-temporadas">
                  <span />
                  {TEMPORADAS_ORO.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>

                {Object.keys(
                  data[jugador][TEMPORADAS_ORO[0]]
                ).map((cumple) => (
                  <div key={cumple} className="oro-fila">
                    <span className="oro-cumple">
                      {cumple}
                    </span>

                    {TEMPORADAS_ORO.map((t) => {
                      const estado = data[jugador][t][cumple];
                      return (
                        <span
                          key={t}
                          className={`oro-celda estado-${estado} ${
                            isAdmin ? "admin" : ""
                          }`}
                          onClick={() =>
                            cambiarEstado(jugador, t, cumple)
                          }
                        >
                          {ICONO_ESTADO[estado]}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
