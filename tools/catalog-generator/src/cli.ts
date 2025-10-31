#!/usr/bin/env node
import { readFileSync } from 'fs';
import { generateCatalogWorkspace } from './index.js';

function printUsage() {
  console.log('Usage: catalog-generate <config.json>');
  console.log('The configuration file must match the GeneratorInput type.');
}

async function run() {
  const [, , configPath] = process.argv;
  if (!configPath) {
    printUsage();
    process.exit(1);
    return;
  }

  const raw = readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(raw);
  const output = await generateCatalogWorkspace(parsed);
  console.log(JSON.stringify(output, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
