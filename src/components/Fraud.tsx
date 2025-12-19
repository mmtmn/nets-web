import React, { useMemo } from "react";
import type { FraudEnvelope, TraceFile } from "../lib/types";
import { bytesToHex, leafHash, verifyMerkleProof } from "../lib/crypto";

export function Fraud(props: {
  commitmentRoot: number[] | null;
  trace: TraceFile | null;
  fraud: FraudEnvelope | null;
  fraudError: string | null;
}) {
  const traceRootHex = props.trace ? props.trace.merkle_root_hex : null;
  const committedHex = props.commitmentRoot ? bytesToHex(props.commitmentRoot) : null;

  const mismatch = useMemo(() => {
    if (!traceRootHex || !committedHex) return null;
    return traceRootHex !== committedHex;
  }, [traceRootHex, committedHex]);

  const proofCheck = useMemo(() => {
    if (!props.fraud || !props.commitmentRoot) return null;

    const p = props.fraud.proof;
    const leaf = leafHash(p.step_index, p.obs_hash, p.action_hash);

    const path = p.merkle_path.map(x => new Uint8Array(x));
    const root = new Uint8Array(props.commitmentRoot);

    const ok = verifyMerkleProof(leaf, path, root, p.step_index);
    return { ok, step: p.step_index };
  }, [props.fraud, props.commitmentRoot]);

  return (
    <div className="card">
      <h2>Fraud</h2>

      <div className="small" style={{ marginBottom: 10 }}>
        This panel is read only. It verifies step proofs and shows mismatch against last committed root.
      </div>

      <div className="row" style={{ marginBottom: 10 }}>
        <span className="pill">commitment: {committedHex ? committedHex.slice(0, 16) + "…" : "none"}</span>
        <span className="pill">trace: {traceRootHex ? traceRootHex.slice(0, 16) + "…" : "none"}</span>
        {mismatch === null ? null : mismatch ? <span className="pill bad">mismatch</span> : <span className="pill good">match</span>}
      </div>

      {props.fraudError ? <div className="small bad">{props.fraudError}</div> : null}

      {props.fraud ? (
        <div>
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="pill">proof step: {props.fraud.proof.step_index}</span>
            {proofCheck ? (
              proofCheck.ok ? <span className="pill good">valid proof</span> : <span className="pill bad">invalid proof</span>
            ) : null}
          </div>

          <div className="small" style={{ marginBottom: 10 }}>
            Merkle path length: {props.fraud.proof.merkle_path.length}
          </div>

          <details>
            <summary className="small">show merkle path</summary>
            <pre className="small" style={{ whiteSpace: "pre-wrap" }}>
              {props.fraud.proof.merkle_path.map((p, i) => `${i}: ${bytesToHex(p)}`).join("\n")}
            </pre>
          </details>
        </div>
      ) : (
        <div className="small">
          No fraud proof file found for this agent. If you want one, run:
          <pre className="small">
            nets prove-fraud --commitment commitment.json --agent-wasm agents/AGENT.wasm --out fraud/AGENT.json
          </pre>
        </div>
      )}
    </div>
  );
}
