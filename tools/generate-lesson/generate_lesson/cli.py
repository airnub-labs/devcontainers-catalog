import argparse
import json
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Mapping, Optional, Sequence, Tuple

try:
    import yaml  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - fallback when PyYAML is unavailable
    yaml = None

ROOT = Path(__file__).resolve().parents[3]


SERVICE_INSTRUCTIONS: Mapping[str, Sequence[str]] = {
    "redis": ("Redis — `docker compose -f services/redis/docker-compose.redis.yml up -d`",),
    "supabase": (
        "Supabase — `docker compose -f services/supabase/docker-compose.supabase.yml up -d`",
        "Copy `.env.example-supabase` to `.env` before launching Supabase.",
    ),
    "kafka": (
        "Kafka — `docker compose -f services/kafka/docker-compose.kafka-kraft.yml up -d`",
        "Optional utils: `docker compose -f services/kafka/docker-compose.kafka-utils.yml up -d`",
    ),
    "inbucket": (
        "Inbucket — `docker compose -f services/inbucket/docker-compose.inbucket.yml up -d`",
    ),
    "prefect": (
        "Prefect — `docker compose -f services/prefect/docker-compose.prefect.yml up -d`",
        "Review `.env.example-prefect` for optional overrides before launching.",
    ),
    "airflow": (
        "Airflow — `docker compose -f services/airflow/docker-compose.airflow.yml up -d`",
        "Set admin credentials in `.env.example-airflow` and copy to `.env` if needed.",
    ),
    "dagster": (
        "Dagster — `docker compose -f services/dagster/docker-compose.dagster.yml up -d`",
        "Copy `.env.example-dagster` to `.env` if your pipelines depend on environment variables.",
        "Update `services/dagster/example_dagster_repo` with your own project before class.",
    ),
    "temporal": (
        "Temporal — `docker compose -f services/temporal/docker-compose.temporal.yml up -d`",
        "Adjust `.env.example-temporal` for custom CORS origins before launching the UI.",
    ),
}


SERVICE_PORT_LABELS: Mapping[str, Mapping[int, str]] = {
    "redis": {6379: "Redis"},
    "supabase": {
        54322: "Supabase Postgres",
        54323: "Supabase REST",
        54324: "Supabase Realtime",
        54326: "Supabase Studio",
    },
    "kafka": {9092: "Kafka Broker"},
    "inbucket": {9000: "Inbucket UI", 2500: "Inbucket SMTP"},
    "prefect": {4200: "Prefect UI"},
    "airflow": {8080: "Airflow UI"},
    "dagster": {3000: "Dagster UI"},
    "temporal": {7233: "Temporal gRPC", 8080: "Temporal UI"},
}


SERVICE_EXTENDS: Mapping[str, Sequence[Tuple[str, str]]] = {
    "redis": (("docker-compose.redis.yml", "redis"),),
    "supabase": (
        ("docker-compose.supabase.yml", "supabase-db"),
        ("docker-compose.supabase.yml", "supabase-rest"),
        ("docker-compose.supabase.yml", "supabase-realtime"),
        ("docker-compose.supabase.yml", "supabase-studio"),
    ),
    "kafka": (
        ("docker-compose.kafka-kraft.yml", "kafka"),
        ("docker-compose.kafka-utils.yml", "kafka-producer"),
        ("docker-compose.kafka-utils.yml", "kafka-consumer"),
    ),
    "inbucket": (("docker-compose.inbucket.yml", "inbucket"),),
    "prefect": (("docker-compose.prefect.yml", "prefect"),),
    "airflow": (
        ("docker-compose.airflow.yml", "airflow-db"),
        ("docker-compose.airflow.yml", "airflow-init"),
        ("docker-compose.airflow.yml", "airflow-webserver"),
        ("docker-compose.airflow.yml", "airflow-scheduler"),
    ),
    "dagster": (
        ("docker-compose.dagster.yml", "dagster-postgres"),
        ("docker-compose.dagster.yml", "dagster-webserver"),
        ("docker-compose.dagster.yml", "dagster-daemon"),
    ),
    "temporal": (
        ("docker-compose.temporal.yml", "temporal-db"),
        ("docker-compose.temporal.yml", "temporal"),
        ("docker-compose.temporal.yml", "temporal-ui"),
    ),
}


SERVICE_VOLUMES: Mapping[str, Sequence[str]] = {
    "airflow": ("airflow-db-data", "airflow-dags", "airflow-logs"),
    "dagster": ("dagster-db-data", "dagster-home"),
    "temporal": ("temporal-db-data",),
}


SERVICES_REQUIRE_CLASSROOM_NETWORK = {"prefect", "airflow", "dagster", "temporal"}


SUPPORTED_SPEC_FIELDS = {
    "base_preset",
    "image_tag_strategy",
    "vscode_extensions",
    "settings",
    "features",
    "services",
    "emit_aggregate_compose",
    "env",
    "starter_repo",
    "secrets_placeholders",
    "resources",
}


UNIMPLEMENTED_SPEC_FIELDS: set = set()


@dataclass(frozen=True)
class ServiceArtifacts:
    names: Tuple[str, ...]
    fragments: Dict[str, Tuple[Path, ...]]
    env_examples: Dict[str, Path]
    vars: Dict[str, Dict[str, str]]
    missing: Tuple[str, ...]


def _slugify_component(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower().strip())
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "lesson"


def derive_lesson_slug(metadata: Dict[str, str]) -> str:
    parts = (_slugify_component(str(metadata[key])) for key in ("org", "course", "lesson"))
    return "-".join(part for part in parts if part)


def _collect_extensions(raw_extensions: Iterable[str]) -> Tuple[str, ...]:
    seen = set()
    ordered = []
    for ext in raw_extensions or []:
        lowered = str(ext).lower()
        if lowered and lowered not in seen:
            ordered.append(lowered)
            seen.add(lowered)
    return tuple(ordered)


def _parse_scalar(value: str):
    value = value.strip()
    if value.startswith('"') and value.endswith('"'):
        return value[1:-1]
    if value.startswith("'") and value.endswith("'"):
        return value[1:-1]
    lowered = value.lower()
    if lowered in {"true", "false"}:
        return lowered == "true"
    try:
        return int(value)
    except ValueError:
        pass
    try:
        return float(value)
    except ValueError:
        pass
    return value


def _parse_block(lines, index, current_indent):
    result_dict = {}
    result_list = None
    length = len(lines)
    while index < length:
        indent, content = lines[index]
        if indent < current_indent:
            break
        if indent > current_indent:
            raise ValueError(f"Invalid indentation at line: {content}")
        if content.startswith('- '):
            if result_dict:
                raise ValueError("Cannot mix mapping and list entries")
            if result_list is None:
                result_list = []
            item = content[2:].strip()
            if not item:
                value, index = _parse_block(lines, index + 1, current_indent + 2)
                result_list.append(value)
                continue
            if item.endswith(':'):
                key = item[:-1].strip()
                value, index = _parse_block(lines, index + 1, current_indent + 2)
                result_list.append({key: value})
                continue
            if ': ' in item:
                key, value = item.split(':', 1)
                result_list.append({key.strip(): _parse_scalar(value)})
                index += 1
                continue
            result_list.append(_parse_scalar(item))
            index += 1
            continue
        if ':' in content:
            key, remainder = content.split(':', 1)
            key = key.strip()
            remainder = remainder.strip()
            if remainder:
                result_dict[key] = _parse_scalar(remainder)
                index += 1
                continue
            value, index = _parse_block(lines, index + 1, current_indent + 2)
            result_dict[key] = value
            continue
        raise ValueError(f"Unsupported YAML line: {content}")
    if result_list is not None:
        return result_list, index
    return result_dict, index


def parse_simple_yaml(text: str):
    lines = []
    for raw in text.splitlines():
        if not raw.strip() or raw.lstrip().startswith('#'):
            continue
        indent = len(raw) - len(raw.lstrip(' '))
        lines.append((indent, raw.strip()))
    value, index = _parse_block(lines, 0, 0)
    if index != len(lines):
        raise ValueError("Unexpected trailing content in manifest")
    return value


def load_manifest(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if yaml is not None:
        return yaml.safe_load(text)
    return parse_simple_yaml(text)


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _normalize_service_vars(raw_vars) -> Dict[str, str]:
    normalized: Dict[str, str] = {}
    if not isinstance(raw_vars, Mapping):
        return normalized
    for key, value in raw_vars.items():
        key_str = str(key).strip()
        if not key_str:
            continue
        normalized[key_str] = str(value)
    return normalized


def merge_services(services, out_dir: Path) -> ServiceArtifacts:
    svc_root = out_dir / "services"
    ensure_dir(svc_root)

    ordered: List[str] = []
    fragments: Dict[str, Tuple[Path, ...]] = {}
    env_examples: Dict[str, Path] = {}
    service_vars: Dict[str, Dict[str, str]] = {}
    missing: List[str] = []

    for svc in services or []:
        if isinstance(svc, dict):
            name = str((svc or {}).get("name", "")).strip()
            vars_payload = _normalize_service_vars((svc or {}).get("vars"))
        else:
            name = str(svc or "").strip()
            vars_payload = {}
        if not name:
            continue
        src_dir = ROOT / "services" / name
        if not src_dir.exists():
            if name not in missing:
                missing.append(name)
            continue

        if name not in ordered:
            ordered.append(name)

        dest_dir = svc_root / name
        ensure_dir(dest_dir)

        fragment_paths: List[Path] = []
        for item in sorted(src_dir.iterdir()):
            if item.name == ".env.example":
                continue
            if item.is_dir():
                shutil.copytree(item, dest_dir / item.name, dirs_exist_ok=True)
                continue
            if item.suffix == ".yml":
                dst = dest_dir / item.name
                shutil.copy2(item, dst)
                fragment_paths.append(dst)
            else:
                shutil.copy2(item, dest_dir / item.name)

        if not fragment_paths:
            fragment_paths = list(sorted(dest_dir.glob("*.yml")))
        fragments[name] = tuple(fragment_paths)

        env_src = src_dir / ".env.example"
        if env_src.exists():
            dst = out_dir / f".env.example-{name}"
            shutil.copy2(env_src, dst)
            env_examples[name] = dst

        if vars_payload:
            service_vars[name] = vars_payload

    return ServiceArtifacts(tuple(ordered), fragments, env_examples, service_vars, tuple(missing))


def _build_vscode_customizations(spec: dict) -> Dict[str, dict]:
    settings = dict(spec.get("settings", {}) or {})
    settings["remote.downloadExtensionsLocally"] = "always"
    settings.setdefault("telemetry.telemetryLevel", "off")
    extensions = _collect_extensions(spec.get("vscode_extensions", ()))
    return {
        "vscode": {
            "settings": settings,
            "extensions": list(extensions),
        }
    }


def _coerce_string_map(raw_mapping) -> Dict[str, str]:
    if not isinstance(raw_mapping, Mapping):
        return {}
    coerced: Dict[str, str] = {}
    for key, value in raw_mapping.items():
        key_str = str(key).strip()
        if not key_str:
            continue
        coerced[key_str] = str(value)
    return coerced


def _collect_secrets_placeholders(spec: dict) -> Tuple[str, ...]:
    raw = spec.get("secrets_placeholders")
    if not isinstance(raw, Iterable):
        return tuple()
    collected: List[str] = []
    seen = set()
    for entry in raw:
        candidate = str(entry or "").strip()
        if not candidate or candidate in seen:
            continue
        collected.append(candidate)
        seen.add(candidate)
    return tuple(collected)


def _apply_optional_devcontainer_overrides(devc: Dict[str, object], spec: dict) -> None:
    features = spec.get("features")
    if isinstance(features, Mapping) and features:
        devc["features"] = json.loads(json.dumps(features))
    env_map = _coerce_string_map(spec.get("env"))
    if env_map:
        devc["containerEnv"] = env_map
    resources = spec.get("resources")
    if isinstance(resources, Mapping) and resources:
        host_requirements: Dict[str, object] = {}
        cpu_value = resources.get("cpu")
        if cpu_value is not None:
            try:
                cpu_float = float(str(cpu_value).strip())
            except ValueError:
                host_requirements["cpus"] = str(cpu_value)
            else:
                if cpu_float.is_integer():
                    host_requirements["cpus"] = int(cpu_float)
                else:
                    host_requirements["cpus"] = cpu_float
        memory_value = resources.get("memory")
        if memory_value is not None:
            host_requirements["memory"] = str(memory_value)
        if host_requirements:
            devc["hostRequirements"] = host_requirements


def partition_spec_fields(spec: Mapping[str, object]) -> Tuple[Tuple[str, ...], Tuple[str, ...]]:
    unsupported = tuple(sorted(field for field in UNIMPLEMENTED_SPEC_FIELDS if field in spec))
    unknown = tuple(
        sorted(
            field
            for field in spec
            if field not in SUPPORTED_SPEC_FIELDS and field not in UNIMPLEMENTED_SPEC_FIELDS
        )
    )
    return unsupported, unknown


def generate_aggregate_compose(
    manifest: dict,
    out_dir: Path,
    artifacts: ServiceArtifacts,
) -> Optional[Path]:
    spec = manifest.get("spec", {})
    if not spec.get("emit_aggregate_compose", True):
        return None
    if not artifacts.names:
        return None

    services_block: Dict[str, Dict[str, Dict[str, str]]] = {}
    volumes: List[str] = []
    needs_classroom = False

    for manifest_service in artifacts.names:
        extends_entries = SERVICE_EXTENDS.get(manifest_service, ())
        if not extends_entries:
            continue
        for file_name, service_name in extends_entries:
            compose_file = f"./services/{manifest_service}/{file_name}"
            services_block[service_name] = {
                "extends": {"file": compose_file, "service": service_name}
            }
        for volume in SERVICE_VOLUMES.get(manifest_service, ()): 
            if volume not in volumes:
                volumes.append(volume)
        if manifest_service in SERVICES_REQUIRE_CLASSROOM_NETWORK:
            needs_classroom = True

    if not services_block:
        return None

    target = out_dir / "docker-compose.classroom.yml"
    with target.open("w", encoding="utf-8") as handle:
        handle.write(
            "# Auto-generated by tools/generate-lesson from selected service fragments.\n"
        )
        handle.write("# You can run:\n")
        handle.write("#   docker compose -f docker-compose.classroom.yml up -d\n\n")
        handle.write('version: "3.9"\n')
        handle.write("services:\n")
        for service_name in sorted(services_block):
            extends = services_block[service_name]["extends"]
            handle.write(f"  {service_name}:\n")
            handle.write("    extends:\n")
            handle.write(f"      file: {extends['file']}\n")
            handle.write(f"      service: {extends['service']}\n")
            parent_service = extends["file"].split("/")[2]
            overrides = artifacts.vars.get(parent_service, {})
            if overrides:
                handle.write("    environment:\n")
                for key in sorted(overrides):
                    value = overrides[key]
                    handle.write(f"      {key}: {json.dumps(value)}\n")

        if volumes:
            handle.write("\nvolumes:\n")
            for volume in volumes:
                handle.write(f"  {volume}:\n")

        if needs_classroom:
            handle.write("\nnetworks:\n")
            handle.write("  classroom: { name: classroom }\n")

    return target


def collect_ports_attributes(artifacts: ServiceArtifacts) -> Dict[str, Dict[str, str]]:
    if not artifacts.names:
        return {}
    collected: Dict[str, set] = {}
    for name in artifacts.names:
        port_map = SERVICE_PORT_LABELS.get(name, {})
        for port, label in port_map.items():
            port_key = str(port)
            collected.setdefault(port_key, set()).add(label)
    attributes: Dict[str, Dict[str, str]] = {}
    for port in sorted(collected, key=lambda value: int(re.sub(r"[^0-9]", "", value) or 0)):
        labels = sorted(collected[port])
        attributes[port] = {"label": " / ".join(labels)}
    return attributes


def write_generated_preset_ctx(manifest: dict, out_dir: Path) -> None:
    spec = manifest["spec"]
    ensure_dir(out_dir)

    devc = {
        "name": f"{manifest['metadata']['lesson']}",
        "build": {"dockerfile": "Dockerfile"},
        "customizations": _build_vscode_customizations(spec),
    }
    _apply_optional_devcontainer_overrides(devc, spec)

    devcontainer_dir = out_dir / ".devcontainer"
    devcontainer_dir.mkdir(parents=True, exist_ok=True)
    with (devcontainer_dir / "devcontainer.json").open("w", encoding="utf-8") as handle:
        json.dump(devc, handle, indent=2)
        handle.write("\n")

    with (out_dir / "Dockerfile").open("w", encoding="utf-8") as handle:
        img_tag = spec["image_tag_strategy"]
        base = spec["base_preset"]
        handle.write("# syntax=docker/dockerfile:1.7\n")
        handle.write('ARG GIT_SHA="dev"\n')
        handle.write(f"FROM ghcr.io/airnub-labs/templates/{base}:{img_tag}\n")
        handle.write("ARG GIT_SHA\n")

        metadata = manifest["metadata"]
        labels = {
            "org.opencontainers.image.source": "https://github.com/airnub-labs/devcontainers-catalog",
            "org.opencontainers.image.description": (
                f"Lesson image for {metadata['org']}/{metadata['course']}/{metadata['lesson']}"
            ),
            "org.opencontainers.image.revision": "${GIT_SHA}",
            "org.airnub.lesson.org": metadata["org"],
            "org.airnub.lesson.course": metadata["course"],
            "org.airnub.lesson.lesson": metadata["lesson"],
            "org.airnub.lesson.schema": "airnub.devcontainers/v1",
        }

        items = list(labels.items())
        for index, (key, value) in enumerate(items):
            prefix = "LABEL " if index == 0 else "      "
            suffix = " \\\n" if index < len(items) - 1 else "\n"
            handle.write(f"{prefix}{key}={json.dumps(value)}{suffix}")


def write_generated_repo_scaffold(
    manifest: dict,
    out_dir: Path,
    slug: str,
    ports_attributes: Optional[Dict[str, Dict[str, str]]],
) -> None:
    spec = manifest["spec"]
    ensure_dir(out_dir / ".devcontainer")

    image_tag = spec["image_tag_strategy"]
    image_ref = f"ghcr.io/airnub-labs/templates/lessons/{slug}:{image_tag}"
    devc = {
        "name": f"{manifest['metadata']['lesson']}",
        "image": image_ref,
        "workspaceFolder": "/work",
        "customizations": _build_vscode_customizations(spec),
    }
    _apply_optional_devcontainer_overrides(devc, spec)

    if ports_attributes:
        devc["portsAttributes"] = ports_attributes

    with (out_dir / ".devcontainer" / "devcontainer.json").open("w", encoding="utf-8") as handle:
        json.dump(devc, handle, indent=2)
        handle.write("\n")


def write_secrets_placeholders(spec: dict, out_dir: Path) -> Optional[Path]:
    placeholders = _collect_secrets_placeholders(spec)
    if not placeholders:
        return None
    ensure_dir(out_dir)
    target = out_dir / "secrets.placeholders.env"
    lines = [
        "# Populate these secrets via Codespaces secrets, the Dev Containers secret store,",
        "# or a local .env file before launching classroom services.",
        "",
    ]
    lines.extend(f"{name}=" for name in placeholders)
    target.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")
    return target


def _relative_path(base: Path, target: Path) -> str:
    try:
        return str(target.relative_to(base))
    except ValueError:
        return str(target)


def write_generation_summary(
    manifest: dict,
    slug: str,
    out_dir: Path,
    artifacts: ServiceArtifacts,
    secrets_file: Optional[Path],
    services_readme: Optional[Path],
) -> Path:
    spec = manifest.get("spec", {})
    metadata = manifest.get("metadata", {})
    placeholders = _collect_secrets_placeholders(spec)
    resources_payload = spec.get("resources")
    resources = resources_payload if isinstance(resources_payload, Mapping) else None

    lines: List[str] = ["# Lesson Generation Summary", ""]
    lines.append(
        f"- Lesson: `{metadata.get('org', 'unknown')}` / `{metadata.get('course', 'unknown')}` / `{metadata.get('lesson', 'unknown')}`"
    )
    lines.append(f"- Slug: `{slug}`")
    lines.append("")

    if placeholders:
        lines.append("## Secrets to Provide")
        lines.append(
            "Configure the following secrets via GitHub Codespaces secrets, the Dev Containers secret store, or a `.env` file before class:"
        )
        lines.append("")
        for placeholder in placeholders:
            lines.append(f"- `{placeholder}`")
        if secrets_file:
            lines.append("")
            lines.append(
                f"A starter file is available at `{_relative_path(out_dir, secrets_file)}` (copy to `.env` and fill values)."
            )
        lines.append("")

    if artifacts.env_examples:
        lines.append("## Service Environment Files")
        lines.append(
            "Copy each `.env.example-*` file to `.env` and update credentials before launching `docker compose`."
        )
        lines.append("")
        for service, env_path in sorted(artifacts.env_examples.items()):
            lines.append(
                f"- `{service}` → `{_relative_path(out_dir, env_path)}`"
            )
        lines.append("")

    if services_readme:
        lines.append("## Classroom Services")
        lines.append(
            f"Review `{_relative_path(out_dir, services_readme)}` for launch commands and orchestration notes."
        )
        lines.append("")

    if artifacts.missing:
        lines.append("## Missing Service Fragments")
        lines.append(
            "The manifest referenced services that were not found in the catalog. Update the manifest or add the fragments before regenerating."
        )
        lines.append("")
        for missing in artifacts.missing:
            lines.append(f"- `{missing}`")
        lines.append("")

    if resources:
        cpu_hint = resources.get("cpu")
        mem_hint = resources.get("memory")
        lines.append("## Resource Guidance")
        lines.append("Suggested Codespaces machine or host requirements:")
        lines.append("")
        if cpu_hint is not None:
            lines.append(f"- CPU: `{cpu_hint}`")
        if mem_hint is not None:
            lines.append(f"- Memory: `{mem_hint}`")
        lines.append("")

    lines.append("## Next Steps")
    lines.append("- Build the lesson image and publish it so students pull the pinned tag before class.")
    lines.append("- Share the generated `.devcontainer` scaffold with students or commit it to a starter repo.")

    target = out_dir / "GENERATION_SUMMARY.md"
    target.write_text("\n".join(line for line in lines if line is not None).strip() + "\n", encoding="utf-8")
    return target


def write_starter_repo_metadata(spec: dict, out_dir: Path) -> Optional[Path]:
    starter_repo = spec.get("starter_repo")
    if not isinstance(starter_repo, Mapping):
        return None
    url = str(starter_repo.get("url", "")).strip()
    if not url:
        return None
    path_value = str(starter_repo.get("path", "/workspace")).strip() or "/workspace"
    payload = {"url": url, "path": path_value}
    target = out_dir / "starter-repo.json"
    with target.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")
    return target


def load_yaml_document(path: Path):
    text = path.read_text(encoding="utf-8")
    if yaml is not None:
        return yaml.safe_load(text)
    return parse_simple_yaml(text)


def _split_image_reference(reference: str) -> Tuple[str, Optional[str], Optional[str]]:
    raw = reference.strip()
    digest: Optional[str] = None
    if "@" in raw:
        raw, digest = raw.split("@", 1)
    last_slash = raw.rfind("/")
    last_colon = raw.rfind(":")
    tag: Optional[str] = None
    if last_colon > last_slash:
        tag = raw[last_colon + 1 :]
        image = raw[:last_colon]
    else:
        image = raw
    return image, tag, digest


def _collect_service_images(artifacts: ServiceArtifacts) -> Dict[str, str]:
    images: Dict[str, str] = {}
    for service in artifacts.names:
        extends_entries = SERVICE_EXTENDS.get(service, ())
        for file_name, service_name in extends_entries:
            compose_path = ROOT / "services" / service / file_name
            if not compose_path.exists():
                continue
            try:
                document = load_yaml_document(compose_path)
            except Exception:
                continue
            service_block = (
                (document or {}).get("services", {}) if isinstance(document, Mapping) else {}
            )
            if not isinstance(service_block, Mapping):
                continue
            entry = service_block.get(service_name)
            if not isinstance(entry, Mapping):
                continue
            image_ref = entry.get("image")
            if not image_ref:
                continue
            images[f"{service}:{service_name}"] = str(image_ref)
    return images


def write_stack_lock(
    manifest: dict,
    out_dir: Path,
    artifacts: ServiceArtifacts,
) -> Optional[Path]:
    spec = manifest.get("spec", {})
    base = spec.get("base_preset")
    tag = spec.get("image_tag_strategy")
    if not base or not tag:
        return None
    lesson_ref = f"ghcr.io/airnub-labs/templates/lessons/{derive_lesson_slug(manifest['metadata'])}:{tag}"
    entries: Dict[str, Dict[str, Optional[str]]] = {}
    image, parsed_tag, digest = _split_image_reference(
        f"ghcr.io/airnub-labs/templates/{base}:{tag}"
    )
    entries["lesson-base"] = {"image": image, "tag": parsed_tag, "digest": digest or ""}
    service_images = _collect_service_images(artifacts)
    for key, reference in sorted(service_images.items()):
        image, parsed_tag, digest = _split_image_reference(reference)
        entries[key] = {"image": image, "tag": parsed_tag, "digest": digest or ""}
    runtime_image, runtime_tag = lesson_ref.split(":", 1)
    entries["lesson-runtime"] = {
        "image": runtime_image,
        "tag": runtime_tag,
        "digest": "",
    }
    target = out_dir / "stack.lock.json"
    payload = {
        "_comment": "Populate digest fields after building and publishing images to guarantee reproducible rebuilds.",
        "images": entries,
    }
    with target.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")
    return target


def write_services_readme(artifacts: ServiceArtifacts, out_dir: Path) -> Optional[Path]:
    if not artifacts.names:
        return None

    lines = [
        "## Classroom Services",
        "",
        "Start everything:",
        "  docker compose -f docker-compose.classroom.yml up -d",
        "",
        "Stop:",
        "  docker compose -f docker-compose.classroom.yml down",
    ]

    wrote_instruction = False
    for name in artifacts.names:
        instructions = SERVICE_INSTRUCTIONS.get(name)
        if not instructions:
            continue
        wrote_instruction = True
        lines.append("")
        for index, entry in enumerate(instructions):
            prefix = "- " if index == 0 else "  "
            lines.append(f"{prefix}{entry}")

    if not wrote_instruction:
        return None

    lines.append("")
    readme_path = out_dir / "README-SERVICES.md"
    readme_path.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")
    return readme_path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    if not manifest_path.exists():
        print(f"[error] manifest not found: {manifest_path}", file=sys.stderr)
        return 1

    manifest = load_manifest(manifest_path)
    spec = manifest.get("spec") or {}
    unsupported_fields, unknown_fields = partition_spec_fields(spec)
    for field in unsupported_fields:
        print(
            f"[warn] spec.{field} is currently ignored by the generator; downstream automation should handle it.",
            file=sys.stderr,
        )
    for field in unknown_fields:
        print(
            f"[warn] spec.{field} is not recognized and will be ignored.",
            file=sys.stderr,
        )

    metadata = manifest["metadata"]
    slug = derive_lesson_slug(metadata)

    gen_preset_dir = ROOT / "images" / "presets" / "generated" / slug
    write_generated_preset_ctx(manifest, gen_preset_dir)
    secrets_placeholder_path = write_secrets_placeholders(spec, gen_preset_dir)
    artifacts = merge_services(spec.get("services"), gen_preset_dir)

    for missing in artifacts.missing:
        print(
            f"[warn] spec.services requested '{missing}', but no matching fragment exists under services/{missing}",
            file=sys.stderr,
        )

    for name, env_path in sorted(artifacts.env_examples.items()):
        print(f"[hint] Copied {name} .env example to {env_path}")

    stack_lock_path = write_stack_lock(manifest, gen_preset_dir, artifacts)
    if stack_lock_path:
        print(f"[hint] Stack lock template available at {stack_lock_path}")

    starter_meta = write_starter_repo_metadata(spec, gen_preset_dir)
    if starter_meta:
        print(f"[hint] Starter repo metadata recorded at {starter_meta}")

    if secrets_placeholder_path:
        print(f"[hint] Secrets placeholders recorded at {secrets_placeholder_path}")

    aggregate_path: Optional[Path] = None
    try:
        aggregate_path = generate_aggregate_compose(manifest, gen_preset_dir, artifacts)
    except ValueError as exc:
        print(f"[error] {exc}", file=sys.stderr)
        return 1

    if aggregate_path:
        print(f"[hint] Aggregate compose available at {aggregate_path}")

    services_readme = write_services_readme(artifacts, gen_preset_dir)
    if services_readme:
        print(f"[hint] Service README available at {services_readme}")

    summary_path = write_generation_summary(
        manifest,
        slug,
        gen_preset_dir,
        artifacts,
        secrets_placeholder_path,
        services_readme,
    )
    print(f"[hint] Generation summary available at {summary_path}")

    ports_attributes = collect_ports_attributes(artifacts)

    gen_template_dir = ROOT / "templates" / "generated" / slug
    write_generated_repo_scaffold(manifest, gen_template_dir, slug, ports_attributes)
    template_secrets = write_secrets_placeholders(spec, gen_template_dir)
    if template_secrets:
        print(f"[hint] Secrets placeholders recorded at {template_secrets}")

    if stack_lock_path:
        copied_stack_lock = gen_template_dir / "stack.lock.json"
        shutil.copy2(stack_lock_path, copied_stack_lock)
        print(f"[hint] Copied stack lock to {copied_stack_lock}")

    starter_template_meta = write_starter_repo_metadata(spec, gen_template_dir)
    if starter_template_meta:
        print(f"[hint] Starter repo metadata recorded at {starter_template_meta}")

    print(f"[ok] Generated preset ctx: {gen_preset_dir}")
    print(f"[ok] Generated lesson scaffold: {gen_template_dir}")
    print(f"[hint] Lesson image tag: ghcr.io/airnub-labs/templates/lessons/{slug}:{manifest['spec']['image_tag_strategy']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
