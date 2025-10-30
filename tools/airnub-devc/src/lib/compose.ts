import fs from "fs-extra";
import path from "path";
import YAML from "yaml";
import merge from "deepmerge";
import { globby } from "globby";

const NETWORK_NAME = "devnet";
const META_KEY = "x-airnub-devc";

export interface AggregateOptions {
  repoRoot: string;
  services: string[];
  outFile: string;
  fetchIfMissing?: boolean;
  fetchRef?: string;
  catalogRef?: string;
  searchRoots?: string[];
}

interface LoadedFragment {
  services: Record<string, any>;
  volumes: Record<string, any>;
  networks: Record<string, any>;
}

async function locateFragmentFile(baseDir: string, svc: string) {
  const matches = await globby(["docker-compose.*.yml", "docker-compose.*.yaml"], {
    cwd: baseDir,
    onlyFiles: true,
    deep: 1,
  });
  if (matches.length === 0) {
    return null;
  }
  const exact = matches.find((candidate) => candidate === `docker-compose.${svc}.yml` || candidate === `docker-compose.${svc}.yaml`);
  const selected = exact ?? matches[0];
  return path.join(baseDir, selected);
}

async function loadFragment(opts: AggregateOptions, svc: string): Promise<LoadedFragment> {
  const searchRoots = opts.searchRoots && opts.searchRoots.length
    ? opts.searchRoots
    : [path.join(opts.repoRoot, "services")];

  for (const root of searchRoots) {
    const fragmentDir = path.join(root, svc);
    if (!await fs.pathExists(fragmentDir)) {
      continue;
    }
    const file = await locateFragmentFile(fragmentDir, svc);
    if (!file) {
      continue;
    }
    const raw = await fs.readFile(file, "utf8");
    const parsed = YAML.parse(raw) ?? {};
    return {
      services: parsed.services ?? {},
      volumes: parsed.volumes ?? {},
      networks: parsed.networks ?? {},
    };
  }

  if (opts.fetchIfMissing) {
    const ref = opts.fetchRef || "main";
    const url = `https://raw.githubusercontent.com/airnub-labs/devcontainers-catalog/${ref}/services/${svc}/docker-compose.${svc}.yml`;
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      const parsed = YAML.parse(text) ?? {};
      return {
        services: parsed.services ?? {},
        volumes: parsed.volumes ?? {},
        networks: parsed.networks ?? {},
      };
    }
  }

  throw new Error(`Service fragment not found for '${svc}'. Add services/${svc}/docker-compose.*.yml or enable fetch.`);
}

function ensureNetwork(service: any) {
  if (!service.networks) {
    service.networks = [NETWORK_NAME];
    return;
  }
  if (Array.isArray(service.networks)) {
    if (!service.networks.includes(NETWORK_NAME)) {
      service.networks.push(NETWORK_NAME);
    }
    return;
  }
  service.networks[NETWORK_NAME] = service.networks[NETWORK_NAME] ?? {};
}

function ensureProfile(service: any, profile: string) {
  if (!profile) return;
  const existing = service.profiles;
  if (!existing) {
    service.profiles = [profile];
    return;
  }
  if (Array.isArray(existing)) {
    if (!existing.includes(profile)) {
      existing.push(profile);
    }
    return;
  }
  if (existing !== profile) {
    service.profiles = [existing, profile];
  }
}

export async function buildAggregateCompose(opts: AggregateOptions) {
  const uniqueServices = Array.from(new Set(opts.services));

  let aggregate: any = {
    version: "3.9",
    services: {},
    volumes: {},
    networks: { [NETWORK_NAME]: { name: NETWORK_NAME } },
  };

  for (const svc of uniqueServices) {
    const fragment = await loadFragment(opts, svc);
    for (const svcDef of Object.values(fragment.services)) {
      ensureNetwork(svcDef);
      ensureProfile(svcDef, svc);
    }

    const normalized = {
      services: fragment.services,
      volumes: fragment.volumes,
      networks: fragment.networks,
    };

    aggregate = merge(aggregate, normalized, {
      arrayMerge: (target: unknown[], source: unknown[]) => Array.from(new Set([...(target as unknown[]), ...(source as unknown[])])),
    });
  }

  if (!aggregate.networks || Object.keys(aggregate.networks).length === 0) {
    aggregate.networks = { [NETWORK_NAME]: { name: NETWORK_NAME } };
  } else {
    aggregate.networks[NETWORK_NAME] = aggregate.networks[NETWORK_NAME] ?? { name: NETWORK_NAME };
  }

  aggregate[META_KEY] = {
    services: uniqueServices,
    network: NETWORK_NAME,
    catalogRef: opts.catalogRef,
  };

  await fs.outputFile(opts.outFile, YAML.stringify(aggregate));
  return aggregate;
}

export interface AggregateMetadata {
  services: string[];
  network?: string;
  catalogRef?: string;
}

export async function readAggregateMetadata(file: string): Promise<AggregateMetadata | null> {
  if (!await fs.pathExists(file)) {
    return null;
  }
  const raw = await fs.readFile(file, "utf8");
  const parsed = YAML.parse(raw) ?? {};
  const meta = parsed[META_KEY];
  if (meta && Array.isArray(meta.services)) {
    return {
      services: meta.services,
      network: meta.network,
      catalogRef: meta.catalogRef,
    };
  }
  return null;
}
