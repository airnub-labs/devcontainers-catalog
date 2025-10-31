declare module "fs-extra" {
  import * as fs from "fs";
  import { PathLike } from "fs";

  type EncodingOption = { encoding?: BufferEncoding | null } | BufferEncoding | null;
  type WriteFileOptions = fs.WriteFileOptions;

  interface CopyOptions {
    overwrite?: boolean;
    errorOnExist?: boolean;
    dereference?: boolean;
    preserveTimestamps?: boolean;
    filter?(src: string, dest: string): boolean | Promise<boolean>;
  }

  interface MoveOptions {
    overwrite?: boolean;
  }

  interface RemoveOptions {
    maxBusyTries?: number;
  }

  const fsExtra: typeof fs & {
    readJson<T = unknown>(file: PathLike, options?: EncodingOption): Promise<T>;
    writeJson(file: PathLike, data: unknown, options?: WriteFileOptions & { spaces?: number | string }): Promise<void>;
    outputFile(file: PathLike, data: string | NodeJS.ArrayBufferView, options?: WriteFileOptions): Promise<void>;
    ensureDir(dir: PathLike): Promise<void>;
    copy(src: PathLike, dest: PathLike, options?: CopyOptions): Promise<void>;
    move(src: PathLike, dest: PathLike, options?: MoveOptions): Promise<void>;
    remove(path: PathLike, options?: RemoveOptions): Promise<void>;
    pathExists(path: PathLike): Promise<boolean>;
    mkdtemp(prefix: string, options?: EncodingOption): Promise<string>;
    readFile(path: PathLike, options?: EncodingOption): Promise<string>;
    writeFile(path: PathLike, data: string | NodeJS.ArrayBufferView, options?: WriteFileOptions): Promise<void>;
    readdir(path: PathLike): Promise<string[]>;
    ensureFile(path: PathLike): Promise<void>;
    outputJson(file: PathLike, data: unknown, options?: WriteFileOptions & { spaces?: number | string }): Promise<void>;
    emptyDir(path: PathLike): Promise<void>;
    stat(path: PathLike): Promise<fs.Stats>;
  };

  export default fsExtra;
  export * from "fs";
}

