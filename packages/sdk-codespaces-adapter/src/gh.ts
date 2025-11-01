import { spawn } from "child_process";

/**
 * Error thrown when the GitHub CLI (`gh`) command fails.
 *
 * Includes the exit code and captured stdout/stderr when available to aid in
 * debugging CLI issues.
 *
 * @public
 */
export class GhError extends Error {
  constructor(message: string, public code?: number, public stdout?: string, public stderr?: string) {
    super(message);
  }
}

function ghExecutable() {
  return process.platform === "win32" ? "gh.exe" : "gh";
}

/**
 * Executes the GitHub CLI and returns trimmed stdout.
 *
 * @param args - Arguments to pass to `gh`
 * @param opts - Execution options
 * @param opts.env - Environment variables to merge
 * @param opts.timeoutMs - Optional timeout in milliseconds
 * @returns Trimmed stdout from the command
 * @throws {GhError} When the CLI fails or times out
 *
 * @example
 * ```typescript
 * const json = await runGh(["codespace", "list", "--json", "name,state"]);
 * console.log(JSON.parse(json));
 * ```
 */
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
      const hint =
        process.platform === "win32"
          ? "Install GitHub CLI from https://cli.github.com/ and ensure gh.exe is on PATH."
          : "Install GitHub CLI (https://cli.github.com/) and ensure 'gh' is on PATH.";
      reject(new GhError(`Failed to spawn 'gh'. ${hint} Error: ${String(error)}`));
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

/**
 * Sets the visibility of a codespace port using the GitHub CLI.
 *
 * @param codespace - Codespace name
 * @param port - Port number
 * @param visibility - Visibility level
 */
export async function setPortVisibility(codespace: string, port: number, visibility: "private" | "org" | "public") {
  await runGh(["codespace", "ports", "visibility", `${port}:${visibility}`, "-c", codespace]);
}

/**
 * Sets the label for a codespace port using the GitHub CLI.
 *
 * @param codespace - Codespace name
 * @param port - Port number
 * @param label - Label to apply
 */
export async function setPortLabel(codespace: string, port: number, label: string) {
  await runGh(["codespace", "ports", "update", "--port", String(port), "--label", label, "-c", codespace]);
}
