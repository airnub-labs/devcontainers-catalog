import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile as fsReadFile, readdir as fsReaddir } from 'node:fs/promises';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export interface CatalogOptions {
  ref: string;
  repoRoot?: string;
  fallbackToLocal?: boolean;
}

export class Catalog {
  private constructor(
    private readonly ref: string,
    private readonly repoRoot: string,
    private readonly fallbackToLocal: boolean
  ) {}

  static async create(options: CatalogOptions): Promise<Catalog> {
    const repoRoot = options.repoRoot ?? (await Catalog.resolveGitRoot());
    return new Catalog(options.ref, repoRoot, options.fallbackToLocal ?? true);
  }

  private static async resolveGitRoot(): Promise<string> {
    const { stdout } = await execFileAsync('git', ['rev-parse', '--show-toplevel']);
    return stdout.trim();
  }

  async readFile(relPath: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync('git', ['show', `${this.ref}:${relPath}`], {
        cwd: this.repoRoot
      });
      return stdout;
    } catch (error) {
      if (!this.fallbackToLocal) {
        throw error;
      }
      const absolute = path.join(this.repoRoot, relPath);
      return fsReadFile(absolute, 'utf8');
    }
  }

  async listFiles(relDir: string): Promise<string[]> {
    try {
      const { stdout } = await execFileAsync(
        'git',
        ['ls-tree', '-r', '--name-only', this.ref, relDir],
        { cwd: this.repoRoot }
      );
      const files = stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      if (files.length > 0) {
        return files;
      }
    } catch (error) {
      if (!this.fallbackToLocal) {
        throw error;
      }
    }

    if (!this.fallbackToLocal) {
      return [];
    }
    return this.listFilesFromDisk(relDir);
  }

  private async listFilesFromDisk(relDir: string): Promise<string[]> {
    const absolute = path.join(this.repoRoot, relDir);
    const entries = await fsReaddir(absolute, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const rel = path.join(relDir, entry.name);
      if (entry.isDirectory()) {
        const nested = await this.listFilesFromDisk(rel);
        files.push(...nested);
      } else {
        files.push(rel);
      }
    }
    return files;
  }

  get root(): string {
    return this.repoRoot;
  }

  get reference(): string {
    return this.ref;
  }
}
