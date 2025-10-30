import path from 'node:path';
import fsExtra from 'fs-extra';
import { Catalog } from './catalog.js';
import type { ComposeFragmentRef } from './compose.js';

export interface ServiceSelection {
  id: string;
  env?: Record<string, string>;
}

export interface ServiceMaterialization {
  fragments: ComposeFragmentRef[];
  envSections: string[];
}

export async function materializeServices(
  catalog: Catalog,
  selections: ServiceSelection[],
  devcontainerDir: string
): Promise<ServiceMaterialization> {
  const fragments: ComposeFragmentRef[] = [];
  const envSections: string[] = [];

  for (const selection of selections) {
    const service = selection.id;
    const serviceFiles = await catalog.listFiles(`services/${service}`);
    if (serviceFiles.length === 0) {
      throw new Error(`Service '${service}' not found at ref ${catalog.reference}`);
    }
    for (const file of serviceFiles) {
      const content = await catalog.readFile(file);
      const relative = file.replace(`services/${service}/`, '');
      const destination = path.join(devcontainerDir, 'services', service, relative);
      await fsExtra.outputFile(destination, content);
      if (file.endsWith('.env.example')) {
        envSections.push(`# ${service.toUpperCase()}\n${content.trim()}\n`);
      }
      if (file.endsWith(`docker-compose.${service}.yml`) || file.endsWith(`docker-compose.${service}.yaml`)) {
        fragments.push({
          name: service,
          file: `./services/${service}/${relative}`,
          service
        });
      }
    }
    if (selection.env) {
      const envLines = Object.entries(selection.env).map(([key, value]) => `${key}=${value}`);
      if (envLines.length > 0) {
        envSections.push(`# ${service.toUpperCase()} overrides\n${envLines.join('\n')}\n`);
      }
    }
  }

  return { fragments, envSections };
}
