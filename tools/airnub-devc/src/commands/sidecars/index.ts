import { Command } from "commander";
import chalk from "chalk";
import { fetchSidecarStatus, invokeSidecarControl } from "../../lib/sidecar-observer.js";

export function registerSidecarCommands(
  program: Command,
  getGlobals: (cmd: Command) => { workspaceRoot?: string },
  resolveWorkspace: (globals: { workspaceRoot?: string }) => string
): void {
  const sidecar = program.command("sidecar").description("Inspect and manage sidecar agents");

  sidecar
    .command("status")
    .description("Show metrics for configured sidecars")
    .option("--workspace-root <path>", "explicit workspace root")
    .action(async function (this: Command) {
      const globals = getGlobals(this);
      const workspace = resolveWorkspace(globals);
      const metrics = await fetchSidecarStatus(workspace);
      if (!metrics.length) {
        console.log(chalk.yellow("No sidecars declared in devcontainer configuration."));
        return;
      }
      console.log(chalk.bold(`${"Service".padEnd(18)} ${"Status".padEnd(8)} ${"CPU%".padStart(6)} ${"MemMB".padStart(8)} Ports`));
      for (const entry of metrics) {
        if (entry.status === "error") {
          console.log(`${entry.service.padEnd(18)} ${chalk.red("error")}   --    --   ${entry.error}`);
          continue;
        }
        const cpu = entry.cpu?.toFixed(1).padStart(6) ?? "  --";
        const mem = entry.memory ? (entry.memory / (1024 * 1024)).toFixed(1).padStart(8) : "   --";
        const ports = entry.ports?.length ? entry.ports.join(",") : "--";
        console.log(`${entry.service.padEnd(18)} ${chalk.green("ok").padEnd(8)} ${cpu} ${mem} ${ports}`);
      }
    });

  sidecar
    .command("stop")
    .description("Request a sidecar to stop via its control endpoint")
    .argument("<service>", "sidecar service name")
    .option("--workspace-root <path>", "explicit workspace root")
    .action(async function (this: Command, service: string) {
      const globals = getGlobals(this);
      const workspace = resolveWorkspace(globals);
      await invokeSidecarControl(workspace, service, "stop");
      console.log(chalk.yellow(`Stop signal sent to ${service}`));
    });

  sidecar
    .command("restart")
    .description("Request a sidecar restart via its control endpoint")
    .argument("<service>", "sidecar service name")
    .option("--workspace-root <path>", "explicit workspace root")
    .action(async function (this: Command, service: string) {
      const globals = getGlobals(this);
      const workspace = resolveWorkspace(globals);
      await invokeSidecarControl(workspace, service, "restart");
      console.log(chalk.green(`Restart signal sent to ${service}`));
    });
}
