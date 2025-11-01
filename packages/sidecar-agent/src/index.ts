import http from "http";
import os from "os";
import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import { fileURLToPath, pathToFileURL } from "url";

const execFileAsync = promisify(execFile);
const DEFAULT_PORT = Number(process.env.SIDECAR_AGENT_PORT ?? 4318);
const SERVICE_NAME = process.env.SIDECAR_AGENT_SERVICE ?? "sidecar";
const CONTROL_ENABLED = process.env.SIDECAR_AGENT_CONTROL === "1";
const TARGET_PID = Number(process.env.SIDECAR_AGENT_TARGET_PID ?? process.ppid);

async function listListeningPorts(): Promise<number[]> {
  const files = ["/proc/net/tcp", "/proc/net/tcp6"];
  const ports = new Set<number>();
  for (const file of files) {
    let content: string;
    try {
      content = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    const lines = content.trim().split(/\n+/).slice(1);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 4) continue;
      const local = parts[1];
      const state = parts[3];
      if (state !== "0A") continue;
      const [, portHex] = local.split(":");
      const port = parseInt(portHex, 16);
      if (Number.isFinite(port)) {
        ports.add(port);
      }
    }
  }
  return Array.from(ports.values()).sort((a, b) => a - b);
}

async function collectProcesses(limit = 10): Promise<Array<{ name: string; pid: number; cpu: number; mem: number }>> {
  try {
    const { stdout } = await execFileAsync("ps", ["-eo", "pid,pcpu,pmem,comm", "--no-headers", "--sort=-pcpu"]);
    const lines = stdout.trim().split(/\n+/).slice(0, limit);
    return lines
      .map((line) => line.trim().split(/\s+/, 4))
      .map(([pidStr, cpuStr, memStr, name]) => ({
        pid: Number(pidStr),
        cpu: Number(cpuStr),
        mem: Number(memStr),
        name
      }))
      .filter((entry) => Number.isFinite(entry.pid));
  } catch {
    return [];
  }
}

async function collectMetrics() {
  const processes = await collectProcesses(10);
  const cpu = processes.reduce((total, proc) => total + proc.cpu, 0);
  const memPercent = processes.reduce((total, proc) => total + proc.mem, 0);
  const ports = await listListeningPorts();
  return {
    service: SERVICE_NAME,
    status: "ok",
    cpu,
    memPercent,
    uptime: process.uptime(),
    proc: processes,
    ports,
    totalMem: os.totalmem(),
    controlEnabled: CONTROL_ENABLED
  };
}

function respondJson(res: http.ServerResponse, status: number, body: any) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data)
  });
  res.end(data);
}

function startServer(port = DEFAULT_PORT) {
  const server = http.createServer(async (req, res) => {
    const url = req.url ? new URL(req.url, "http://localhost") : null;
    const path = url?.pathname ?? "/";

    if (req.method === "GET" && path === "/healthz") {
      respondJson(res, 200, {
        status: "ok",
        service: SERVICE_NAME,
        controlEnabled: CONTROL_ENABLED,
        version: process.env.npm_package_version
      });
      return;
    }

    if (req.method === "GET" && path === "/metrics") {
      try {
        const metrics = await collectMetrics();
        respondJson(res, 200, metrics);
      } catch (error: any) {
        respondJson(res, 500, { status: "error", error: error?.message ?? String(error) });
      }
      return;
    }

    if (req.method === "POST" && path?.startsWith("/control/")) {
      if (!CONTROL_ENABLED) {
        respondJson(res, 403, { status: "disabled" });
        return;
      }
      const action = path.split("/").pop();
      const signal: NodeJS.Signals = action === "restart" ? "SIGHUP" : "SIGTERM";
      try {
        process.kill(TARGET_PID, signal);
        respondJson(res, 200, { status: "sent", action, target: TARGET_PID });
      } catch (error: any) {
        respondJson(res, 500, { status: "error", error: error?.message ?? String(error) });
      }
      return;
    }

    respondJson(res, 404, { status: "not-found" });
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`[sidecar-agent] listening on ${port} for ${SERVICE_NAME}`);
  });
}

export async function start(): Promise<void> {
  startServer();
}

const entryPath = fileURLToPath(import.meta.url);
if (process.argv[1] && pathToFileURL(process.argv[1]).href === pathToFileURL(entryPath).href) {
  if (process.env.SIDECAR_AGENT_ENABLE === "0") {
    console.log("[sidecar-agent] disabled via SIDECAR_AGENT_ENABLE=0");
  } else {
    startServer();
  }
}
