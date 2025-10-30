import fs from "fs-extra";
import path from "path";
import YAML from "yaml";
import merge from "deepmerge";

export interface AggregateOptions {
  repoRoot: string;
  services: string[];
  fetchIfMissing?: boolean;
  fetchRef?: string;
  rawBase?: string;
  outFile: string;
}

async function loadFragment(opts: AggregateOptions, svc: string) {
  const fragmentDir = path.join(opts.repoRoot, "services", svc);
  const candidates = await fs.readdir(fragmentDir).catch(() => [] as string[]);
  const file = candidates.find((entry) => entry.startsWith("docker-compose.") && entry.endsWith(".yml"));
  if (file) {
    const fullPath = path.join(fragmentDir, file);
    const raw = await fs.readFile(fullPath, "utf8");
    return YAML.parse(raw);
  }

  if (opts.fetchIfMissing) {
    const ref = opts.fetchRef || "main";
    const rawBase = opts.rawBase ?? `https://raw.githubusercontent.com/airnub-labs/devcontainers-catalog/${ref}`;
    const url = `${rawBase}/services/${svc}/docker-compose.${svc}.yml`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    const text = await res.text();
    return YAML.parse(text);
  }

  throw new Error(`Service fragment not found for '${svc}'. Add services/${svc}/docker-compose.*.yml or enable fetch.`);
}

export async function buildAggregateCompose(opts: AggregateOptions) {
  let aggregate: any = { version: "3.9", services: {}, volumes: {}, networks: {} };

  for (const svc of opts.services) {
    const fragment = await loadFragment(opts, svc);
    const normalized = {
      version: fragment.version ?? "3.9",
      services: fragment.services ?? {},
      volumes: fragment.volumes ?? {},
      networks: fragment.networks ?? {},
    };
    aggregate = merge(aggregate, normalized);
  }

  if (!aggregate.networks || Object.keys(aggregate.networks).length === 0) {
    aggregate.networks = { default: {} };
  }

  await fs.outputFile(opts.outFile, YAML.stringify(aggregate));
  return aggregate;
}
