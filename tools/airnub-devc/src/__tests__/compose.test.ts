import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { createAggregateCompose } from '../lib/compose.js';

describe('createAggregateCompose', () => {
  it('builds an extends map for each service', () => {
    const yaml = createAggregateCompose({
      devcontainerFile: './compose.yaml',
      devcontainerService: 'devcontainer',
      fragments: [
        { name: 'supabase', file: './services/supabase/docker-compose.supabase.yml', service: 'supabase' },
        { name: 'redis', file: './services/redis/docker-compose.redis.yml', service: 'redis' }
      ]
    });

    const parsed = YAML.parse(yaml);
    expect(parsed.version).toBe('3.9');
    expect(parsed.services.devcontainer.extends.file).toBe('./compose.yaml');
    expect(parsed.services.supabase.extends.service).toBe('supabase');
    expect(parsed.services.redis.extends.file).toBe('./services/redis/docker-compose.redis.yml');
  });
});
