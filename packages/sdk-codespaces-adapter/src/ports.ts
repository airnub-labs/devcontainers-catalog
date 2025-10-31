import { PlanNote, PortVisibility, UpdatePortsRequest } from "./types.js";
import { ValidationError } from "./errors.js";

const MIN_PORT = 1;
const MAX_PORT = 65535;
const DEFAULT_VISIBILITY: PortVisibility = "private";

export type NormalizedPortsResult = {
  ports: UpdatePortsRequest;
  notes: PlanNote[];
};

export function normalizePortRequests(input?: UpdatePortsRequest): NormalizedPortsResult {
  if (!input || input.length === 0) {
    return { ports: [], notes: [] };
  }

  const notes: PlanNote[] = [];
  const portMap = new Map<number, { visibility: PortVisibility; label?: string }>();

  for (const entry of input) {
    const port = entry.port;
    if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
      throw new ValidationError(`Port ${port} is outside the valid TCP range`);
    }

    const visibility = entry.visibility ?? DEFAULT_VISIBILITY;
    if (visibility !== "private" && visibility !== "org" && visibility !== "public") {
      throw new ValidationError(`Unsupported port visibility: ${visibility}`);
    }

    if (portMap.has(port)) {
      notes.push({ level: "warn", message: `Duplicate port ${port} encountered; using the last definition.` });
    }

    if (visibility !== "private") {
      notes.push({ level: "warn", message: `Port ${port} requested as ${visibility}; review classroom exposure policy.` });
    }

    portMap.set(port, {
      visibility,
      label: entry.label?.trim() || undefined
    });
  }

  const ports: UpdatePortsRequest = Array.from(portMap.entries()).map(([port, data]) => ({
    port,
    visibility: data.visibility,
    label: data.label
  }));

  ports.sort((a, b) => a.port - b.port);

  return { ports, notes };
}
