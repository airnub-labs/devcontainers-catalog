#!/usr/bin/env python3
"""Render template defaults into a materialized .devcontainer directory.

This helper performs a lightweight Mustache-style rendering for the
`{{templateOption.*}}` placeholders used in catalog templates. It supports:

- Direct substitution of `{{templateOption.<option>}}` tokens with default values.
- Conditional sections (`{{#templateOption.<option>}}...{{/templateOption.<option>}}`).
- Inverted sections (`{{^templateOption.<option>}}...{{/templateOption.<option>}}`).

Only defaults declared in `devcontainer-template.json` are considered, mirroring
how the Dev Containers CLI materializes templates when no user input is
provided.
"""

from __future__ import annotations

import json
import pathlib
import re
import sys
from typing import Any, Dict

SECTION_RE = re.compile(r"\{\{#templateOption\.([^}]+)\}\}(.*?)\{\{/templateOption.\1\}\}", re.DOTALL)
INVERTED_RE = re.compile(r"\{\{\^templateOption\.([^}]+)\}\}(.*?)\{\{/templateOption.\1\}\}", re.DOTALL)
PLACEHOLDER_RE = re.compile(r"\{\{templateOption\.([^}]+)\}\}")


def load_defaults(metadata_path: pathlib.Path) -> Dict[str, Any]:
    with metadata_path.open("r", encoding="utf-8") as handle:
        metadata = json.load(handle)

    options = metadata.get("options", {}) or {}
    defaults: Dict[str, Any] = {}
    for key, spec in options.items():
        if isinstance(spec, dict) and "default" in spec:
            defaults[key] = spec["default"]
    return defaults


def format_value(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def render_sections(text: str, pattern: re.Pattern[str], predicate) -> str:
    while True:
        def replacer(match: re.Match[str]) -> str:
            key = match.group(1)
            body = match.group(2)
            value = predicate(key)
            return body if value else ""

        new_text = pattern.sub(replacer, text)
        if new_text == text:
            break
        text = new_text
    return text


def render_text(content: str, defaults: Dict[str, Any]) -> str:
    def is_truthy(key: str) -> bool:
        value = defaults.get(key)
        return bool(value)

    rendered = render_sections(content, SECTION_RE, lambda key: is_truthy(key))
    rendered = render_sections(rendered, INVERTED_RE, lambda key: not is_truthy(key))

    def replace_placeholder(match: re.Match[str]) -> str:
        key = match.group(1)
        if key not in defaults:
            return match.group(0)
        return format_value(defaults[key])

    return PLACEHOLDER_RE.sub(replace_placeholder, rendered)


def materialize_template(metadata_path: pathlib.Path, output_dir: pathlib.Path) -> None:
    defaults = load_defaults(metadata_path)
    if not defaults:
        return

    for path in output_dir.rglob("*"):
        if not path.is_file():
            continue
        content = path.read_text(encoding="utf-8")
        rendered = render_text(content, defaults)
        path.write_text(rendered, encoding="utf-8")


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(
            "usage: render_template_defaults.py <devcontainer-template.json> <materialized-devcontainer-dir>",
            file=sys.stderr,
        )
        return 1

    metadata_path = pathlib.Path(argv[1])
    output_dir = pathlib.Path(argv[2])

    if not metadata_path.is_file():
        raise FileNotFoundError(f"Template metadata not found: {metadata_path}")
    if not output_dir.is_dir():
        raise NotADirectoryError(f"Materialized directory not found: {output_dir}")

    materialize_template(metadata_path, output_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
