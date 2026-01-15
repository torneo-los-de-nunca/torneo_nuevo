import { useMemo } from "react";
import "../styles/rankingLugares.css";

function normalizarLugar(valor) {
  if (!valor || typeof valor !== "string") return null;

  const limpio = valor.trim().replace(/\s+/g, " ");
  if (!limpio) return null;

  return {
    key: limpio.toLowerCase(),
    label: limpio,
  };
}

export default function RankingLugares({ eventos }) {
  const ranking = useMemo(() => {
    const mapa = new Map();

    (eventos || []).forEach((ev) => {
      const lugar = typeof ev?.lugar === "string" ? ev.lugar : "";
      if (!lugar) return;

      const partes = lugar
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      partes.forEach((parte) => {
        const normal = normalizarLugar(parte);
        if (!normal) return;

        if (!mapa.has(normal.key)) {
          mapa.set(normal.key, { ...normal, count: 0 });
        }

        mapa.get(normal.key).count += 1;
      });
    });

    const items = Array.from(mapa.values());
    items.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    return items;
  }, [eventos]);

  if (!ranking.length) {
    return (
      <div style={{ color: "#aaa", padding: "8px 4px" }}>
        No hay lugares registrados todavia.
      </div>
    );
  }

  const maxCount = ranking[0].count || 1;

  return (
    <div className="ranking-lugares">
      {ranking.map((item, idx) => {
        const pct = Math.round((item.count / maxCount) * 100);

        return (
          <div key={item.key} className="ranking-row">
            <div className="ranking-top">
              <div className="ranking-left">
                <span className="ranking-rank">{idx + 1}</span>
                <span className="ranking-name">{item.label}</span>
              </div>
              <div className="ranking-count">{item.count}</div>
            </div>

            <div className="ranking-bar-bg">
              <div
                className="ranking-bar-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
