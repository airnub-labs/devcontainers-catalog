import { GitHubClient } from "./github-client.js";
import { normalizePortRequests } from "./ports.js";
import { Plan, PlanNote, CreateCodespaceRequest } from "./types.js";
import { ValidationError } from "./errors.js";

const DEFAULT_PASSWORD_VALUES = new Set(["password", "admin", "changeme", "student"]);

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

export async function buildCreatePlan(client: GitHubClient, req: CreateCodespaceRequest): Promise<Plan> {
  if (!req.repo?.owner || !req.repo?.repo) {
    throw new ValidationError("Repository owner and name are required");
  }

  await client.ensureRepoAccess(req.repo);

  const notes: PlanNote[] = [];
  const actions: Plan["actions"] = [];

  const portsResult = normalizePortRequests(req.ports);
  notes.push(...portsResult.notes);

  if (req.devcontainerPath) {
    const exists = await client.pathExists(req.repo, req.devcontainerPath);
    if (!exists) {
      notes.push({
        level: "error",
        message: `Devcontainer path ${req.devcontainerPath} not found in repository`
      });
      throw new ValidationError(`Devcontainer path ${req.devcontainerPath} not found`);
    }
  }

  if (req.machine) {
    const machines = await client.listMachines(req.repo);
    if (!machines.includes(req.machine)) {
      notes.push({
        level: "error",
        message: `Machine type ${req.machine} is unavailable for ${req.repo.owner}/${req.repo.repo}`
      });
      throw new ValidationError(`Machine ${req.machine} unavailable`);
    }
  }

  notes.push(...detectPasswordNotes(req.environmentVariables));

  const sanitizedRequest: CreateCodespaceRequest = {
    ...req,
    ports: portsResult.ports
  };

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

  return { actions, notes };
}
