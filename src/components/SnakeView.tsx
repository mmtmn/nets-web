import React from "react";

function asNumPair(x: any): [number, number] | null {
  if (!Array.isArray(x) || x.length < 2) return null;
  const a = Number(x[0]);
  const b = Number(x[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return [a, b];
}

export function SnakeView(props: {
  width: number;
  height: number;
  obs: any;
  action: any;
}) {
  // snake obs is typically: [[hx,hy],[ax,ay], body]
  const head = asNumPair(props.obs?.[0]);
  const apple = asNumPair(props.obs?.[1]);
  const bodyRaw = props.obs?.[2];
  const body: [number, number][] = Array.isArray(bodyRaw) ? bodyRaw.map(asNumPair).filter(Boolean) as any : [];

  const W = props.width;
  const H = props.height;

  const cellSize = 18;
  const style = {
    display: "grid",
    gridTemplateColumns: `repeat(${W}, ${cellSize}px)`,
    gap: "2px",
    background: "rgba(255,255,255,0.06)",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)"
  } as const;

  function at(x: number, y: number, p: [number, number] | null) {
    return p && p[0] === x && p[1] === y;
  }

  function inBody(x: number, y: number) {
    return body.some(p => p[0] === x && p[1] === y);
  }

  const cells = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let bg = "rgba(255,255,255,0.06)";
      if (at(x, y, apple)) bg = "rgba(255, 77, 77, 0.90)";
      if (inBody(x, y)) bg = "rgba(46, 204, 113, 0.45)";
      if (at(x, y, head)) bg = "rgba(46, 204, 113, 0.95)";

      cells.push(
        <div
          key={`${x}:${y}`}
          title={`${x},${y}`}
          style={{
            width: cellSize,
            height: cellSize,
            borderRadius: 4,
            background: bg
          }}
        />
      );
    }
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="pill">Snake</span>
        <span className="pill">action: {String(props.action)}</span>
      </div>
      <div style={style}>{cells}</div>
    </div>
  );
}
