import type { ApiState, ApiTrace, ApiFraudProof } from "./types";

export async function fetchState(): Promise<ApiState> {
  const r = await fetch("/api/state");
  if (!r.ok) throw new Error(`state fetch failed: ${r.status}`);
  return r.json();
}

export async function fetchTrace(system: string, agent: string): Promise<ApiTrace> {
  const url = `/api/trace?system=${encodeURIComponent(system)}&agent=${encodeURIComponent(agent)}`;
  const r = await fetch(url);
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`trace fetch failed: ${r.status} ${t}`);
  }
  return r.json();
}

export async function fetchFraudProof(agent: string): Promise<ApiFraudProof> {
  const url = `/api/fraud-proof?agent=${encodeURIComponent(agent)}`;
  const r = await fetch(url);
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t);
  }
  return r.json();
}

export async function fetchHistory(limit = 200) {
  const r = await fetch(`/api/history?limit=${limit}`);
  if (!r.ok) return { ok: false as const, items: [] };
  return r.json() as Promise<{ ok: true; items: any[] }>;
}

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8787";

export function openEvents(onEvent: (evt: MessageEvent) => void) {
  const es = new EventSource(`${API_BASE}/api/events`);

  es.addEventListener("state", onEvent);
  es.addEventListener("trace", onEvent);
  es.addEventListener("fraud", onEvent);

  es.onerror = (e) => {
    console.warn("SSE connection error", e);
  };

  return es;
}
