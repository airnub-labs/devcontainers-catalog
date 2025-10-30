import { pathToFileURL } from 'node:url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generateWorkspaceCommand } from './cmds/generate-workspace.js';
import { updateWorkspaceCommand } from './cmds/update-workspace.js';
import { generateLessonCommand } from './cmds/generate-lesson.js';
import { publishLessonCommand } from './cmds/publish-lesson.js';

export const cli = () => {
  return yargs(hideBin(process.argv))
    .scriptName('airnub-devc')
    .command(generateWorkspaceCommand)
    .command(updateWorkspaceCommand)
    .command(generateLessonCommand)
    .command(publishLessonCommand)
    .demandCommand(1)
    .strict()
    .help();
};

const invokedDirectly = (() => {
  if (process.argv[1]) {
    const executed = pathToFileURL(process.argv[1]).href;
    return executed === import.meta.url;
  }
  return false;
})();

if (invokedDirectly) {
  cli().parse();
}
