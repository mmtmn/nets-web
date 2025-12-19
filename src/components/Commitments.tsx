import React from "react";
import { bytesToHex } from "../lib/crypto";

export function Commitments(props: {
  commitments: Record<string, number[]>;
}) {
  const agents = Object.keys(props.commitments).sort();

  return (
    <div className="card">
      <h2>Commitments</h2>
      <table>
        <thead>
          <tr>
            <th>Agent</th>
            <th>Merkle root</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(a => (
            <tr key={a}>
              <td>{a}</td>
                <td className="small mono hash-cell">
                {bytesToHex(props.commitments[a])}
                </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="small" style={{ marginTop: 10 }}>
        These are last committed roots in state.json.
      </div>
    </div>
  );
}
