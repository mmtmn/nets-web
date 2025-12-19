export type U8Array32 = number[];

export type StateJson = {
  balances: [string, number][];
  bindings: Record<string, string>;
  commitments: [string, U8Array32][];
  disqualified: string[];
  wallets: Record<string, number>;
};

export type ApiState = {
  ok: true;
  state: StateJson;
  meta: { path: string; mtimeMs: number };
};

export type TraceStep = {
  step: number;
  obs: any;
  action: any;
  obs_hash: U8Array32;
  action_hash: U8Array32;
  leaf_hash: U8Array32;
};

export type TraceFile = {
  agent: string;
  system: {
    id: string;
    params: any;
    seed: number;
  };
  merkle_root: U8Array32;
  merkle_root_hex: string;
  steps: TraceStep[];
};

export type ApiTrace = {
  ok: true;
  trace: TraceFile;
  meta: { generated: boolean; path: string; mtimeMs: number };
};

export type FraudProof = {
  step_index: number;
  obs_hash: U8Array32;
  action_hash: U8Array32;
  merkle_path: U8Array32[];
};

export type FraudEnvelope = {
  proof: FraudProof;
  note?: string;
  agent?: string;
  system?: string;
};

export type ApiFraudProof = {
  ok: true;
  proof: FraudEnvelope;
  meta: { path: string; mtimeMs: number };
};

export type HistoryItem = {
  ts: number;
  state: StateJson;
};
