import path from 'node:path';
import type { CommandModule } from 'yargs';
import { materializeWorkspace } from './generate-workspace.js';

interface UpdateWorkspaceArgs {
  manifest: string;
  output: string;
  catalogRef: string;
  preview?: string;
}

function defaultPreviewDir(outputDir: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(outputDir, '.airnub-devc', 'previews', timestamp);
}

async function updateWorkspace(argv: UpdateWorkspaceArgs): Promise<void> {
  const manifestPath = String(argv.manifest);
  const outputDir = path.resolve(String(argv.output));
  const catalogRef = argv.catalogRef ?? 'HEAD';
  const previewDir = argv.preview ? path.resolve(String(argv.preview)) : defaultPreviewDir(outputDir);

  await materializeWorkspace(manifestPath, outputDir, {
    catalogRef,
    previewDir
  });

  console.log(`Preview patches (if any) located at: ${previewDir}`);
}

export const updateWorkspaceCommand: CommandModule<unknown, UpdateWorkspaceArgs> = {
  command: 'update workspace',
  describe: 'Reconcile an existing workspace with a new catalog reference',
  builder: {
    manifest: {
      alias: 'm',
      type: 'string',
      demandOption: true,
      describe: 'Path to workspace manifest used for the workspace'
    },
    output: {
      alias: 'o',
      type: 'string',
      demandOption: true,
      describe: 'Existing workspace directory to update'
    },
    catalogRef: {
      type: 'string',
      demandOption: true,
      describe: 'Catalog git ref to pull updates from'
    },
    preview: {
      type: 'string',
      describe: 'Directory to emit unified diff previews'
    }
  },
  handler: (argv) => updateWorkspace(argv)
};
