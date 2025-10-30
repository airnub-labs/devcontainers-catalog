import os from "os";
import path from "path";
import fs from "fs-extra";
import { execa } from "execa";

export interface BuildOptions {
  ctxDir: string;
  tag: string;
  push?: boolean;
  outputDir?: string;
  platforms?: string;
}

export async function buildImage(opts: BuildOptions) {
  const platforms = opts.platforms ?? "linux/amd64,linux/arm64";
  const args = ["buildx", "build", "--platform", platforms, "--provenance=false"];

  let tmpDir: string | null = null;
  if (opts.push) {
    args.push("--push");
  } else {
    const targetDir = opts.outputDir ?? (await fs.mkdtemp(path.join(os.tmpdir(), "devc-image-")));
    tmpDir = opts.outputDir ? null : targetDir;
    args.push("--output", `type=oci,dest=${path.join(targetDir, "image.oci")}`);
  }

  args.push("-t", opts.tag, opts.ctxDir);

  try {
    await execa("docker", args, { stdio: "inherit" });
  } finally {
    if (tmpDir) {
      await fs.remove(tmpDir).catch(() => {});
    }
  }
}
