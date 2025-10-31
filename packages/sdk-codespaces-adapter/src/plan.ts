import { GitHubClient } from "./github-client.js";
import { normalizePortRequests } from "./ports.js";
import { Plan, PlanNote, CreateCodespaceRequest } from "./types.js";
import { ValidationError } from "./errors.js";

const DEFAULT_PASSWORD_VALUES = new Set(["password", "admin", "changeme", "student"]);
const DEFAULT_DEVCONTAINER_PATH = ".devcontainer/devcontainer.json";
const LARGE_MACHINE_PATTERN = /(large|xlarge|2xlarge|4xlarge|premium|pro)/i;

function detectPasswordNotes(env?: Record<string, string>): PlanNote[] {
  if (!env) return [];
  const notes: PlanNote[] = [];
  for (const [key, value] of Object.entries(env)) {
    if (/pass(word)?|secret|token/i.test(key) && value && DEFAULT_PASSWORD_VALUES.has(value.toLowerCase())) {
      notes.push({
        level: "warn",
        message: `Environment variable ${key} is set to a default credential. Override before classroom use.`
      });
    }
  }
  return notes;
}

function hasErrors(notes: PlanNote[]): boolean {
  return notes.some((note) => note.level === "error");
}

export async function buildCreatePlan(client: GitHubClient, req: CreateCodespaceRequest): Promise<Plan> {
  if (!req.repo?.owner || !req.repo?.repo) {
    throw new ValidationError("Repository owner and name are required");
  }

  await client.ensureRepoAccess(req.repo);

  const notes: PlanNote[] = [];
  const actions: Plan["actions"] = [];
  const schoolMode = req.schoolMode ?? true;

  const portsResult = normalizePortRequests(req.ports);
  notes.push(...portsResult.notes);

  if (schoolMode) {
    for (const port of portsResult.ports) {
      if (port.visibility !== "private") {
        notes.push({
          level: "error",
          message: `School mode forbids ${port.visibility} visibility for port ${port.port}. Use private or disable school mode.`
        });
      }
    }
  }

  const devcontainerPath = req.devcontainerPath ?? DEFAULT_DEVCONTAINER_PATH;
  const exists = await client.pathExists(req.repo, devcontainerPath);
  if (!exists) {
    notes.push({
      level: "warn",
      message: `Devcontainer manifest not found at ${devcontainerPath}. Codespaces will fall back to repo defaults.`
    });
  }

  if (req.machine) {
    const machines = await client.listMachines(req.repo);
    if (!machines.includes(req.machine)) {
      notes.push({
        level: "error",
        message: `Machine type ${req.machine} is unavailable for ${req.repo.owner}/${req.repo.repo}`
      });
    } else if (schoolMode && LARGE_MACHINE_PATTERN.test(req.machine)) {
      notes.push({
        level: "warn",
        message: `Machine ${req.machine} may exceed school quotas. Consider a smaller type when school mode is enabled.`
      });
    }
  }

  notes.push(...detectPasswordNotes(req.environmentVariables));

  const sanitizedRequest: CreateCodespaceRequest = {
    ...req,
    devcontainerPath,
    ports: portsResult.ports,
    schoolMode
  };

  if (!hasErrors(notes)) {
    actions.push({ op: "create-codespace", req: sanitizedRequest });

    if (portsResult.ports.length) {
      actions.push({ op: "update-ports", req: portsResult.ports, target: { name: req.displayName } });
    }

    if (req.secrets && Object.keys(req.secrets).length) {
      actions.push({
        op: "set-secrets",
        scope: "repo",
        entries: Object.keys(req.secrets),
        repo: req.repo
      });
    }
  }

  return { actions, notes };
}
