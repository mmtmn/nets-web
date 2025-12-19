import React from "react";

export function Agents(props: {
  balances: Record<string, number>;
  bindings: Record<string, string>;
  selectedAgent: string | null;
  onSelect: (a: string) => void;
}) {
  const agents = Object.keys(props.balances).sort();

  return (
    <div className="card">
      <h2>Agents</h2>
      <table>
        <thead>
          <tr>
            <th>Agent</th>
            <th>Balance</th>
            <th>Wallet</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(a => {
            const selected = props.selectedAgent === a;
            return (
              <tr key={a} onClick={() => props.onSelect(a)} style={{ cursor: "pointer" }}>
                <td>
                  <span className="pill" style={{ borderColor: selected ? "rgba(111,76,255,0.8)" : undefined }}>
                    {a}
                  </span>
                </td>
                <td>{props.balances[a]}</td>
                <td className="small">{props.bindings[a] || "unbound"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="small" style={{ marginTop: 10 }}>
        Click an agent to open replay and fraud panels.
      </div>
    </div>
  );
}
