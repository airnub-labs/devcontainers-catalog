import argparse
import json
import re
import shutil
import sys
from pathlib import Path
from typing import Dict, Iterable, Tuple

try:
    import yaml  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - fallback when PyYAML is unavailable
    yaml = None

ROOT = Path(__file__).resolve().parents[3]


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


def merge_services(services, out_dir: Path) -> Tuple[str, ...]:
    svc_out = out_dir / "services"
    ensure_dir(svc_out)

    seen = set()
    ordered = []
    for svc in services or []:
        if isinstance(svc, dict):
            name = (svc or {}).get("name", "")
        else:
            name = str(svc)
        name = (name or "").strip()
        if not name:
            continue
        src_dir = ROOT / "services" / name
        if not src_dir.exists():
            continue
        if name not in seen:
            ordered.append(name)
            seen.add(name)
        for yml in sorted(src_dir.glob("*.yml")):
            dst = svc_out / yml.name
            shutil.copy2(yml, dst)

    return tuple(ordered)


def _build_vscode_customizations(spec: dict) -> Dict[str, dict]:
    settings = dict(spec.get("settings", {}) or {})
    settings["remote.downloadExtensionsLocally"] = "always"
    extensions = _collect_extensions(spec.get("vscode_extensions", ()))
    return {
        "vscode": {
            "settings": settings,
            "extensions": list(extensions),
        }
    }


def write_generated_preset_ctx(manifest: dict, out_dir: Path) -> None:
    spec = manifest["spec"]
    ensure_dir(out_dir)

    devc = {
        "name": f"{manifest['metadata']['lesson']}",
        "build": {"dockerfile": "Dockerfile"},
        "customizations": _build_vscode_customizations(spec),
    }

    devcontainer_dir = out_dir / ".devcontainer"
    devcontainer_dir.mkdir(parents=True, exist_ok=True)
    with (devcontainer_dir / "devcontainer.json").open("w", encoding="utf-8") as handle:
        json.dump(devc, handle, indent=2)
        handle.write("\n")

    with (out_dir / "Dockerfile").open("w", encoding="utf-8") as handle:
        img_tag = spec["image_tag_strategy"]
        base = spec["base_preset"]
        handle.write(f"FROM ghcr.io/airnub-labs/templates/{base}:{img_tag}\n")

        metadata = manifest["metadata"]
        labels = {
            "org.opencontainers.image.source": "https://github.com/airnub-labs/devcontainers-catalog",
            "org.opencontainers.image.description": (
                f"Lesson image for {metadata['org']}/{metadata['course']}/{metadata['lesson']}"
            ),
            "edu.airnub.org": metadata["org"],
            "edu.airnub.course": metadata["course"],
            "edu.airnub.lesson": metadata["lesson"],
            "edu.airnub.schema": "airnub.devcontainers/v1",
        }

        items = list(labels.items())
        for index, (key, value) in enumerate(items):
            prefix = "LABEL " if index == 0 else "      "
            suffix = " \\\n" if index < len(items) - 1 else "\n"
            handle.write(f"{prefix}{key}={json.dumps(value)}{suffix}")


def write_generated_repo_scaffold(manifest: dict, out_dir: Path, slug: str) -> None:
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

    with (out_dir / ".devcontainer" / "devcontainer.json").open("w", encoding="utf-8") as handle:
        json.dump(devc, handle, indent=2)
        handle.write("\n")


def write_services_readme(selected_services: Tuple[str, ...], out_dir: Path) -> None:
    if not selected_services:
        return

    commands = {
        "redis": "Redis:   `docker compose -f services/docker-compose.redis.yml up -d`",
        "supabase": "Supabase: `cp .env.example .env && docker compose -f services/docker-compose.supabase.yml up -d`",
        "kafka": "Kafka:   `docker compose -f services/docker-compose.kafka-kraft.yml up -d`",
        "inbucket": "Inbucket: `docker compose -f services/docker-compose.inbucket.yml up -d`",
    }

    lines = ["# Lesson Services", "", "Launch as needed from this directory:"]
    added = False
    for name in selected_services:
        command = commands.get(name)
        if not command:
            continue
        lines.append(f"- {command}")
        added = True

    if not added:
        return

    lines.append("")
    (out_dir / "README.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    if not manifest_path.exists():
        print(f"[error] manifest not found: {manifest_path}", file=sys.stderr)
        return 1

    manifest = load_manifest(manifest_path)
    metadata = manifest["metadata"]
    slug = derive_lesson_slug(metadata)

    gen_preset_dir = ROOT / "images" / "presets" / "generated" / slug
    write_generated_preset_ctx(manifest, gen_preset_dir)
    selected_services = merge_services((manifest.get("spec") or {}).get("services"), gen_preset_dir)

    if "supabase" in selected_services:
        src_env = ROOT / "services" / "supabase" / ".env.example"
        dst_env = gen_preset_dir / ".env.example"
        if src_env.exists():
            shutil.copy2(src_env, dst_env)
            print(f"[hint] Supabase .env.example copied to {dst_env}")

    write_services_readme(selected_services, gen_preset_dir)
    readme_path = gen_preset_dir / "README.md"
    if readme_path.exists():
        print(f"[hint] Service README available at {readme_path}")

    gen_template_dir = ROOT / "templates" / "generated" / slug
    write_generated_repo_scaffold(manifest, gen_template_dir, slug)

    print(f"[ok] Generated preset ctx: {gen_preset_dir}")
    print(f"[ok] Generated lesson scaffold: {gen_template_dir}")
    print(f"[hint] Lesson image tag: ghcr.io/airnub-labs/templates/lessons/{slug}:{manifest['spec']['image_tag_strategy']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
