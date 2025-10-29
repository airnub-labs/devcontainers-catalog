import argparse
import json
import shutil
import sys
from pathlib import Path

try:
    import yaml  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - fallback when PyYAML is unavailable
    yaml = None

ROOT = Path(__file__).resolve().parents[3]


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


def merge_services(services, out_dir: Path) -> None:
    svc_out = out_dir / "services"
    ensure_dir(svc_out)
    for svc in services or []:
        name = (svc or {}).get("name") if isinstance(svc, dict) else str(svc)
        if not name:
            continue
        src_dir = ROOT / "services" / name
        if not src_dir.exists():
            continue
        for yml in src_dir.glob("*.yml"):
            dst = svc_out / yml.name
            shutil.copy2(yml, dst)


def write_generated_preset_ctx(manifest: dict, out_dir: Path) -> None:
    spec = manifest["spec"]
    ensure_dir(out_dir)

    devc = {
        "name": f"{manifest['metadata']['lesson']}",
        "build": {"dockerfile": "Dockerfile"},
        "customizations": {
            "vscode": {
                "settings": spec.get("settings", {}),
                "extensions": [ext.lower() for ext in spec.get("vscode_extensions", [])],
            }
        },
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


def write_generated_repo_scaffold(manifest: dict, out_dir: Path) -> None:
    spec = manifest["spec"]
    ensure_dir(out_dir / ".devcontainer")

    image_ref = f"ghcr.io/airnub-labs/templates/{spec['base_preset']}:{spec['image_tag_strategy']}"
    devc = {
        "name": f"{manifest['metadata']['lesson']}",
        "image": image_ref,
        "workspaceFolder": "/work",
        "customizations": {
            "vscode": {
                "settings": spec.get("settings", {}),
                "extensions": [ext.lower() for ext in spec.get("vscode_extensions", [])],
            }
        },
    }

    with (out_dir / ".devcontainer" / "devcontainer.json").open("w", encoding="utf-8") as handle:
        json.dump(devc, handle, indent=2)
        handle.write("\n")


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
    org = metadata["org"]
    course = metadata["course"]
    lesson = metadata["lesson"]

    gen_preset_dir = ROOT / "images" / "presets" / "generated" / org / course / lesson
    write_generated_preset_ctx(manifest, gen_preset_dir)
    merge_services((manifest.get("spec") or {}).get("services"), gen_preset_dir)

    gen_template_dir = ROOT / "templates" / "generated" / org / course / lesson
    write_generated_repo_scaffold(manifest, gen_template_dir)

    print(f"[ok] Generated preset ctx: {gen_preset_dir}")
    print(f"[ok] Generated lesson scaffold: {gen_template_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
