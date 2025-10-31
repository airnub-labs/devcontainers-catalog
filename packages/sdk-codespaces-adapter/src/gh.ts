import { spawn } from "child_process";

export class GhError extends Error {
  constructor(message: string, public code?: number, public stdout?: string, public stderr?: string) {
    super(message);
  }
}

function ghExecutable() {
  return process.platform === "win32" ? "gh.exe" : "gh";
}

export async function runGh(args: string[], opts?: { env?: NodeJS.ProcessEnv; timeoutMs?: number }): Promise<string> {
  const bin = ghExecutable();
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { env: { ...process.env, ...(opts?.env ?? {}) } });
    let stdout = "";
    let stderr = "";
    let timer: NodeJS.Timeout | null = null;

    if (opts?.timeoutMs) {
      timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new GhError(`gh timed out after ${opts.timeoutMs}ms`, undefined, stdout, stderr));
      }, opts.timeoutMs);
    }

    child.stdout.on("data", (chunk: unknown) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk: unknown) => {
      stderr += String(chunk);
    });
    child.on("error", (error: unknown) => {
      if (timer) clearTimeout(timer);
      reject(new GhError(`failed to spawn gh: ${String(error)}`));
    });
    child.on("close", (code: number | null) => {
      if (timer) clearTimeout(timer);
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new GhError(`gh exited with code ${code}`, code ?? undefined, stdout, stderr));
      }
    });
  });
}

export async function setPortVisibility(codespace: string, port: number, visibility: "private" | "org" | "public") {
  await runGh(["codespace", "ports", "visibility", `${port}:${visibility}`, "-c", codespace]);
}

export async function setPortLabel(codespace: string, port: number, label: string) {
  await runGh(["codespace", "ports", "update", "--port", String(port), "--label", label, "-c", codespace]);
}
