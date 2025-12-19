import express from "express";
import cors from "cors";
import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import os from "os";
import { spawnSync } from "child_process";

const app = express();
app.use(cors());

const PORT = Number(process.env.PORT || 8787);

const cfg = resolveConfig();

function resolveConfig() {
  const cwd = process.cwd();
  const home = os.homedir();

  const stateCandidates = [
    process.env.NETS_STATE_PATH,
    path.resolve(cwd, "../nets-cli/state.json"),
    path.resolve(cwd, "../nets/state.json"),
    path.join(home, ".nets/state.json"),
    path.resolve(cwd, "src/data/state.json")
  ].filter(Boolean);

  const tracesCandidates = [
    process.env.NETS_TRACES_DIR,
    path.resolve(cwd, "../nets-cli/traces"),
    path.resolve(cwd, "../nets/traces"),
    path.join(home, ".nets/traces")
  ].filter(Boolean);

  const fraudCandidates = [
    process.env.NETS_FRAUD_DIR,
    path.resolve(cwd, "../nets-cli/fraud"),
    path.resolve(cwd, "../nets/fraud"),
    path.join(home, ".nets/fraud")
  ].filter(Boolean);

  const agentsCandidates = [
    process.env.NETS_AGENTS_DIR,
    path.resolve(cwd, "../nets-cli/agents"),
    path.resolve(cwd, "../nets/agents")
  ].filter(Boolean);

  return {
    netsBin: process.env.NETS_BIN || "nets",
    statePath: pickFirstExisting(stateCandidates) || stateCandidates[0],
    tracesDir: pickFirstExistingDir(tracesCandidates) || tracesCandidates[0],
    fraudDir: pickFirstExistingDir(fraudCandidates) || fraudCandidates[0],
    agentsDir: pickFirstExistingDir(agentsCandidates) || agentsCandidates[0],
    historyPath: process.env.NETS_HISTORY_PATH || path.join(home, ".nets", "observer_history.jsonl")
  };
}

function pickFirstExisting(paths) {
  for (const p of paths) {
    if (!p) continue;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}

function pickFirstExistingDir(paths) {
  for (const p of paths) {
    if (!p) continue;
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p;
  }
  return null;
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function safeReadJson(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { ok: false, error: `file not found: ${filePath || "(unset)"}` };
    }
    const v = readJsonFile(filePath);
    const stat = fs.statSync(filePath);
    return { ok: true, value: v, mtimeMs: stat.mtimeMs, path: filePath };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function listJsonFilesRecursive(rootDir) {
  const out = [];
  if (!rootDir || !fs.existsSync(rootDir)) return out;

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.isFile() && ent.name.endsWith(".json")) {
        const stat = fs.statSync(p);
        out.push({ path: p, mtimeMs: stat.mtimeMs });
      }
    }
  }

  walk(rootDir);
  return out;
}

function findAgentWasm(agent) {
  if (!cfg.agentsDir) return null;

  const direct = path.isAbsolute(agent) ? agent : null;
  if (direct && fs.existsSync(direct)) return direct;

  const c1 = path.join(cfg.agentsDir, `${agent}.wasm`);
  if (fs.existsSync(c1)) return c1;

  const c2 = path.join(cfg.agentsDir, agent);
  if (fs.existsSync(c2)) return c2;

  return null;
}

function tracePath(system, agent) {
  const base = cfg.tracesDir || path.resolve(process.cwd(), "../nets-cli/traces");
  return path.join(base, system, `${agent}.json`);
}

function maybeGenerateTrace(system, agent) {
  const outPath = tracePath(system, agent);
  if (fs.existsSync(outPath)) return { ok: true, path: outPath, generated: false };

  const wasm = findAgentWasm(agent);
  if (!wasm) return { ok: false, error: `agent wasm not found for ${agent} in ${cfg.agentsDir}` };

  ensureDir(path.dirname(outPath));

  const args = ["trace", "--system", system, "--agent", agent, "--agent-wasm", wasm, "--out", outPath];
  const r = spawnSync(cfg.netsBin, args, { encoding: "utf8" });

  if (r.status !== 0) {
    return { ok: false, error: (r.stderr || r.stdout || "nets trace failed").trim() };
  }

  return { ok: true, path: outPath, generated: true };
}

function appendHistory(stateObj) {
  try {
    ensureDir(path.dirname(cfg.historyPath));
    fs.appendFileSync(
      cfg.historyPath,
      JSON.stringify({ ts: Date.now(), state: stateObj }) + "\n",
      "utf8"
    );
  } catch {
    // ignore
  }
}

function readHistory(limit = 200) {
  try {
    if (!fs.existsSync(cfg.historyPath)) return [];
    const raw = fs.readFileSync(cfg.historyPath, "utf8");
    const lines = raw.trim().split("\n").filter(Boolean);
    const slice = lines.slice(Math.max(0, lines.length - limit));
    return slice.map(l => JSON.parse(l));
  } catch {
    return [];
  }
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, cfg });
});

app.get("/api/state", (req, res) => {
  const r = safeReadJson(cfg.statePath);
  if (!r.ok) return res.status(404).json(r);
  res.json({ ok: true, state: r.value, meta: { path: r.path, mtimeMs: r.mtimeMs } });
});

app.get("/api/history", (req, res) => {
  const limit = Number(req.query.limit || 200);
  res.json({ ok: true, items: readHistory(limit) });
});

app.get("/api/traces", (req, res) => {
  const files = listJsonFilesRecursive(cfg.tracesDir || "");
  res.json({
    ok: true,
    tracesDir: cfg.tracesDir,
    files: files.map(f => ({
      path: f.path,
      rel: cfg.tracesDir ? path.relative(cfg.tracesDir, f.path) : f.path,
      mtimeMs: f.mtimeMs
    }))
  });
});

app.get("/api/trace", (req, res) => {
  const system = String(req.query.system || "");
  const agent = String(req.query.agent || "");
  if (!system || !agent) return res.status(400).json({ ok: false, error: "missing system or agent" });

  const gen = maybeGenerateTrace(system, agent);
  if (!gen.ok) return res.status(500).json(gen);

  const r = safeReadJson(gen.path);
  if (!r.ok) return res.status(500).json(r);

  res.json({ ok: true, trace: r.value, meta: { generated: gen.generated, path: gen.path, mtimeMs: r.mtimeMs } });
});

app.get("/api/fraud", (req, res) => {
  const files = listJsonFilesRecursive(cfg.fraudDir || "");
  res.json({
    ok: true,
    fraudDir: cfg.fraudDir,
    files: files.map(f => ({
      path: f.path,
      rel: cfg.fraudDir ? path.relative(cfg.fraudDir, f.path) : f.path,
      mtimeMs: f.mtimeMs
    }))
  });
});

app.get("/api/fraud-proof", (req, res) => {
  const agent = String(req.query.agent || "");
  if (!agent) return res.status(400).json({ ok: false, error: "missing agent" });

  if (!cfg.fraudDir) return res.status(404).json({ ok: false, error: "fraud dir not configured" });

  const p = path.join(cfg.fraudDir, `${agent}.json`);
  const r = safeReadJson(p);
  if (!r.ok) return res.status(404).json({ ok: false, error: `fraud proof not found: ${p}` });

  res.json({ ok: true, proof: r.value, meta: { path: r.path, mtimeMs: r.mtimeMs } });
});

/* -----------------------
   Live mode (SSE)
------------------------*/
const clients = new Set();

app.get("/api/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  res.write(`event: hello\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  clients.add(res);

  const keepAlive = setInterval(() => {
    res.write(`event: ping\ndata: ${JSON.stringify({ t: Date.now() })}\n\n`);
  }, 15000);

  req.on("close", () => {
    clearInterval(keepAlive);
    clients.delete(res);
  });
});


function broadcast(event, data) {
  const payload = JSON.stringify(data);
  for (const res of clients) {
    res.write(`event: ${event}\ndata: ${payload}\n\n`);
  }
}

function watch() {
  const watchTargets = [];

  if (cfg.statePath) watchTargets.push(cfg.statePath);
  if (cfg.tracesDir) watchTargets.push(cfg.tracesDir);
  if (cfg.fraudDir) watchTargets.push(cfg.fraudDir);

  if (watchTargets.length === 0) return;

  const watcher = chokidar.watch(watchTargets, {
    ignoreInitial: true
  });

  watcher.on("change", (p) => {
    if (cfg.statePath && p === cfg.statePath) {
      const r = safeReadJson(cfg.statePath);
      if (r.ok) appendHistory(r.value);
      broadcast("state", { path: p, ts: Date.now() });
      return;
    }

    if (cfg.tracesDir && p.startsWith(cfg.tracesDir)) {
      broadcast("trace", { path: p, ts: Date.now() });
      return;
    }

    if (cfg.fraudDir && p.startsWith(cfg.fraudDir)) {
      broadcast("fraud", { path: p, ts: Date.now() });
      return;
    }

    broadcast("change", { path: p, ts: Date.now() });
  });
}

watch();

app.listen(PORT, () => {
  console.log(`nets-web api listening on http://localhost:${PORT}`);
  console.log(cfg);
});
