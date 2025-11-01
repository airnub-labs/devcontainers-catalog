import fs from "fs-extra";
import path from "path";

type SidecarDescriptor = { name: string; agentPort: number; control?: boolean };

type MetricsProcess = { name: string; pid: number; cpu: number; mem: number };

export type SidecarMetrics = {
  service: string;
  status: "ok" | "error";
  uptime?: number;
  cpu?: number;
  memory?: number;
  processes?: MetricsProcess[];
  ports?: number[];
  controlEnabled?: boolean;
  error?: string;
};

async function readDevcontainer(workspaceRoot: string): Promise<any> {
  const devcontainerPath = path.join(workspaceRoot, ".devcontainer", "devcontainer.json");
  try {
    return await fs.readJson(devcontainerPath);
  } catch {
    return {};
  }
}

function descriptorsFromConfig(config: any): SidecarDescriptor[] {
  const declared: SidecarDescriptor[] = Array.isArray(config?.customizations?.airnub?.sidecars)
    ? config.customizations.airnub.sidecars
        .filter((entry: any) => entry?.name)
        .map((entry: any) => ({
          name: entry.name,
          agentPort: Number(entry.agentPort) || 4318,
          control: entry.control === true
        }))
    : [];

  if (declared.length) {
    return declared;
  }

  const runServices = Array.isArray(config?.runServices) ? config.runServices : [];
  return runServices.map((service: string) => ({ name: service, agentPort: 4318 }));
}

function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms).unref?.();
  return controller.signal;
}

async function fetchJson(url: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function discoverSidecars(workspaceRoot: string): Promise<SidecarDescriptor[]> {
  const config = await readDevcontainer(workspaceRoot);
  return descriptorsFromConfig(config);
}

export async function fetchSidecarStatus(
  workspaceRoot: string,
  opts: { timeoutMs?: number } = {}
): Promise<SidecarMetrics[]> {
  const descriptors = await discoverSidecars(workspaceRoot);
  const timeoutMs = opts.timeoutMs ?? 2_000;

  const results: SidecarMetrics[] = [];
  for (const descriptor of descriptors) {
    const baseUrl = `http://${descriptor.name}:${descriptor.agentPort}`;
    try {
      const metrics = await fetchJson(`${baseUrl}/metrics`, { signal: timeoutSignal(timeoutMs) });
      results.push({
        service: descriptor.name,
        status: "ok",
        uptime: metrics.uptime,
        cpu: metrics.cpu,
        memory: metrics.mem,
        processes: metrics.proc,
        ports: metrics.ports,
        controlEnabled: Boolean(metrics.controlEnabled ?? descriptor.control)
      });
    } catch (error: any) {
      results.push({
        service: descriptor.name,
        status: "error",
        error: error?.message ?? String(error)
      });
    }
  }

  return results;
}

export async function invokeSidecarControl(
  workspaceRoot: string,
  name: string,
  action: "stop" | "restart",
  opts: { timeoutMs?: number } = {}
): Promise<void> {
  const descriptors = await discoverSidecars(workspaceRoot);
  const target = descriptors.find((desc) => desc.name === name);
  if (!target) {
    throw new Error(`Sidecar '${name}' not found in devcontainer configuration.`);
  }
  const timeoutMs = opts.timeoutMs ?? 2_000;
  const baseUrl = `http://${target.name}:${target.agentPort}`;
  await fetchJson(`${baseUrl}/control/${action}`, {
    method: "POST",
    signal: timeoutSignal(timeoutMs)
  });
}
