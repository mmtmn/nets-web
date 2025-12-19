import React from "react";

export function RpsView(props: { steps: any[]; idx: number }) {
  const actions = props.steps.slice(0, props.idx + 1).map(s => String(s.action));

  const rounds: { a: string; b: string; r: number }[] = [];
  for (let i = 0; i + 1 < actions.length; i += 2) {
    rounds.push({ a: actions[i], b: actions[i + 1], r: Math.floor(i / 2) });
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="pill">RPS</span>
        <span className="pill">pairs: {rounds.length}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Round</th>
            <th>P1</th>
            <th>P2</th>
          </tr>
        </thead>
        <tbody>
          {rounds.slice(Math.max(0, rounds.length - 12)).map(r => (
            <tr key={r.r}>
              <td>{r.r}</td>
              <td>{r.a}</td>
              <td>{r.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="small" style={{ marginTop: 10 }}>
        Your current RPS system uses the agent to emit both players sequentially (pending then resolve).
      </div>
    </div>
  );
}
