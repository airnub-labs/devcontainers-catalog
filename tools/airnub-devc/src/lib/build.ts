import { execa } from "execa";

export async function buildAndPushImage(ctxDir: string, tag: string) {
  await execa(
    "docker",
    [
      "buildx",
      "build",
      "--platform",
      "linux/amd64,linux/arm64",
      "--provenance=false",
      "--push",
      "-t",
      tag,
      ctxDir,
    ],
    { stdio: "inherit" },
  );
}
