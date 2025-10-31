declare module "child_process" {
  export interface SpawnOptions {
    env?: Record<string, string | undefined>;
  }

  export interface EventStream {
    on(event: "data", listener: (chunk: unknown) => void): void;
  }

  export interface ChildProcess {
    stdout: EventStream;
    stderr: EventStream;
    kill(signal?: string): void;
    on(event: "error", listener: (error: unknown) => void): void;
    on(event: "close", listener: (code: number | null) => void): void;
  }

  export function spawn(command: string, args?: string[], options?: SpawnOptions): ChildProcess;
}

declare namespace NodeJS {
  type ProcessEnv = Record<string, string | undefined>;
  type Timeout = number;
}

declare const process: {
  platform: string;
  env: Record<string, string | undefined>;
};

declare class Buffer {
  static from(data: string | Uint8Array, encoding?: string): Buffer;
  constructor();
  toString(encoding?: string): string;
}
