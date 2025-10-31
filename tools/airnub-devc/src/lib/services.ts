import path from "path";
import os from "os";
import fs from "fs-extra";

export type Stability = "experimental" | "stable" | "deprecated";

export type ServiceDescriptor = {
  id: string;
  label: string;
  templatePath: string;
  stability: Stability;
  since?: string;
  owners?: string[];
  docs?: string;
  ports?: number[];
  notes?: string[];
};

export type ServiceRegistry = {
  services: ServiceDescriptor[];
};

type RegistryCacheKey = string;

const registryCache = new Map<RegistryCacheKey, Promise<ServiceRegistry>>();

async function loadRegistryFromDisk(repoRoot: string): Promise<ServiceRegistry> {
  const registryPath = path.join(repoRoot, "catalog", "services.json");
  const payload = await fs.readJson(registryPath).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      throw new Error(
        `Service registry not found at ${registryPath}. Ensure catalog/services.json exists or pass --catalog-root to point to a full checkout.`,
      );
    }
    throw error;
  });

  const rawServices: unknown[] = Array.isArray(payload?.services) ? payload.services : [];
  const services: ServiceDescriptor[] = rawServices.map((entry: any) => ({
    id: String(entry.id),
    label: String(entry.label ?? entry.id ?? ""),
    templatePath: String(entry.templatePath ?? ""),
    stability: (entry.stability ?? "stable") as Stability,
    since: entry.since ? String(entry.since) : undefined,
    owners: Array.isArray(entry.owners) ? entry.owners.map((owner: any) => String(owner)) : undefined,
    docs: entry.docs ? String(entry.docs) : undefined,
    ports: Array.isArray(entry.ports) ? entry.ports.map((port: any) => Number(port)).filter(Number.isFinite) : undefined,
    notes: Array.isArray(entry.notes) ? entry.notes.map((note: any) => String(note)) : undefined,
  }));

  return { services };
}

export function loadServiceRegistry(repoRoot: string): Promise<ServiceRegistry> {
  const key: RegistryCacheKey = path.resolve(repoRoot);
  if (!registryCache.has(key)) {
    registryCache.set(key, loadRegistryFromDisk(key));
  }
  return registryCache.get(key)!;
}

export interface StabilityFilterOptions {
  includeExperimental: boolean;
  includeDeprecated: boolean;
}

export function filterServicesByStability(
  registry: ServiceRegistry,
  { includeExperimental, includeDeprecated }: StabilityFilterOptions,
): ServiceDescriptor[] {
  return registry.services.filter((svc) => {
    if (svc.stability === "experimental" && !includeExperimental) {
      return false;
    }
    if (svc.stability === "deprecated" && !includeDeprecated) {
      return false;
    }
    return true;
  });
}

export function assertServicesAllowed(
  serviceIds: string[],
  registry: ServiceRegistry,
  { includeExperimental, includeDeprecated }: StabilityFilterOptions,
): ServiceDescriptor[] {
  const lookup = new Map(registry.services.map((svc) => [svc.id, svc] as const));
  const descriptors: ServiceDescriptor[] = [];

  for (const id of serviceIds) {
    const svc = lookup.get(id);
    if (!svc) {
      throw new Error(`Unknown service: ${id}`);
    }
    if (svc.stability === "experimental" && !includeExperimental) {
      throw new Error(
        `Service "${id}" is experimental and disabled by default. Re-run with --include-experimental (or set DEVC_INCLUDE_EXPERIMENTAL=1).`,
      );
    }
    if (svc.stability === "deprecated" && !includeDeprecated) {
      throw new Error(
        `Service "${id}" is deprecated and disabled by default. Re-run with --include-deprecated (or set DEVC_INCLUDE_DEPRECATED=1).`,
      );
    }
    descriptors.push(svc);
  }

  return descriptors;
}

export type BrowserSidecar = {
  id: "neko-chrome" | "neko-firefox" | "kasm-chrome";
  label: string;
  templatePath: string;
  serviceName: string;
  ports: number[];
  portLabels: Record<number, { label: string; onAutoForward: "openBrowser" | "silent" }>;
  containerEnv?: Record<string, string>;
};

export const BROWSER_SIDECARS: BrowserSidecar[] = [
  {
    id: "neko-chrome",
    label: "Neko (WebRTC) Chrome",
    templatePath: "templates/classroom-neko-webrtc/.template",
    serviceName: "neko",
    ports: [8080, 59000],
    portLabels: {
      8080: { label: "Neko Chrome (Web UI)", onAutoForward: "openBrowser" },
      59000: { label: "Neko Chrome (TCP mux)", onAutoForward: "silent" },
    },
    containerEnv: {
      NEKO_USER_PASSWORD: "student",
      NEKO_ADMIN_PASSWORD: "admin",
    },
  },
  {
    id: "neko-firefox",
    label: "Neko (WebRTC) Firefox",
    templatePath: "templates/classroom-neko-firefox/.template",
    serviceName: "neko-firefox",
    ports: [8081, 59010],
    portLabels: {
      8081: { label: "Neko Firefox (Web UI)", onAutoForward: "openBrowser" },
      59010: { label: "Neko Firefox (TCP mux)", onAutoForward: "silent" },
    },
    containerEnv: {
      NEKO_FF_USER_PASSWORD: "student",
      NEKO_FF_ADMIN_PASSWORD: "admin",
    },
  },
  {
    id: "kasm-chrome",
    label: "Kasm Chrome (KasmVNC)",
    templatePath: "templates/classroom-kasm-chrome/.template",
    serviceName: "kasm-chrome",
    ports: [6901],
    portLabels: {
      6901: { label: "Kasm Chrome (HTTPS)", onAutoForward: "openBrowser" },
    },
    containerEnv: {
      KASM_VNC_PW: "student",
    },
  },
];

export function getBrowserSidecar(id: string): BrowserSidecar | undefined {
  return BROWSER_SIDECARS.find((browser) => browser.id === id);
}

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
