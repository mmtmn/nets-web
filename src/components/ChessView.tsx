import React, { useMemo } from "react";
import { Chess } from "chess.js";

/**
 * nets index (0..63) → chess.js square
 * 0 = a8, 7 = h8, 56 = a1, 63 = h1
 */
function idxToSquare(i: number) {
  const file = "abcdefgh"[i % 8];
  const rank = 8 - Math.floor(i / 8);
  return `${file}${rank}`;
}

function promo(p: number) {
  if (p === 1) return "q";
  if (p === 2) return "r";
  if (p === 3) return "b";
  if (p === 4) return "n";
  return undefined;
}

export function ChessView(props: { steps: any[]; idx: number }) {
  const { chess, lastMove, illegalAt, error } = useMemo(() => {
    const c = new Chess();
    let last: any = null;
    let illegal: number | null = null;
    let err: string | null = null;

    for (let i = 0; i <= props.idx && i < props.steps.length; i++) {
      const a = props.steps[i]?.action;
      const from = Number(a?.from);
      const to = Number(a?.to);
      const pr = Number(a?.promotion ?? 0);

      if (!Number.isFinite(from) || !Number.isFinite(to)) continue;

      const move = {
        from: idxToSquare(from),
        to: idxToSquare(to),
        promotion: promo(pr),
      };

      try {
        const r = c.move(move as any);
        if (!r) {
          illegal = i;
          break;
        }
        last = move;
      } catch (e: any) {
        illegal = i;
        err = String(e?.message || e);
        break;
      }
    }

    return { chess: c, lastMove: last, illegalAt: illegal, error: err };
  }, [props.idx, props.steps]);

  const board = chess.board();

  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="pill">Chess</span>

        {illegalAt !== null ? (
          <span className="pill bad">
            illegal move at step {illegalAt}
          </span>
        ) : (
          <span className="pill good">moves ok</span>
        )}

        {lastMove && (
          <span className="pill">
            last: {lastMove.from}
            {lastMove.to}
          </span>
        )}
      </div>

      {error && (
        <div className="small bad" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 44px)",
          gap: "2px",
          padding: 10,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
        }}
      >
        {board.flat().map((sq, i) => {
          const x = i % 8;
          const y = Math.floor(i / 8);
          const dark = (x + y) % 2 === 1;

          const piece = sq ? pieceChar(sq.type, sq.color) : "";
          return (
            <div
              key={i}
              style={{
                width: 44,
                height: 44,
                borderRadius: 6,
                background: dark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(255,255,255,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              {piece}
            </div>
          );
        })}
      </div>

      <div className="small" style={{ marginTop: 10 }}>
        Board reconstructed deterministically using chess.js.
        Illegal moves are highlighted instead of crashing.
      </div>
    </div>
  );
}

function pieceChar(t: string, c: string) {
  const white = c === "w";
  if (t === "p") return white ? "♙" : "♟";
  if (t === "n") return white ? "♘" : "♞";
  if (t === "b") return white ? "♗" : "♝";
  if (t === "r") return white ? "♖" : "♜";
  if (t === "q") return white ? "♕" : "♛";
  if (t === "k") return white ? "♔" : "♚";
  return "";
}
