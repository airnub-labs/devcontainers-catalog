# Coding Agent Prompt: Add Comprehensive JSDoc Documentation

## Mission Objective

Add comprehensive **JSDoc documentation** to all public SDK exports in the Airnub DevContainers Catalog project. This documentation will enable IDE autocomplete, provide inline help for developers, and serve as API reference documentation for consumers of the SDK packages.

---

## Target Packages & Files

### 1. **CLI SDK** (`tools/airnub-devc`)
- **`src/sdk.ts`** - Public SDK exports (re-exports from `lib/stacks.js`)
- **`src/lib/stacks.ts`** - Stack generation functions and types

### 2. **Codespaces Adapter SDK** (`packages/sdk-codespaces-adapter`)
- **`src/index.ts`** - Public exports (main entry point)
- **`src/adapter.ts`** - `CodespacesAdapter` class
- **`src/github-client.ts`** - `GithubClient` class
- **`src/github-auth.ts`** - `makeOctokit` function
- **`src/seal.ts`** - `sealForGitHub` function
- **`src/types.ts`** - Type definitions
- **`src/errors.ts`** - Error classes
- **`src/gh.ts`** - GitHub CLI wrapper utilities

---

## JSDoc Standards & Best Practices

### Documentation Style Guide

#### 1. **Function Documentation Template**

```typescript
/**
 * Brief one-line summary of what the function does.
 *
 * Detailed description explaining:
 * - The purpose and use case
 * - Key behavior and side effects
 * - Important constraints or preconditions
 * - Common pitfalls or gotchas
 *
 * @param paramName - Description of the parameter, including constraints
 * @param options - Optional configuration object
 * @param options.field - Description of the optional field
 * @returns Description of the return value, including possible states
 * @throws {ErrorType} When and why this error is thrown
 *
 * @example
 * ```typescript
 * const result = await functionName({ param: "value" });
 * console.log(result.data);
 * ```
 *
 * @see {@link RelatedType} for related information
 * @since 1.2.0
 * @public
 */
export async function functionName(paramName: string, options?: Options): Promise<Result> {
  // implementation
}
```

#### 2. **Class Documentation Template**

```typescript
/**
 * Brief one-line summary of the class purpose.
 *
 * Detailed description explaining:
 * - What the class represents or manages
 * - Typical lifecycle (instantiation → usage → cleanup)
 * - Thread-safety or async considerations
 *
 * @example
 * ```typescript
 * const adapter = new ClassName();
 * await adapter.initialize();
 * const result = await adapter.doSomething();
 * ```
 *
 * @public
 */
export class ClassName {
  /**
   * Brief description of what this method does.
   *
   * @param param - Parameter description
   * @returns Description of return value
   * @throws {ErrorType} When error occurs
   */
  async methodName(param: string): Promise<void> {
    // implementation
  }
}
```

#### 3. **Type Documentation Template**

```typescript
/**
 * Brief description of what this type represents.
 *
 * Detailed explanation of:
 * - When to use this type
 * - Valid combinations of fields
 * - Validation rules
 *
 * @example
 * ```typescript
 * const config: TypeName = {
 *   field1: "value",
 *   field2: 42
 * };
 * ```
 *
 * @public
 */
export type TypeName = {
  /**
   * Description of field1, including constraints.
   * @example "my-project"
   */
  field1: string;

  /**
   * Description of field2.
   * @default 30
   */
  field2?: number;
};
```

#### 4. **Interface Documentation Template**

```typescript
/**
 * Brief description of the interface contract.
 *
 * Implementations of this interface must:
 * - Requirement 1
 * - Requirement 2
 *
 * @public
 */
export interface IAdapter {
  /**
   * Brief method description.
   *
   * @param param - Parameter description
   * @returns Return value description
   */
  methodName(param: string): Promise<Result>;
}
```

### Documentation Quality Standards

1. **Completeness:**
   - Every public export must have a JSDoc comment
   - All parameters must be documented
   - Return values must be described
   - Exceptions must be documented with `@throws`

2. **Clarity:**
   - Start with a one-line summary (max 80 characters)
   - Use clear, actionable language ("Creates a codespace..." not "This function creates...")
   - Explain **why** not just **what** for complex logic

3. **Examples:**
   - Provide at least one `@example` for functions and classes
   - Show realistic usage with proper imports
   - Include common error handling patterns

4. **Links:**
   - Use `@see` to cross-reference related types/functions
   - Link to external docs for GitHub API endpoints
   - Use `{@link Type}` for inline type references

5. **Versioning:**
   - Add `@since` for new APIs
   - Mark deprecated APIs with `@deprecated` and suggest alternatives

---

## Detailed Documentation Requirements

### Package 1: CLI SDK (`tools/airnub-devc`)

#### File: `src/sdk.ts`

**Current State:**
```typescript
export { generateStack } from "./lib/stacks.js";
export type { GenerateStackInput, RepoInsert, MergePlan } from "./lib/stacks.js";
```

**Required Documentation:**

1. **File-level JSDoc:**
```typescript
/**
 * Public SDK for the Airnub DevContainers CLI.
 *
 * This module exports the programmatic interface for generating dev container
 * stacks, allowing you to build classroom-ready development environments
 * programmatically without using the CLI.
 *
 * @example
 * ```typescript
 * import { generateStack } from "@airnub/devc";
 *
 * const result = await generateStack({
 *   template: "nextjs-supabase",
 *   browsers: ["neko-chrome"],
 *   features: ["ghcr.io/airnub-labs/devcontainer-features/deno:1"]
 * });
 *
 * console.log(`Generated ${result.plan.files.length} files`);
 * ```
 *
 * @packageDocumentation
 * @module @airnub/devc
 */
```

2. **Re-export with documentation:**
```typescript
/**
 * Generates a complete dev container stack from a template.
 *
 * This function merges a base template with browser sidecars, custom features,
 * and additional files to produce a ready-to-use dev container configuration.
 * It handles port conflict resolution, YAML merging, and scaffolding generation.
 *
 * @see {@link GenerateStackInput} for input options
 * @see {@link MergePlan} for the returned plan structure
 */
export { generateStack } from "./lib/stacks.js";

/**
 * Configuration for generating a dev container stack.
 * @see {@link generateStack}
 */
export type { GenerateStackInput, RepoInsert, MergePlan } from "./lib/stacks.js";
```

#### File: `src/lib/stacks.ts`

**Functions to Document:**

1. **`generateStack(input: GenerateStackInput): Promise<{ plan: MergePlan; files?: Map<string, Buffer> }>`**

```typescript
/**
 * Generates a complete dev container stack from a template.
 *
 * This function:
 * - Loads the specified template from the catalog
 * - Merges browser sidecars (handling port conflicts automatically)
 * - Adds custom features to the devcontainer configuration
 * - Injects custom files via the `inserts` option
 * - Generates lesson scaffolding (docs, assessments, metadata)
 * - Returns a plan describing all file operations
 *
 * **Port Conflict Resolution:**
 * If a browser sidecar requires a port already in use by the template,
 * the function automatically reassigns it to a port in the range 45000-49999.
 *
 * **Dry Run Mode:**
 * When `dryRun: true`, returns only the plan without file buffers.
 * This is useful for previewing changes before committing.
 *
 * @param input - Stack generation configuration
 * @returns Object containing the merge plan and optional file buffers
 * @throws {Error} When the template does not exist
 * @throws {Error} When an unknown browser sidecar ID is provided
 * @throws {Error} When an experimental feature is used without the flag
 *
 * @example
 * ```typescript
 * import { generateStack } from "@airnub/devc";
 *
 * // Generate a Next.js stack with Chrome sidecar
 * const result = await generateStack({
 *   template: "nextjs-supabase",
 *   browsers: ["neko-chrome"],
 *   features: ["ghcr.io/airnub-labs/devcontainer-features/deno:1"],
 *   preset: "ghcr.io/airnub-labs/devcontainer-images/dev-web:latest",
 *   variables: { PROJECT_NAME: "My Lesson" },
 *   semverLock: true
 * });
 *
 * console.log(`Generated ${result.plan.files.length} files`);
 * console.log(`Forwarding ${result.plan.ports.length} ports`);
 *
 * // Write files to disk
 * for (const [path, buffer] of result.files!) {
 *   await fs.writeFile(path, buffer);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Dry run to preview changes
 * const preview = await generateStack({
 *   template: "web",
 *   browsers: ["kasm-chrome"],
 *   dryRun: true
 * });
 *
 * console.log("Files to be created/updated:");
 * preview.plan.files.forEach(f => {
 *   console.log(`  ${f.op}: ${f.path}`);
 * });
 * ```
 *
 * @see {@link GenerateStackInput} for all available options
 * @see {@link MergePlan} for the plan structure
 * @public
 * @since 0.1.0
 */
export async function generateStack(input: GenerateStackInput): Promise<{ plan: MergePlan; files?: Map<string, Buffer> }> {
  // implementation
}
```

2. **`parseBrowserSelection(options): BrowserSidecar[]`**

```typescript
/**
 * Parses browser sidecar selection from CLI options.
 *
 * Accepts browsers as:
 * - CSV string: `"neko-chrome,kasm-chrome"`
 * - Array: `["neko-chrome", "kasm-chrome"]`
 * - Combination of both (merged and deduplicated)
 *
 * @param options - Browser selection options from CLI
 * @param options.withBrowsersCsv - Comma-separated browser IDs
 * @param options.withBrowser - Array of browser IDs
 * @param options.includeExperimental - Allow experimental browsers
 * @returns Array of selected browser sidecar configurations
 * @throws {Error} When an unknown browser ID is provided
 * @throws {Error} When an experimental browser is used without the flag
 *
 * @example
 * ```typescript
 * const browsers = parseBrowserSelection({
 *   withBrowsersCsv: "neko-chrome,kasm-chrome",
 *   includeExperimental: false
 * });
 * console.log(browsers.map(b => b.id)); // ["neko-chrome", "kasm-chrome"]
 * ```
 *
 * @internal
 */
export function parseBrowserSelection(options: {
  withBrowsersCsv?: string;
  withBrowser?: string[];
  includeExperimental?: boolean;
}): BrowserSidecar[] {
  // implementation
}
```

3. **`generateStackTemplate(options: GenerateStackOptions): Promise<void>`**

```typescript
/**
 * Generates a stack template and writes it to disk.
 *
 * This is a file-system version of {@link generateStack} that directly
 * writes the output to the specified directory. Use this when you want
 * to materialize a stack immediately rather than working with file buffers.
 *
 * **Safety:**
 * - Requires `force: true` to overwrite an existing directory
 * - Preserves template sections when `preserveTemplateSections: true`
 *
 * @param options - Generation options including output directory
 * @throws {Error} When the template does not exist
 * @throws {Error} When the output directory exists and force is false
 *
 * @example
 * ```typescript
 * await generateStackTemplate({
 *   repoRoot: "/path/to/catalog",
 *   templateId: "nextjs-supabase",
 *   outDir: "./workspace",
 *   browsers: [nekoChromeSidecar],
 *   force: true
 * });
 * ```
 *
 * @public
 * @since 0.1.0
 */
export async function generateStackTemplate(options: GenerateStackOptions): Promise<void> {
  // implementation
}
```

**Types to Document:**

1. **`GenerateStackInput`**

```typescript
/**
 * Configuration for generating a dev container stack.
 *
 * This type defines all options available when generating a stack via
 * {@link generateStack}. At minimum, you must provide a `template` ID.
 *
 * @example
 * ```typescript
 * const input: GenerateStackInput = {
 *   template: "nextjs-supabase",
 *   browsers: ["neko-chrome"],
 *   features: ["ghcr.io/airnub-labs/devcontainer-features/cursor-ai:1"],
 *   preset: "ghcr.io/airnub-labs/devcontainer-images/dev-web:latest",
 *   variables: {
 *     PROJECT_NAME: "AI Fundamentals Week 2",
 *     SUPABASE_PROJECT_ID: "abc123"
 *   },
 *   semverLock: true,
 *   dryRun: false,
 *   allowExperimental: false
 * };
 * ```
 *
 * @public
 */
export type GenerateStackInput = {
  /**
   * Template ID from the catalog (e.g., "nextjs-supabase", "web").
   * @example "nextjs-supabase"
   */
  template: string;

  /**
   * Browser sidecar IDs to include (e.g., "neko-chrome", "kasm-chrome").
   * Ports will be automatically reassigned if conflicts occur.
   * @default []
   */
  browsers?: string[];

  /**
   * Additional Dev Container features to install.
   * Must be fully-qualified OCI references.
   * @example ["ghcr.io/airnub-labs/devcontainer-features/deno:1"]
   * @default []
   */
  features?: string[];

  /**
   * Files to inject into the generated workspace.
   * Useful for adding custom scripts, configs, or lesson content.
   * @default []
   */
  inserts?: RepoInsert[];

  /**
   * Prebuilt image reference to use instead of local Dockerfile build.
   * When set to an empty string, removes the image field entirely.
   * @example "ghcr.io/airnub-labs/devcontainer-images/lesson-ai:1.0.0"
   * @default undefined
   */
  preset?: string | null;

  /**
   * Variables for template placeholder substitution (e.g., {{PROJECT_NAME}}).
   * @default {}
   */
  variables?: Record<string, string>;

  /**
   * Generate a `.comhra.lock.json` file with pinned versions.
   * Recommended for production lesson deployments.
   * @default false
   */
  semverLock?: boolean;

  /**
   * Return only the plan without file buffers (preview mode).
   * @default false
   */
  dryRun?: boolean;

  /**
   * Allow experimental browser sidecars and features.
   * @default false
   */
  allowExperimental?: boolean;
};
```

2. **`MergePlan`**

```typescript
/**
 * Describes the file operations, ports, and notes for a stack generation.
 *
 * The plan is returned by {@link generateStack} and provides a detailed
 * overview of what will be created or modified when the stack is materialized.
 *
 * @example
 * ```typescript
 * const { plan } = await generateStack({ template: "web" });
 *
 * console.log("Files:");
 * plan.files.forEach(f => console.log(`  ${f.op}: ${f.path}`));
 *
 * console.log("\nPorts:");
 * plan.ports.forEach(p => console.log(`  ${p.port} (${p.visibility})`));
 *
 * console.log("\nNotes:");
 * plan.notes.forEach(n => console.warn(`  ⚠ ${n}`));
 * ```
 *
 * @public
 */
export type MergePlan = {
  /**
   * List of file operations (create, update, skip).
   */
  files: Array<{
    /** Relative path within the workspace */
    path: string;
    /** Operation type */
    op: "create" | "update" | "skip";
    /** Human-readable reason for the operation */
    reason?: string;
  }>;

  /**
   * Ports to be forwarded by the dev container.
   * Sorted numerically.
   */
  ports: Array<{
    /** Port number (1-65535) */
    port: number;
    /** Human-readable label for the port */
    label?: string;
    /** Port visibility scope */
    visibility?: "private" | "org" | "public";
  }>;

  /**
   * Services to auto-start via `runServices` in devcontainer.json.
   * @example ["neko", "supabase"]
   */
  runServices: string[];

  /**
   * Environment variables to inject via `containerEnv`.
   * Includes default values from browser sidecars and templates.
   */
  env: Record<string, string>;

  /**
   * Warnings and informational messages about the generation.
   * Common notes include port reassignments, missing required env vars,
   * and security warnings about default credentials.
   * @example ["Port 8080 for Neko Chrome reassigned to 45000"]
   */
  notes: string[];
};
```

3. **`RepoInsert`**

```typescript
/**
 * Describes a file to inject into the generated workspace.
 *
 * @example
 * ```typescript
 * const inserts: RepoInsert[] = [
 *   {
 *     path: "scripts/setup.sh",
 *     content: "#!/bin/bash\necho 'Hello, student!'",
 *     mode: 0o755 // executable
 *   },
 *   {
 *     path: "docs/lesson-plan.md",
 *     content: "# Week 1: Introduction\n\nToday we learn..."
 *   }
 * ];
 * ```
 *
 * @public
 */
export type RepoInsert = {
  /**
   * Relative path within the workspace (e.g., "scripts/init.sh").
   * Leading slashes are stripped automatically.
   */
  path: string;

  /**
   * File content as string or Buffer.
   * For binary files, use Buffer.
   */
  content: string | Buffer;

  /**
   * UNIX file mode (permissions) as octal number.
   * @example 0o755 for executable scripts
   * @example 0o644 for regular files (default)
   * @default 0o644
   */
  mode?: number;
};
```

---

### Package 2: Codespaces Adapter SDK (`packages/sdk-codespaces-adapter`)

#### File: `src/index.ts`

**File-level JSDoc:**

```typescript
/**
 * GitHub Codespaces integration SDK.
 *
 * This package provides a TypeScript client for managing GitHub Codespaces
 * programmatically, including:
 * - Creating and configuring codespaces
 * - Managing port visibility and labels
 * - Setting secrets (user, org, repo scopes)
 * - Starting, stopping, and deleting codespaces
 *
 * @example
 * ```typescript
 * import { makeCodespacesAdapter } from "@airnub/sdk-codespaces-adapter";
 *
 * const adapter = makeCodespacesAdapter();
 * await adapter.ensureAuth({ kind: "pat", token: process.env.GITHUB_TOKEN });
 *
 * const codespace = await adapter.create({
 *   repo: { owner: "myorg", repo: "myrepo", ref: "main" },
 *   displayName: "Student Workspace",
 *   machine: "standardLinux32gb"
 * });
 *
 * console.log(`Created: ${codespace.webUrl}`);
 * ```
 *
 * @packageDocumentation
 * @module @airnub/sdk-codespaces-adapter
 */
```

#### File: `src/adapter.ts`

**Class: `CodespacesAdapter`**

```typescript
/**
 * High-level client for managing GitHub Codespaces.
 *
 * This adapter wraps the GitHub REST API and provides convenience methods
 * for common codespace operations. It handles:
 * - Authentication (PAT or GitHub App)
 * - Rate limiting with exponential backoff
 * - Polling for codespace readiness
 * - Secret encryption using libsodium
 *
 * **Lifecycle:**
 * 1. Create an adapter with {@link makeCodespacesAdapter}
 * 2. Authenticate with {@link ensureAuth}
 * 3. Perform operations (create, list, etc.)
 *
 * @example
 * ```typescript
 * const adapter = new CodespacesAdapter();
 * await adapter.ensureAuth({ kind: "pat", token: "ghp_..." });
 *
 * const codespace = await adapter.create({
 *   repo: { owner: "airnub-labs", repo: "devcontainers-catalog" },
 *   displayName: "My Workspace",
 *   machine: "standardLinux32gb",
 *   ports: [
 *     { port: 3000, visibility: "private", label: "App" }
 *   ]
 * });
 * ```
 *
 * @see {@link makeCodespacesAdapter} for factory function
 * @see {@link ICodespacesAdapter} for the interface contract
 * @public
 */
export class CodespacesAdapter implements ICodespacesAdapter {
  /**
   * Authenticates the adapter with GitHub.
   *
   * Must be called before any other methods. Supports:
   * - **PAT (Personal Access Token)**: `{ kind: "pat", token: "ghp_..." }`
   * - **GitHub App**: `{ kind: "github-app", appId, installationId, privateKeyPem }`
   *
   * @param auth - Authentication credentials
   * @param opts - Optional configuration
   * @param opts.baseUrl - Custom GitHub API URL (for Enterprise)
   * @throws {AuthError} When authentication fails
   *
   * @example
   * ```typescript
   * // PAT authentication
   * await adapter.ensureAuth({ kind: "pat", token: process.env.GITHUB_TOKEN });
   *
   * // GitHub App authentication
   * await adapter.ensureAuth({
   *   kind: "github-app",
   *   appId: 123456,
   *   installationId: 789012,
   *   privateKeyPem: fs.readFileSync("private-key.pem", "utf8")
   * });
   * ```
   */
  async ensureAuth(auth: AuthMode, opts?: { baseUrl?: string }): Promise<void> {
    // implementation
  }

  /**
   * Lists codespaces accessible to the authenticated user.
   *
   * @param params - Optional filters
   * @param params.owner - Filter by repository owner
   * @param params.repo - Filter by repository name
   * @param params.state - Filter by state ("active", "stopped", etc.)
   * @returns Array of codespace info objects
   * @throws {AuthError} When not authenticated (call {@link ensureAuth} first)
   *
   * @example
   * ```typescript
   * // List all user codespaces
   * const all = await adapter.listCodespaces();
   *
   * // List codespaces for a specific repo
   * const repoSpaces = await adapter.listCodespaces({
   *   owner: "airnub-labs",
   *   repo: "devcontainers-catalog"
   * });
   * ```
   */
  async listCodespaces(params?: { owner?: string; repo?: string; state?: string }): Promise<CodespaceInfo[]> {
    // implementation
  }

  /**
   * Retrieves a codespace by its name.
   *
   * @param name - Codespace name (e.g., "airnub-labs-devcontainers-catalog-abc123")
   * @returns Codespace info or null if not found
   * @throws {AuthError} When not authenticated
   *
   * @example
   * ```typescript
   * const cs = await adapter.getCodespaceByName("my-codespace-abc123");
   * if (cs) {
   *   console.log(`State: ${cs.state}, URL: ${cs.webUrl}`);
   * }
   * ```
   */
  async getCodespaceByName(name: string): Promise<CodespaceInfo | null> {
    // implementation
  }

  /**
   * Retrieves a codespace by its ID or name.
   *
   * Alias for {@link getCodespaceByName} for convenience.
   *
   * @param id - Codespace ID or name
   * @returns Codespace info or null if not found
   */
  async getCodespace(id: string): Promise<CodespaceInfo | null> {
    // implementation
  }

  /**
   * Lists available machine types for a repository.
   *
   * Machine types determine the CPU, memory, and storage available
   * to the codespace. Common types include:
   * - `basicLinux32gb` - 2 cores, 8 GB RAM, 32 GB storage
   * - `standardLinux32gb` - 4 cores, 16 GB RAM, 32 GB storage
   * - `premiumLinux` - 8 cores, 32 GB RAM, 64 GB storage
   *
   * @param repo - Repository reference
   * @returns Array of machine type names
   * @throws {NotFoundError} When the repository does not exist
   *
   * @example
   * ```typescript
   * const machines = await adapter.listMachines({
   *   owner: "airnub-labs",
   *   repo: "devcontainers-catalog"
   * });
   * console.log(`Available machines: ${machines.join(", ")}`);
   * ```
   */
  async listMachines(repo: RepoRef): Promise<string[]> {
    // implementation
  }

  /**
   * Plans a codespace creation by validating inputs and returning actions.
   *
   * This is a dry-run method that checks:
   * - Whether the machine type is available for the repository
   * - Whether the devcontainer path exists
   * - Whether `schoolMode` conflicts with port visibility settings
   *
   * Use this to preview operations before calling {@link create}.
   *
   * @param req - Codespace creation request
   * @returns Plan with actions and validation notes
   *
   * @example
   * ```typescript
   * const plan = await adapter.planCreate({
   *   repo: { owner: "myorg", repo: "myrepo" },
   *   displayName: "Test Workspace",
   *   machine: "nonexistentMachine"
   * });
   *
   * plan.notes.forEach(note => {
   *   if (note.level === "error") {
   *     console.error(`❌ ${note.message}`);
   *   }
   * });
   * ```
   */
  async planCreate(req: CreateCodespaceRequest): Promise<Plan> {
    // implementation
  }

  /**
   * Creates a new GitHub Codespace.
   *
   * This method:
   * 1. Creates the codespace via the GitHub API
   * 2. Polls for up to 2 minutes until the codespace is ready
   * 3. Applies port visibility settings if provided
   * 4. Returns the final codespace state
   *
   * **Note:** Creation may take 1-5 minutes depending on machine type
   * and devcontainer complexity.
   *
   * @param req - Codespace creation request
   * @returns Created codespace information
   * @throws {ValidationError} When required fields are missing
   * @throws {RateLimitError} When GitHub API rate limit is exceeded
   *
   * @example
   * ```typescript
   * const codespace = await adapter.create({
   *   repo: { owner: "airnub-labs", repo: "devcontainers-catalog", ref: "main" },
   *   displayName: "Student Workspace - Alice",
   *   machine: "standardLinux32gb",
   *   devcontainerPath: ".devcontainer/devcontainer.json",
   *   idleTimeoutMinutes: 30,
   *   retentionPeriodMinutes: 10080, // 7 days
   *   ports: [
   *     { port: 3000, visibility: "private", label: "Next.js App" },
   *     { port: 8080, visibility: "private", label: "Chrome DevTools" }
   *   ],
   *   environmentVariables: {
   *     STUDENT_ID: "alice-123",
   *     LESSON_WEEK: "2"
   *   },
   *   schoolMode: true
   * });
   *
   * console.log(`Created: ${codespace.webUrl}`);
   * ```
   */
  async create(req: CreateCodespaceRequest): Promise<CodespaceInfo> {
    // implementation
  }

  /**
   * Stops a running codespace.
   *
   * @param target - Codespace identifier (name or id)
   * @throws {ValidationError} When neither name nor id is provided
   * @throws {NotFoundError} When the codespace does not exist
   *
   * @example
   * ```typescript
   * await adapter.stop({ name: "my-codespace-abc123" });
   * ```
   */
  async stop(target: { id?: string; name?: string }): Promise<void> {
    // implementation
  }

  /**
   * Starts a stopped codespace and waits for it to become available.
   *
   * Polls for up to 2 minutes. If the codespace is not ready by then,
   * returns the current state (which may be "starting").
   *
   * @param target - Codespace identifier
   * @returns Updated codespace information
   * @throws {ValidationError} When neither name nor id is provided
   *
   * @example
   * ```typescript
   * const cs = await adapter.start({ name: "my-codespace-abc123" });
   * console.log(`State: ${cs.state}`); // "available"
   * ```
   */
  async start(target: { id?: string; name?: string }): Promise<CodespaceInfo> {
    // implementation
  }

  /**
   * Permanently deletes a codespace.
   *
   * **Warning:** This action is irreversible. All data in the codespace
   * will be lost.
   *
   * @param target - Codespace identifier
   * @throws {ValidationError} When neither name nor id is provided
   *
   * @example
   * ```typescript
   * await adapter.delete({ name: "my-codespace-abc123" });
   * ```
   */
  async delete(target: { id?: string; name?: string }): Promise<void> {
    // implementation
  }

  /**
   * Updates port visibility and labels for a codespace.
   *
   * Port visibility controls who can access forwarded ports:
   * - `"private"`: Only the codespace owner
   * - `"org"`: Organization members
   * - `"public"`: Anyone with the URL
   *
   * **Security Note:** For classroom environments, use `schoolMode: true`
   * in {@link create} to enforce private-only ports.
   *
   * @param target - Codespace identifier
   * @param ports - Array of port configurations
   * @throws {ValidationError} When neither name nor id is provided
   *
   * @example
   * ```typescript
   * await adapter.setPorts(
   *   { name: "my-codespace-abc123" },
   *   [
   *     { port: 3000, visibility: "org", label: "Next.js Dev Server" },
   *     { port: 5432, visibility: "private", label: "PostgreSQL" }
   *   ]
   * );
   * ```
   */
  async setPorts(target: { id?: string; name?: string }, ports: PortRequest[]): Promise<void> {
    // implementation
  }

  /**
   * Sets encrypted secrets for codespaces.
   *
   * Secrets are encrypted using libsodium and the repository/org/user
   * public key before being sent to GitHub. Supports three scopes:
   * - `"repo"`: Secrets available to codespaces in a specific repository
   * - `"org"`: Secrets available to all codespaces in an organization
   * - `"user"`: Secrets available to all codespaces for the authenticated user
   *
   * @param scope - Secret scope
   * @param entries - Key-value pairs of secret names and values
   * @param ctx - Context for repo or org secrets
   * @param ctx.repo - Required when scope is "repo"
   * @param ctx.org - Required when scope is "org"
   * @throws {ValidationError} When required context is missing
   *
   * @example
   * ```typescript
   * // Set repository secrets
   * await adapter.setSecrets("repo", {
   *   SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   DATABASE_URL: "postgresql://user:pass@host:5432/db"
   * }, {
   *   repo: { owner: "airnub-labs", repo: "devcontainers-catalog" }
   * });
   *
   * // Set user secrets
   * await adapter.setSecrets("user", {
   *   OPENAI_API_KEY: "sk-..."
   * });
   * ```
   *
   * @see {@link sealForGitHub} for the encryption implementation
   */
  async setSecrets(
    scope: "repo" | "org" | "user",
    entries: Record<string, string>,
    ctx?: { repo?: RepoRef; org?: string }
  ): Promise<void> {
    // implementation
  }

  /**
   * Gets the web URL for a codespace.
   *
   * @param target - Codespace identifier
   * @returns Full HTTPS URL to access the codespace in a browser
   * @throws {ValidationError} When the codespace is not found
   *
   * @example
   * ```typescript
   * const url = await adapter.openUrl({ name: "my-codespace-abc123" });
   * console.log(`Open in browser: ${url}`);
   * ```
   */
  async openUrl(target: { id?: string; name?: string }): Promise<string> {
    // implementation
  }
}
```

**Factory Function:**

```typescript
/**
 * Creates a new CodespacesAdapter instance.
 *
 * @returns A fresh adapter instance (not authenticated)
 *
 * @example
 * ```typescript
 * import { makeCodespacesAdapter } from "@airnub/sdk-codespaces-adapter";
 *
 * const adapter = makeCodespacesAdapter();
 * await adapter.ensureAuth({ kind: "pat", token: process.env.GITHUB_TOKEN });
 * ```
 *
 * @public
 */
export function makeCodespacesAdapter(): ICodespacesAdapter {
  return new CodespacesAdapter();
}
```

#### File: `src/types.ts`

**Type: `AuthMode`**

```typescript
/**
 * Authentication mode for GitHub API access.
 *
 * Supports two authentication methods:
 * - **Personal Access Token (PAT)**: For individual developer use
 * - **GitHub App**: For automated systems and production deployments
 *
 * @example
 * ```typescript
 * // PAT authentication
 * const auth: AuthMode = {
 *   kind: "pat",
 *   token: "ghp_1234567890abcdefghijklmnop"
 * };
 *
 * // GitHub App authentication
 * const appAuth: AuthMode = {
 *   kind: "github-app",
 *   appId: 123456,
 *   installationId: 789012,
 *   privateKeyPem: fs.readFileSync("app-private-key.pem", "utf8")
 * };
 * ```
 *
 * @public
 */
export type AuthMode =
  | { kind: "pat"; token: string }
  | { kind: "github-app"; appId: number; installationId: number; privateKeyPem: string };
```

**Type: `CreateCodespaceRequest`**

```typescript
/**
 * Request for creating a new GitHub Codespace.
 *
 * At minimum, you must provide a `repo` reference. All other fields
 * are optional and have sensible defaults.
 *
 * @example
 * ```typescript
 * const request: CreateCodespaceRequest = {
 *   repo: { owner: "airnub-labs", repo: "devcontainers-catalog", ref: "main" },
 *   displayName: "Lesson 2 - Student Alice",
 *   machine: "standardLinux32gb",
 *   devcontainerPath: ".devcontainer/devcontainer.json",
 *   idleTimeoutMinutes: 30,
 *   retentionPeriodMinutes: 10080, // 7 days
 *   ports: [
 *     { port: 3000, visibility: "private", label: "App" }
 *   ],
 *   environmentVariables: {
 *     STUDENT_ID: "alice-123"
 *   },
 *   schoolMode: true
 * };
 * ```
 *
 * @public
 */
export type CreateCodespaceRequest = {
  /**
   * Repository reference (owner, repo, optional ref).
   * @example { owner: "airnub-labs", repo: "devcontainers-catalog", ref: "main" }
   */
  repo: RepoRef;

  /**
   * Path to the devcontainer configuration file.
   * @default ".devcontainer/devcontainer.json"
   */
  devcontainerPath?: string;

  /**
   * Machine type (CPU/memory configuration).
   * Use {@link CodespacesAdapter.listMachines} to see available types.
   * @example "standardLinux32gb"
   */
  machine?: string;

  /**
   * Preferred region for the codespace.
   * @example "EastUs"
   */
  region?: Region;

  /**
   * Human-readable name for the codespace.
   * @example "Lesson 2 - Alice"
   */
  displayName?: string;

  /**
   * Minutes of inactivity before auto-stopping the codespace.
   * @default 30
   */
  idleTimeoutMinutes?: number;

  /**
   * Minutes to retain the codespace after it is stopped.
   * After this period, the codespace is automatically deleted.
   * @default 10080 (7 days)
   */
  retentionPeriodMinutes?: number;

  /**
   * Environment variables to inject into the container.
   * These are set via `containerEnv` in the devcontainer.
   */
  environmentVariables?: Record<string, string>;

  /**
   * Secrets to set before starting the codespace.
   * These are encrypted and stored in GitHub Codespaces secrets.
   */
  secrets?: Record<string, string>;

  /**
   * Port forwarding configurations.
   * Applied after the codespace is created.
   */
  ports?: PortRequest[];

  /**
   * Start the codespace immediately after creation.
   * @default true
   */
  startImmediately?: boolean;

  /**
   * Enable school mode (enforces private-only port visibility).
   * Use this for student workspaces to prevent accidental public exposure.
   * @default false
   */
  schoolMode?: boolean;
};
```

**Type: `CodespaceInfo`**

```typescript
/**
 * Information about a GitHub Codespace.
 *
 * @example
 * ```typescript
 * const info: CodespaceInfo = {
 *   id: "monalisa-myrepo-abc123",
 *   name: "monalisa-myrepo-abc123",
 *   state: "available",
 *   webUrl: "https://monalisa-myrepo-abc123.github.dev",
 *   createdAt: "2023-10-15T14:30:00Z",
 *   lastUsedAt: "2023-10-15T16:45:00Z",
 *   region: "EastUs",
 *   machine: "standardLinux32gb",
 *   repo: { owner: "monalisa", repo: "myrepo" }
 * };
 * ```
 *
 * @public
 */
export type CodespaceInfo = {
  /** Unique identifier */
  id: string;

  /** Human-readable name (same as id for most cases) */
  name: string;

  /**
   * Codespace state.
   * Common states: "available", "stopped", "starting", "shutting_down"
   */
  state: string;

  /** Full HTTPS URL to access the codespace in a browser */
  webUrl: string;

  /** ISO 8601 timestamp of creation */
  createdAt: string;

  /** ISO 8601 timestamp of last use (may be undefined) */
  lastUsedAt?: string;

  /** Region where the codespace is hosted */
  region?: Region;

  /** Machine type used by the codespace */
  machine?: string;

  /** Repository the codespace was created from */
  repo: RepoRef;
};
```

**Type: `PortRequest`**

```typescript
/**
 * Configuration for a forwarded port in a codespace.
 *
 * @example
 * ```typescript
 * const ports: PortRequest[] = [
 *   { port: 3000, visibility: "private", label: "Next.js Dev Server" },
 *   { port: 8080, visibility: "org", label: "Chrome DevTools" },
 *   { port: 5432, visibility: "private", label: "PostgreSQL" }
 * ];
 * ```
 *
 * @public
 */
export type PortRequest = {
  /**
   * Port number (1-65535).
   * @example 3000
   */
  port: number;

  /**
   * Visibility scope for the port.
   * - `"private"`: Only the codespace owner
   * - `"org"`: Organization members
   * - `"public"`: Anyone with the URL
   */
  visibility: PortVisibility;

  /**
   * Human-readable label for the port.
   * Shown in the GitHub Ports panel.
   * @example "Next.js App"
   */
  label?: string;
};
```

**Type: `Plan`**

```typescript
/**
 * Execution plan for codespace operations.
 *
 * Returned by {@link CodespacesAdapter.planCreate} to preview actions
 * and validation notes before committing changes.
 *
 * @example
 * ```typescript
 * const plan = await adapter.planCreate({ repo, displayName, machine: "invalidMachine" });
 *
 * plan.notes.forEach(note => {
 *   const icon = note.level === "error" ? "❌" : "⚠️";
 *   console.log(`${icon} ${note.message}`);
 * });
 *
 * if (plan.notes.some(n => n.level === "error")) {
 *   throw new Error("Cannot proceed with errors");
 * }
 * ```
 *
 * @public
 */
export type Plan = {
  /**
   * Ordered list of operations to execute.
   */
  actions: Array<
    | { op: "create-codespace"; req: CreateCodespaceRequest }
    | { op: "update-ports"; req: PortRequest[]; target: { id?: string; name?: string } }
    | { op: "stop-codespace"; target: { id?: string; name?: string } }
    | { op: "start-codespace"; target: { id?: string; name?: string } }
    | { op: "delete-codespace"; target: { id?: string; name?: string } }
    | { op: "set-secrets"; scope: "repo" | "org" | "user"; entries: string[]; repo?: RepoRef; org?: string }
  >;

  /**
   * Validation notes and warnings.
   * - `"error"`: Blocks execution (e.g., invalid machine type)
   * - `"warn"`: Suggests caution (e.g., devcontainer not found)
   * - `"info"`: Informational message
   */
  notes: PlanNote[];
};

/**
 * A single note in a {@link Plan}.
 *
 * @public
 */
export type PlanNote = {
  /** Severity level */
  level: "info" | "warn" | "error";

  /** Human-readable message */
  message: string;
};
```

#### File: `src/errors.ts`

```typescript
/**
 * Thrown when authentication fails or credentials are invalid.
 *
 * @example
 * ```typescript
 * try {
 *   await adapter.ensureAuth({ kind: "pat", token: "invalid" });
 * } catch (error) {
 *   if (error instanceof AuthError) {
 *     console.error("Authentication failed:", error.message);
 *   }
 * }
 * ```
 *
 * @public
 */
export class AuthError extends Error {}

/**
 * Thrown when a requested resource does not exist.
 *
 * @example
 * ```typescript
 * try {
 *   const cs = await adapter.getCodespace("nonexistent");
 * } catch (error) {
 *   if (error instanceof NotFoundError) {
 *     console.error("Codespace not found");
 *   }
 * }
 * ```
 *
 * @public
 */
export class NotFoundError extends Error {}

/**
 * Thrown when input validation fails.
 *
 * @example
 * ```typescript
 * try {
 *   await adapter.stop({});
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error("Validation error:", error.message);
 *   }
 * }
 * ```
 *
 * @public
 */
export class ValidationError extends Error {}

/**
 * Thrown when GitHub API rate limit is exceeded.
 *
 * The SDK automatically retries with exponential backoff for up to 5 attempts.
 * If all retries fail, this error is thrown.
 *
 * @example
 * ```typescript
 * try {
 *   const codespaces = await adapter.listCodespaces();
 * } catch (error) {
 *   if (error instanceof RateLimitError) {
 *     console.error("Rate limit exceeded");
 *     if (error.retryAfterSec) {
 *       console.log(`Retry after ${error.retryAfterSec} seconds`);
 *     }
 *   }
 * }
 * ```
 *
 * @public
 */
export class RateLimitError extends Error {
  /**
   * @param message - Error message
   * @param retryAfterSec - Seconds until rate limit resets (from Retry-After header)
   */
  constructor(message: string, public retryAfterSec?: number) {
    super(message);
  }
}
```

#### File: `src/seal.ts`

```typescript
/**
 * Encrypts a secret value for GitHub using libsodium sealed boxes.
 *
 * GitHub requires secrets to be encrypted with the repository/org/user
 * public key before they can be stored. This function performs the
 * encryption using the `crypto_box_seal` algorithm.
 *
 * **Algorithm:** Sealed box encryption (X25519 + XSalsa20Poly1305)
 *
 * @param publicKeyBase64 - Base64-encoded public key from GitHub API
 * @param secretValue - Plain-text secret value to encrypt
 * @returns Object with base64-encoded encrypted value
 *
 * @example
 * ```typescript
 * import { sealForGitHub } from "@airnub/sdk-codespaces-adapter";
 *
 * // Get public key from GitHub
 * const keyRes = await octokit.request("GET /user/codespaces/secrets/public-key");
 * const publicKey = keyRes.data.key;
 *
 * // Encrypt secret
 * const { encrypted_value } = await sealForGitHub(publicKey, "my-secret-value");
 *
 * // Store secret
 * await octokit.request("PUT /user/codespaces/secrets/{secret_name}", {
 *   secret_name: "MY_SECRET",
 *   encrypted_value,
 *   key_id: keyRes.data.key_id
 * });
 * ```
 *
 * @see https://docs.github.com/en/rest/actions/secrets
 * @public
 */
export async function sealForGitHub(
  publicKeyBase64: string,
  secretValue: string
): Promise<{ encrypted_value: string }> {
  // implementation
}
```

#### File: `src/github-client.ts`

**Class: `GithubClient`** (only document public-facing methods if exported)

```typescript
/**
 * Low-level GitHub REST API client for Codespaces operations.
 *
 * This class wraps the Octokit client and provides typed methods for
 * common codespace operations. It handles:
 * - Rate limiting with exponential backoff
 * - Error normalization (404 → null for get operations)
 * - Type conversions (API responses → SDK types)
 *
 * **Note:** Most users should use {@link CodespacesAdapter} instead,
 * which provides a higher-level interface.
 *
 * @example
 * ```typescript
 * import { makeOctokit } from "@airnub/sdk-codespaces-adapter";
 * import { GithubClient } from "@airnub/sdk-codespaces-adapter";
 *
 * const { octokit } = await makeOctokit({ kind: "pat", token: "..." });
 * const client = new GithubClient(octokit);
 *
 * const codespaces = await client.listCodespaces();
 * ```
 *
 * @internal
 */
export class GithubClient {
  // Only document if exported publicly
}
```

---

## Implementation Guidelines

### General Principles

1. **Write for Developers, Not Compilers:**
   - Assume the reader is unfamiliar with the codebase
   - Explain **why**, not just **what**
   - Highlight common pitfalls and edge cases

2. **Use Active Voice:**
   - ✅ "Creates a new codespace"
   - ❌ "A new codespace is created"

3. **Be Concise Yet Complete:**
   - Start with a one-liner (< 80 characters)
   - Follow with 1-3 paragraphs for complex functions
   - Use bullet lists for multi-step processes

4. **Provide Realistic Examples:**
   - Show real-world usage, not trivial cases
   - Include error handling patterns
   - Demonstrate common workflows (create → configure → start)

5. **Cross-Reference Related APIs:**
   - Use `@see` for related types/functions
   - Link to GitHub docs for API endpoints
   - Reference complementary methods (e.g., `create` → `setPorts`)

### Code Quality Standards

- ✅ Every public export has JSDoc
- ✅ All parameters and return types documented
- ✅ At least one `@example` per function/class
- ✅ Error conditions documented with `@throws`
- ✅ Related APIs cross-referenced with `@see`
- ✅ Deprecations marked with `@deprecated` + migration path
- ✅ Internal APIs marked with `@internal`

---

## Success Criteria

### Coverage Metrics

Run the following to verify documentation coverage:

```bash
# Generate TypeDoc documentation
npx typedoc --out docs src/index.ts

# Check for missing docs (custom script or manual review)
# All public exports should have JSDoc
```

### Documentation Quality Checklist

- [ ] All public functions have JSDoc comments
- [ ] All public classes have JSDoc comments
- [ ] All public types have JSDoc comments
- [ ] All parameters are documented
- [ ] All return values are documented
- [ ] All exceptions are documented with `@throws`
- [ ] Each function/class has at least one `@example`
- [ ] Related APIs are cross-referenced with `@see`
- [ ] Internal APIs are marked with `@internal`
- [ ] Complex logic is explained with detailed descriptions

### IDE Integration Test

Verify that IDEs provide helpful autocomplete:

1. **Import a function:**
   ```typescript
   import { generateStack } from "@airnub/devc";
   ```

2. **Hover over function:**
   - Should show one-line summary + detailed description
   - Should show parameter types and descriptions
   - Should show return type and description

3. **Autocomplete parameters:**
   - Should suggest parameter names
   - Should show parameter descriptions on hover

---

## Deliverables

### Files to Modify

1. **`tools/airnub-devc/src/sdk.ts`**
   - Add file-level JSDoc
   - Document re-exports

2. **`tools/airnub-devc/src/lib/stacks.ts`**
   - Document `generateStack()` function
   - Document `generateStackTemplate()` function
   - Document `parseBrowserSelection()` function
   - Document `GenerateStackInput` type
   - Document `MergePlan` type
   - Document `RepoInsert` type

3. **`packages/sdk-codespaces-adapter/src/index.ts`**
   - Add file-level JSDoc

4. **`packages/sdk-codespaces-adapter/src/adapter.ts`**
   - Document `CodespacesAdapter` class
   - Document all public methods
   - Document `makeCodespacesAdapter()` function

5. **`packages/sdk-codespaces-adapter/src/types.ts`**
   - Document all exported types

6. **`packages/sdk-codespaces-adapter/src/errors.ts`**
   - Document all error classes

7. **`packages/sdk-codespaces-adapter/src/seal.ts`**
   - Document `sealForGitHub()` function

### Optional: Generate API Documentation

Consider generating HTML documentation using TypeDoc:

```bash
# Install TypeDoc
npm install --save-dev typedoc

# Generate docs
npx typedoc --out docs/api tools/airnub-devc/src/sdk.ts
npx typedoc --out docs/api packages/sdk-codespaces-adapter/src/index.ts

# Publish to GitHub Pages (optional)
```

---

## Final Validation

Run these commands to validate implementation:

```bash
# 1. Check TypeScript compilation (ensures JSDoc is syntactically correct)
cd tools/airnub-devc
npm run build

cd packages/sdk-codespaces-adapter
npm run build

# 2. Lint JSDoc comments (if ESLint is configured)
npm run lint

# 3. Generate documentation
npx typedoc --out docs src/index.ts

# 4. Test IDE integration
# - Open VS Code
# - Import a function
# - Hover to see JSDoc
# - Verify autocomplete shows descriptions
```

---

## Notes for the Agent

### What NOT to Do

- ❌ Don't generate documentation for internal/private functions (unless explicitly exported)
- ❌ Don't copy implementation details into comments (avoid redundancy)
- ❌ Don't use generic placeholders like "TODO" or "FIXME"
- ❌ Don't document obvious types (e.g., `@param name - The name` is useless)
- ❌ Don't leave `@example` blocks empty

### What TO Do

- ✅ Focus on **why** and **when** to use the API, not just **how**
- ✅ Provide realistic, copy-paste ready examples
- ✅ Document edge cases and common mistakes
- ✅ Cross-reference related APIs with `@see`
- ✅ Use consistent terminology across all docs
- ✅ Test documentation in an IDE (hover, autocomplete)

---

## Context for the Agent

This is a **high-impact task** for the Airnub DevContainers Catalog project. The SDK is consumed by:
- **Educators** creating lesson environments via the CLI
- **Platform developers** integrating catalog generation into LMS systems
- **DevOps engineers** automating codespace provisioning

**Current state:** The SDK has zero JSDoc documentation. Functions are well-typed but lack usage guidance.

**Goal:** Transform the SDK into a **self-documenting API** where developers can:
1. Understand purpose and behavior from IDE hover tooltips
2. See realistic examples without reading source code
3. Discover related APIs via `@see` links
4. Avoid common pitfalls highlighted in documentation

---

## Resources

- **JSDoc Reference:** https://jsdoc.app/
- **TypeScript JSDoc Support:** https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
- **TypeDoc:** https://typedoc.org/
- **TSDoc Standard:** https://tsdoc.org/

---

**Good luck! Let's make the Airnub SDK the most developer-friendly catalog SDK in the ecosystem. 📚✨**
