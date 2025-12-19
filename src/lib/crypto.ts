import { sha256 } from "@noble/hashes/sha256";

export function bytesToHex(bytes: number[]) {
  return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function u64ToLeBytes(n: number) {
  const out = new Uint8Array(8);
  let x = BigInt(n);
  for (let i = 0; i < 8; i++) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return out;
}

export function hashPair(a: Uint8Array, b: Uint8Array) {
  const x = new Uint8Array(a.length + b.length);
  x.set(a, 0);
  x.set(b, a.length);
  return sha256(x);
}

export function verifyMerkleProof(leaf: Uint8Array, path: Uint8Array[], root: Uint8Array, index: number) {
  let h = leaf;
  let idx = index;

  for (const sib of path) {
    h = (idx % 2 === 0) ? hashPair(h, sib) : hashPair(sib, h);
    idx = Math.floor(idx / 2);
  }

  return equals(h, root);
}

export function equals(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function leafHash(stepIndex: number, obsHash: number[], actionHash: number[]) {
  const stepBytes = u64ToLeBytes(stepIndex);
  const obs = new Uint8Array(obsHash);
  const act = new Uint8Array(actionHash);
  const buf = new Uint8Array(8 + 32 + 32);
  buf.set(stepBytes, 0);
  buf.set(obs, 8);
  buf.set(act, 40);
  return sha256(buf);
}

export function buildMerkleRoot(leaves: Uint8Array[]) {
  if (leaves.length === 0) return sha256(new Uint8Array([]));

  let level = leaves.slice();
  while (level.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = (i + 1 < level.length) ? level[i + 1] : level[i];
      next.push(hashPair(left, right));
    }
    level = next;
  }
  return level[0];
}
