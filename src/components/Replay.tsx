import React, { useMemo, useState } from "react";
import type { TraceFile } from "../lib/types";
import { SnakeView } from "./SnakeView";
import { ChessView } from "./ChessView";
import { RpsView } from "./RpsView";

export function Replay(props: {
  trace: TraceFile | null;
  loading: boolean;
  status: string;
}) {
  const [idx, setIdx] = useState(0);

  const max = props.trace ? Math.max(0, props.trace.steps.length - 1) : 0;

  // clamp if trace changes
  useMemo(() => {
    if (idx > max) setIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max]);

  if (props.loading) {
    return (
      <div className="card">
        <h2>Replay</h2>
        <div className="small">{props.status || "loading trace"}</div>
      </div>
    );
  }

  if (!props.trace) {
    return (
      <div className="card">
        <h2>Replay</h2>
        <div className="small">Select an agent, then pick a system.</div>
      </div>
    );
  }

  const step = props.trace.steps[idx];

  return (
    <div className="card">
      <h2>Replay</h2>

      <div className="row" style={{ marginBottom: 10 }}>
        <span className="pill">agent: {props.trace.agent}</span>
        <span className="pill">system: {props.trace.system.id}</span>
        <span className="pill">steps: {props.trace.steps.length}</span>
      </div>

      <input
        type="range"
        min={0}
        max={max}
        value={idx}
        onChange={e => setIdx(Number(e.target.value))}
      />

      <div className="row" style={{ marginTop: 10, marginBottom: 12 }}>
        <span className="pill">step {step.step}</span>
      </div>

      {props.trace.system.id === "snake" ? (
        <SnakeView
          width={Number(props.trace.system.params?.width ?? 10)}
          height={Number(props.trace.system.params?.height ?? 10)}
          obs={step.obs}
          action={step.action}
        />
      ) : null}

      {props.trace.system.id === "chess" ? (
        <ChessView steps={props.trace.steps} idx={idx} />
      ) : null}

      {props.trace.system.id === "rps" ? (
        <RpsView steps={props.trace.steps} idx={idx} />
      ) : null}
    </div>
  );
}
