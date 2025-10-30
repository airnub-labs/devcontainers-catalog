import path from "path";
import os from "os";
import fs from "fs-extra";

export const browserServices = [
  {
    id: "neko-webrtc",
    label: "Neko (WebRTC) Chrome",
    templatePath: "templates/classroom-neko-webrtc/.template",
  },
  {
    id: "kasm-chrome",
    label: "Kasm Chrome (KasmVNC)",
    templatePath: "templates/classroom-kasm-chrome/.template",
  },
];

export const stackTemplates = [
  {
    id: "stack-nextjs-supabase-neko",
    label: "Stack: Next.js + Supabase + Neko",
    templatePath: "templates/stack-nextjs-supabase-neko/.template",
  },
  {
    id: "stack-nextjs-supabase-kasm",
    label: "Stack: Next.js + Supabase + Kasm",
    templatePath: "templates/stack-nextjs-supabase-kasm/.template",
  },
];

export interface MaterializeServicesOptions {
  services: string[];
  destination: string;
  repoRoot: string;
  fetchIfMissing?: boolean;
  searchRoots?: string[];
  fetchRef?: string;
  catalogRef?: string;
}

async function fetchRemoteFragment(service: string, ref: string, destDir: string) {
  const base = `https://raw.githubusercontent.com/airnub-labs/devcontainers-catalog/${ref}/services/${service}`;
  const candidates = [
    `docker-compose.${service}.yml`,
    `docker-compose.${service}.yaml`,
    "README.md",
    ".env.example",
  ];

  const stagingDir = await fs.mkdtemp(path.join(os.tmpdir(), `airnub-service-${service}-`));
  let foundCompose = false;

  try {
    for (const file of candidates) {
      const url = `${base}/${file}`;
      const res = await fetch(url);
      if (!res.ok) {
        continue;
      }
      const text = await res.text();
      await fs.outputFile(path.join(stagingDir, file), text, { encoding: "utf8" });
      if (file.startsWith("docker-compose.")) {
        foundCompose = true;
      }
    }

    if (!foundCompose) {
      throw new Error(
        `Service fragment '${service}' not found remotely at ref ${ref}. Ensure services/${service}/docker-compose.${service}.yml exists.`,
      );
    }

    await fs.remove(destDir).catch((error: NodeJS.ErrnoException) => {
      if (error && error.code !== "ENOENT") {
        throw error;
      }
    });
    await fs.move(stagingDir, destDir, { overwrite: true });
  } finally {
    await fs.remove(stagingDir).catch(() => {});
  }
}

export async function materializeServices(opts: MaterializeServicesOptions) {
  if (!opts.services.length) {
    return;
  }

  await fs.ensureDir(opts.destination);

  for (const svc of opts.services) {
    const destDir = path.join(opts.destination, svc);
    const candidates = [
      destDir,
      ...(opts.searchRoots ?? []).map((root) => path.join(root, svc)),
      path.join(opts.repoRoot, "services", svc),
    ];

    let sourceDir: string | null = null;
    for (const candidate of candidates) {
      if (await fs.pathExists(candidate)) {
        sourceDir = candidate;
        break;
      }
    }

    if (!sourceDir) {
      if (opts.fetchIfMissing) {
        const ref = opts.fetchRef || opts.catalogRef || "main";
        await fetchRemoteFragment(svc, ref, destDir);
        sourceDir = destDir;
      } else {
        throw new Error(`Service fragment '${svc}' not found under ${path.join(opts.repoRoot, "services")}.`);
      }
    }

    if (sourceDir !== destDir) {
      const stagingDir = await fs.mkdtemp(path.join(os.tmpdir(), `airnub-stage-${svc}-`));
      try {
        await fs.copy(sourceDir, stagingDir);
        await fs.remove(destDir).catch((error: NodeJS.ErrnoException) => {
          if (error && error.code !== "ENOENT") {
            throw error;
          }
        });
        await fs.move(stagingDir, destDir, { overwrite: true });
      } catch (error) {
        await fs.remove(stagingDir).catch(() => {});
        throw error;
      }
    }
  }
}

export async function listServiceDirs(baseDir: string): Promise<string[]> {
  const exists = await fs.pathExists(baseDir);
  if (!exists) {
    return [];
  }
  const entries = await fs.readdir(baseDir);
  return entries
    .map((entry: string) => path.join(baseDir, entry))
    .filter((entry: string) => fs.statSync(entry).isDirectory())
    .map((entry: string) => path.basename(entry))
    .sort();
}
