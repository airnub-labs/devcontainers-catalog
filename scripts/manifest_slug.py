#!/usr/bin/env python3
"""Print slug for a lesson manifest."""

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml


def slugify(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.lower().strip())
    return value.strip("-") or "lesson"


def main(path: str) -> int:
    manifest_path = Path(path)
    manifest = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
    metadata = manifest["metadata"]
    slug = "-".join(slugify(str(metadata[key])) for key in ("org", "course", "lesson") if metadata.get(key))
    print(slug)
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: manifest_slug.py <manifest>")
    sys.exit(main(sys.argv[1]))
