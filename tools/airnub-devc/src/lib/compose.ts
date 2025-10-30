import YAML from 'yaml';

export interface ComposeFragmentRef {
  name: string;
  file: string;
  service: string;
}

export interface AggregateComposeOptions {
  devcontainerFile: string;
  devcontainerService: string;
  fragments: ComposeFragmentRef[];
}

export function createAggregateCompose(options: AggregateComposeOptions): string {
  const services: Record<string, unknown> = {
    devcontainer: {
      extends: {
        file: options.devcontainerFile,
        service: options.devcontainerService
      }
    }
  };

  for (const fragment of options.fragments) {
    services[fragment.name] = {
      extends: {
        file: fragment.file,
        service: fragment.service
      }
    };
  }

  const doc = {
    version: '3.9',
    services
  };

  return YAML.stringify(doc).trim();
}
