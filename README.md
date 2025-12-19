# nets-web

**nets-web** is a read-only browser interface for observing and replaying executions produced by **nets**.

It visualizes agent performance, balances, wallet bindings, deterministic match replays, Merkle commitments, and fraud proofs — without mutating or influencing system state.

This repository is intentionally non-authoritative.

---

## What this is

- A **local observer** for nets
- A **visual replay engine** for Snake, Chess, and Rock–Paper–Scissors
- A **fraud inspection tool** for step-level Merkle proofs
- A **timeline viewer** for balances and evolution over time

The web UI does **not** execute agents, modify balances, or settle outcomes.

All authority lives in:
- `nets-core` (rules and verification)
- `nets-cli` (execution and persistence)

---

## Architecture

```

nets-core  →  truth
nets-cli   →  execution + state mutation
nets-web   →  visualization only

```

Data flow:

```

nets-cli run / trace / prove-fraud
↓
state.json, traces/, fraud/
↓
nets-web (read-only)

````

---

## Features

- Agent and wallet dashboards
- Deterministic replay with step slider
- System-specific visualization:
  - Snake grid
  - Chess board (with illegal move detection)
  - RPS round history
- Merkle commitment inspection
- Fraud proof verification and explanation
- Live updates via Server-Sent Events
- Local timeline of balance evolution

---

## Running locally

### Prerequisites
- Node.js ≥ 18
- `nets` binary available in `$PATH`
- A populated `state.json` from `nets-cli`

### Setup

```bash
npm install
````

### Environment variables (recommended)

```bash
export NETS_STATE_PATH=../nets-cli/state.json
export NETS_AGENTS_DIR=../nets-cli/agents
export NETS_TRACES_DIR=../nets-cli/traces
export NETS_FRAUD_DIR=../nets-cli/fraud
export NETS_BIN=nets
```

### Start observer

```bash
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

---

## Security model

* No private keys
* No execution authority
* No hidden state
* No trust assumptions

If the UI lies, the data proves it wrong.

---

## Status

This is an early but complete observer for nets v0.

Future work may include:

* multi-run history views
* shareable replay links
* visual Merkle tree explorers
* optional hosted mode

---

## License

MIT
