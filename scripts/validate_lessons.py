#!/usr/bin/env python3
"""Validate lesson and agent intent schemas against examples."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Iterable

try:
    import yaml
except ImportError as exc:  # pragma: no cover - dependency missing is fatal
    raise SystemExit("pyyaml is required to run validation") from exc

try:
    from jsonschema import Draft202012Validator
except ImportError as exc:  # pragma: no cover
    raise SystemExit("jsonschema is required to run validation") from exc

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = ROOT / "schemas"
EXAMPLES = ROOT / "examples"

LESSON_SCHEMA_PATH = SCHEMAS / "lesson-env.schema.json"
AGENT_SCHEMA_PATH = SCHEMAS / "agent-intents.schema.json"


def _load_yaml(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def validate_manifest(manifest_path: Path, validator: Draft202012Validator) -> list[str]:
    errors: list[str] = []
    data = _load_yaml(manifest_path)
    for error in validator.iter_errors(data):
        errors.append(f"{manifest_path.relative_to(ROOT)}: {error.message}")
    return errors


def validate_manifests(paths: Iterable[Path]) -> list[str]:
    schema = json.loads(LESSON_SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema)

    errors: list[str] = []
    for manifest_path in sorted(paths):
        errors.extend(validate_manifest(manifest_path, validator))
    return errors


def validate_agent_intents(paths: Iterable[Path]) -> list[str]:
    if not AGENT_SCHEMA_PATH.exists():
        return []

    schema = json.loads(AGENT_SCHEMA_PATH.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    validator = Draft202012Validator(schema)

    errors: list[str] = []
    for intent_path in sorted(paths):
        if intent_path.suffix in {".yaml", ".yml"}:
            data = _load_yaml(intent_path)
        else:
            data = json.loads(intent_path.read_text(encoding="utf-8"))
        for error in validator.iter_errors(data):
            errors.append(f"{intent_path.relative_to(ROOT)}: {error.message}")
    return errors


def main() -> int:
    manifests_dir = EXAMPLES / "lesson-manifests"
    manifest_paths = list(manifests_dir.glob("*.y*ml"))
    intent_dir = EXAMPLES / "agent-intents"
    intent_paths = list(intent_dir.glob("*.y*ml")) + list(intent_dir.glob("*.json"))

    errors = []
    errors.extend(validate_manifests(manifest_paths))
    errors.extend(validate_agent_intents(intent_paths))

    if errors:
        for err in errors:
            print(err)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
