import React, { useMemo } from "react";
import type { HistoryItem } from "../lib/types";

function pairsToObj(pairs: [string, number][]) {
  const o: Record<string, number> = {};
  for (const [k, v] of pairs) o[k] = v;
  return o;
}

export function Timeline(props: { history: HistoryItem[] }) {
  const series = useMemo(() => {
    const points = props.history.map(h => ({
      ts: h.ts,
      balances: pairsToObj(h.state.balances)
    }));

    const agents = new Set<string>();
    for (const p of points) Object.keys(p.balances).forEach(a => agents.add(a));

    return { points, agents: Array.from(agents).sort() };
  }, [props.history]);

  if (series.points.length < 2) {
    return (
      <div className="card">
        <h2>Timeline</h2>
        <div className="small">Waiting for updates. Run nets with --commit to generate state changes.</div>
      </div>
    );
  }

  const width = 760;
  const height = 180;

  const minTs = Math.min(...series.points.map(p => p.ts));
  const maxTs = Math.max(...series.points.map(p => p.ts));

  const maxBal = Math.max(
    1,
    ...series.points.flatMap(p => Object.values(p.balances))
  );

  function x(ts: number) {
    return ((ts - minTs) / (maxTs - minTs)) * (width - 20) + 10;
  }

  function y(v: number) {
    return height - ((v / maxBal) * (height - 20) + 10);
  }

  const colors = ["#6f4cff", "#00d0ff", "#2ecc71", "#f1c40f", "#ff4d4d"];

  return (
    <div className="card">
      <h2>Timeline</h2>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
        <rect x="0" y="0" width={width} height={height} fill="rgba(255,255,255,0.03)" rx="12" />
        {series.agents.map((a, idx) => {
          const color = colors[idx % colors.length];

          const pts = series.points.map(p => {
            const v = p.balances[a] ?? 0;
            return `${x(p.ts)},${y(v)}`;
          }).join(" ");

          return (
            <polyline
              key={a}
              points={pts}
              fill="none"
              stroke={color}
              strokeWidth="2"
              opacity="0.95"
            />
          );
        })}
      </svg>

      <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
        {series.agents.map((a, idx) => (
          <span key={a} className="pill" style={{ borderColor: colors[idx % colors.length] }}>
            {a}
          </span>
        ))}
      </div>

      <div className="small" style={{ marginTop: 10 }}>
        This is local observer history (appends on state.json changes).
      </div>
    </div>
  );
}
