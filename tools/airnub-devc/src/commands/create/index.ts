import * as p from "@clack/prompts";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import { stringify as stringifyYaml } from "yaml";
import { loadServiceRegistry, filterServicesByStability } from "../../lib/services.js";
import { loadSchema, loadManifest } from "../../lib/schema.js";
import type { CatalogContext } from "../../lib/catalog.js";
import type { LessonEnv } from "../../types.js";

// Preset metadata with descriptions
const PRESETS = [
  {
    value: "node-pnpm",
    label: "Node.js + pnpm",
    hint: "Node.js 24 with pnpm - fast for web apps",
    startup: "30-45s",
    cost: 5,
    use_case: ["web", "frontend", "backend"],
  },
  {
    value: "python",
    label: "Python 3.12",
    hint: "Python with pip - for data science, scripts",
    startup: "30-45s",
    cost: 4,
    use_case: ["data", "scripting", "api"],
  },
  {
    value: "python-prefect",
    label: "Python + Prefect",
    hint: "Python with Prefect orchestration",
    startup: "60-90s",
    cost: 6,
    use_case: ["data", "orchestration", "workflows"],
  },
  {
    value: "python-airflow",
    label: "Python + Airflow",
    hint: "Python with Apache Airflow",
    startup: "60-90s",
    cost: 6,
    use_case: ["data", "orchestration", "workflows"],
  },
  {
    value: "python-dagster",
    label: "Python + Dagster",
    hint: "Python with Dagster orchestration",
    startup: "60-90s",
    cost: 6,
    use_case: ["data", "orchestration", "workflows"],
  },
  {
    value: "ts-temporal",
    label: "TypeScript + Temporal",
    hint: "TypeScript with Temporal workflows",
    startup: "60-90s",
    cost: 6,
    use_case: ["workflows", "orchestration", "microservices"],
  },
  {
    value: "full",
    label: "Full Stack",
    hint: "Node + Python + Jupyter - comprehensive but slower",
    startup: "2-3min",
    cost: 8,
    use_case: ["fullstack", "comprehensive", "teaching"],
  },
];

// Course type templates to help guide users
const COURSE_TYPES = [
  {
    value: "web-frontend",
    label: "Web Development (Frontend)",
    hint: "HTML, CSS, JavaScript, React",
    recommended_preset: "node-pnpm",
    recommended_services: [],
  },
  {
    value: "web-backend",
    label: "Web Development (Backend)",
    hint: "Node.js, Express, APIs",
    recommended_preset: "node-pnpm",
    recommended_services: ["redis", "supabase"],
  },
  {
    value: "web-fullstack",
    label: "Full-Stack Web Application",
    hint: "Next.js, React, Database",
    recommended_preset: "node-pnpm",
    recommended_services: ["supabase", "redis"],
  },
  {
    value: "data-science",
    label: "Data Science",
    hint: "Python, Jupyter, Pandas, ML",
    recommended_preset: "python",
    recommended_services: [],
  },
  {
    value: "data-engineering",
    label: "Data Engineering",
    hint: "ETL, pipelines, orchestration",
    recommended_preset: "python-prefect",
    recommended_services: ["prefect", "redis"],
  },
  {
    value: "workflows",
    label: "Workflow Orchestration",
    hint: "Airflow, Prefect, Temporal",
    recommended_preset: "python-prefect",
    recommended_services: ["prefect"],
  },
  {
    value: "custom",
    label: "Custom",
    hint: "Build from scratch",
    recommended_preset: "node-pnpm",
    recommended_services: [],
  },
];

interface CreateManifestOptions {
  out?: string;
  template?: string;
  nonInteractive?: boolean;
  catalog: CatalogContext;
}

interface ServiceCompatibility {
  conflicts: string[];
  warnings: string[];
  estimatedStartupAdd: number; // seconds to add to startup time
}

/**
 * Check compatibility between preset and services
 */
function checkCompatibility(
  presetId: string,
  serviceIds: string[],
): ServiceCompatibility {
  const conflicts: string[] = [];
  const warnings: string[] = [];
  let estimatedStartupAdd = 0;

  // Check for orchestrator conflicts
  const orchestrators = serviceIds.filter((s) =>
    ["prefect", "airflow", "dagster", "temporal"].includes(s)
  );
  if (orchestrators.length > 1) {
    conflicts.push(
      `Multiple orchestrators selected: ${orchestrators.join(", ")}. Choose only one.`,
    );
  }

  // Check if orchestrator matches preset
  if (presetId.includes("prefect") && !serviceIds.includes("prefect")) {
    warnings.push(
      "You selected python-prefect preset but didn't add the prefect service. Consider adding it.",
    );
  }
  if (presetId.includes("airflow") && !serviceIds.includes("airflow")) {
    warnings.push(
      "You selected python-airflow preset but didn't add the airflow service.",
    );
  }
  if (presetId.includes("dagster") && !serviceIds.includes("dagster")) {
    warnings.push(
      "You selected python-dagster preset but didn't add the dagster service.",
    );
  }
  if (presetId.includes("temporal") && !serviceIds.includes("temporal")) {
    warnings.push(
      "You selected ts-temporal preset but didn't add the temporal service.",
    );
  }

  // Estimate additional startup time for services
  if (serviceIds.includes("supabase")) {
    estimatedStartupAdd += 90; // Supabase adds ~90s
  }
  if (serviceIds.includes("kafka")) {
    estimatedStartupAdd += 60; // Kafka adds ~60s
  }
  if (orchestrators.length > 0) {
    estimatedStartupAdd += 30; // Orchestrators add ~30s if service is included
  }

  return { conflicts, warnings, estimatedStartupAdd };
}

/**
 * Estimate resource usage and costs
 */
function estimateResources(presetId: string, serviceIds: string[]): {
  startup: string;
  cpu: string;
  memory: string;
  monthlyCost: number;
} {
  const preset = PRESETS.find((p) => p.value === presetId);
  const baseStartup = preset?.startup || "60s";
  const baseCost = preset?.cost || 5;

  const compatibility = checkCompatibility(presetId, serviceIds);

  // Parse base startup time
  let startupSeconds = 45; // default
  if (baseStartup.includes("-")) {
    const range = baseStartup.split("-").map((s) => parseInt(s));
    startupSeconds = (range[0] + range[1]) / 2;
  }

  const totalStartupSeconds = startupSeconds + compatibility.estimatedStartupAdd;
  const startupDisplay =
    totalStartupSeconds < 60
      ? `${Math.round(totalStartupSeconds)}s`
      : `${Math.round(totalStartupSeconds / 60)}min ${totalStartupSeconds % 60}s`;

  // Estimate CPU and memory
  let cpu = "2 cores";
  let memory = "4GB";
  if (serviceIds.length >= 3) {
    cpu = "4 cores";
    memory = "8GB";
  } else if (serviceIds.length >= 1) {
    cpu = "2 cores";
    memory = "8GB";
  }

  // Estimate monthly cost (very rough)
  const serviceCost = serviceIds.length * 2;
  const monthlyCost = baseCost + serviceCost;

  return {
    startup: startupDisplay,
    cpu,
    memory,
    monthlyCost,
  };
}

/**
 * Create manifest interactively using @clack/prompts
 */
export async function createManifestInteractive(
  options: CreateManifestOptions,
): Promise<void> {
  const { catalog } = options;

  p.intro(chalk.bold.blue("Create a new lesson manifest"));

  // Load available templates from examples directory
  const examplesDir = path.join(catalog.root, "examples", "lesson-manifests");
  const exampleFiles = await fs
    .readdir(examplesDir)
    .then((files) =>
      files.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    )
    .catch(() => []);

  let manifest: Partial<LessonEnv> | null = null;

  // Ask if user wants to start from template
  if (exampleFiles.length > 0) {
    const startChoice = await p.select({
      message: "How would you like to start?",
      options: [
        {
          value: "scratch",
          label: "Start from scratch",
          hint: "Build your own manifest interactively",
        },
        {
          value: "template",
          label: "Start from a template",
          hint: `Choose from ${exampleFiles.length} example(s)`,
        },
      ],
    });

    if (p.isCancel(startChoice)) {
      p.cancel("Manifest creation cancelled");
      process.exit(0);
    }

    if (startChoice === "template") {
      const templateChoice = await p.select({
        message: "Choose a template to customize",
        options: exampleFiles.map((file) => ({
          value: file,
          label: file.replace(/\.(yaml|yml)$/, ""),
          hint: file,
        })),
      });

      if (p.isCancel(templateChoice)) {
        p.cancel("Manifest creation cancelled");
        process.exit(0);
      }

      // Load the template
      const templatePath = path.join(examplesDir, templateChoice as string);
      const templateData = await loadManifest(templatePath);
      manifest = templateData as Partial<LessonEnv>;

      p.note(
        `Loaded template: ${templateChoice}\nYou can now customize the values.`,
        "Template Loaded",
      );
    }
  }

  // Course type selection (for guidance)
  const courseType = await p.select({
    message: "What type of course/lesson is this?",
    options: COURSE_TYPES.map((ct) => ({
      value: ct.value,
      label: ct.label,
      hint: ct.hint,
    })),
    initialValue: "web-frontend",
  });

  if (p.isCancel(courseType)) {
    p.cancel("Manifest creation cancelled");
    process.exit(0);
  }

  const selectedCourseType = COURSE_TYPES.find((ct) => ct.value === courseType);

  // Preset selection
  const preset = await p.select({
    message: "Select base preset",
    options: PRESETS.map((pr) => ({
      value: pr.value,
      label: pr.label,
      hint: `${pr.hint} • ~${pr.startup} startup`,
    })),
    initialValue:
      manifest?.spec?.base_preset || selectedCourseType?.recommended_preset || "node-pnpm",
  });

  if (p.isCancel(preset)) {
    p.cancel("Manifest creation cancelled");
    process.exit(0);
  }

  // Load service registry
  const registry = await loadServiceRegistry(catalog.root);
  const stableServices = filterServicesByStability(registry, {
    includeExperimental: false,
    includeDeprecated: false,
  });

  // Service selection
  const services = (await p.multiselect({
    message:
      "Add services? (space to select, enter to continue, or just press enter to skip)",
    options: stableServices
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((svc) => ({
        value: svc.id,
        label: svc.label,
        hint: svc.ports?.length
          ? `ports: ${svc.ports.join(", ")}`
          : undefined,
      })),
    required: false,
    initialValues:
      manifest?.spec?.services?.map((s: any) => s.name || s) ||
      selectedCourseType?.recommended_services ||
      [],
  })) as string[];

  if (p.isCancel(services)) {
    p.cancel("Manifest creation cancelled");
    process.exit(0);
  }

  // Validate compatibility
  const s = p.spinner();
  s.start("Validating configuration...");

  const compatibility = checkCompatibility(preset as string, services);

  if (compatibility.conflicts.length > 0) {
    s.stop(chalk.red("Configuration has conflicts:"));
    for (const conflict of compatibility.conflicts) {
      console.log(chalk.red(`  ✗ ${conflict}`));
    }

    const proceed = await p.confirm({
      message: "Continue anyway?",
      initialValue: false,
    });

    if (p.isCancel(proceed) || !proceed) {
      p.cancel("Manifest creation cancelled");
      process.exit(0);
    }
  } else if (compatibility.warnings.length > 0) {
    s.stop(chalk.yellow("Configuration has warnings:"));
    for (const warning of compatibility.warnings) {
      console.log(chalk.yellow(`  ⚠ ${warning}`));
    }
  } else {
    s.stop(chalk.green("✓ Configuration looks good!"));
  }

  // Metadata collection
  const org = await p.text({
    message: "Organization/School ID",
    placeholder: "my-university",
    defaultValue: manifest?.metadata?.org,
    validate: (value) => {
      if (!value) return "Organization is required";
      if (!/^[a-z0-9-]+$/i.test(value))
        return "Must be alphanumeric with hyphens";
    },
  });

  if (p.isCancel(org)) {
    p.cancel("Manifest creation cancelled");
    process.exit(0);
  }

  const course = await p.text({
    message: "Course ID",
    placeholder: "cs101",
    defaultValue: manifest?.metadata?.course,
    validate: (value) => {
      if (!value) return "Course ID is required";
      if (!/^[a-z0-9-]+$/i.test(value))
        return "Must be alphanumeric with hyphens";
    },
  });

  if (p.isCancel(course)) {
    p.cancel("Manifest creation cancelled");
    process.exit(0);
  }

  const lesson = await p.text({
    message: "Lesson ID",
    placeholder: "week01-intro",
    defaultValue: manifest?.metadata?.lesson,
    validate: (value) => {
      if (!value) return "Lesson ID is required";
      if (!/^[a-z0-9-]+$/i.test(value))
        return "Must be alphanumeric with hyphens";
    },
  });

  if (p.isCancel(lesson)) {
    p.cancel("Manifest creation cancelled");
    process.exit(0);
  }

  // Optional: VS Code extensions
  const addExtensions = await p.confirm({
    message: "Add VS Code extensions?",
    initialValue: false,
  });

  if (p.isCancel(addExtensions)) {
    p.cancel("Manifest creation cancelled");
    process.exit(0);
  }

  let extensions: string[] = [];
  if (addExtensions) {
    const extensionsInput = await p.text({
      message: "VS Code extension IDs (comma-separated)",
      placeholder: "dbaeumer.vscode-eslint, esbenp.prettier-vscode",
      defaultValue:
        manifest?.spec?.vscode_extensions?.join(", ") || "",
    });

    if (p.isCancel(extensionsInput)) {
      p.cancel("Manifest creation cancelled");
      process.exit(0);
    }

    extensions = (extensionsInput as string)
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
  }

  // Show resource estimates
  const estimates = estimateResources(preset as string, services);
  p.note(
    `Estimated startup: ${estimates.startup}\n` +
      `Resource usage: ${estimates.cpu}, ${estimates.memory}\n` +
      `Est. monthly cost (Codespaces): ~$${estimates.monthlyCost}/student`,
    chalk.blue("Configuration Summary"),
  );

  // Confirm
  const confirm = await p.confirm({
    message: "Generate manifest?",
    initialValue: true,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel("Manifest creation cancelled");
    process.exit(0);
  }

  // Build the manifest
  const newManifest: LessonEnv = {
    apiVersion: "airnub.devcontainers/v1",
    kind: "LessonEnv",
    metadata: {
      org: org as string,
      course: course as string,
      lesson: lesson as string,
    },
    spec: {
      base_preset: preset as string,
      image_tag_strategy: "ubuntu-24.04",
      ...(extensions.length > 0 && { vscode_extensions: extensions }),
      ...(services.length > 0 && {
        services: services.map((id) => ({ name: id })),
      }),
      emit_aggregate_compose: services.length > 0,
    },
  };

  // Validate against schema
  const validate = await loadSchema(catalog.root);
  if (!validate(newManifest)) {
    p.log.error("Generated manifest failed schema validation:");
    console.error(validate.errors);
    process.exit(1);
  }

  // Determine output path
  const defaultPath = `${org}-${course}-${lesson}.yaml`;
  const outPath = options.out || defaultPath;
  const resolvedPath = path.isAbsolute(outPath)
    ? outPath
    : path.resolve(process.cwd(), outPath);

  // Check if file exists
  if (await fs.pathExists(resolvedPath)) {
    const overwrite = await p.confirm({
      message: `File ${resolvedPath} already exists. Overwrite?`,
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel("Manifest creation cancelled");
      process.exit(0);
    }
  }

  // Write the manifest
  await fs.writeFile(resolvedPath, stringifyYaml(newManifest));

  p.outro(
    chalk.green(`✓ Manifest created: ${resolvedPath}\n\n`) +
      chalk.bold("Next steps:\n") +
      chalk.dim(`  # Generate the build context and scaffold\n`) +
      `  devc generate ${resolvedPath}\n\n` +
      chalk.dim(`  # Or scaffold directly into a directory\n`) +
      `  devc scaffold ${resolvedPath} --out ./my-lesson\n\n` +
      chalk.dim(`  # Build and push the image\n`) +
      `  devc build --ctx <generated-dir> --tag <your-tag> --push\n\n` +
      chalk.blue(`💡 Tip: `) +
      `For complete course materials, check out:\n` +
      chalk.dim(`  https://github.com/airnub-labs/devcontainers-classroom-lessons`),
  );
}
