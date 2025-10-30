import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ejs from 'ejs';

export interface RenderOptions {
  templateDir: string;
}

export async function renderTemplate(
  relativePath: string,
  data: Record<string, unknown>,
  options: RenderOptions
): Promise<string> {
  const templatePath = path.join(options.templateDir, relativePath);
  const template = await readFile(templatePath, 'utf8');
  return ejs.render(template, data, { async: true });
}

export function formatJSON(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
