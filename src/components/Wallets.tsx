import React from "react";

export function Wallets(props: {
  wallets: Record<string, number>;
}) {
  const keys = Object.keys(props.wallets).sort();

  return (
    <div className="card">
      <h2>Wallets</h2>
      <table>
        <thead>
          <tr>
            <th>Wallet</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {keys.map(w => (
            <tr key={w}>
              <td>{w}</td>
              <td>{props.wallets[w]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
