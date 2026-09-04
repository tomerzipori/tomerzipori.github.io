#!/usr/bin/env python3
"""Validate public content and write a local, untracked content index."""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_PATHS = {
    "evidence-and-belief",
    "models-and-meaning",
    "data-and-strange-claims",
    "tools-for-thinking",
}
STATUSES = {"finished", "nearly-finished", "draft"}


def parse_front_matter(path: Path) -> dict[str, object]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError("missing YAML front matter")
    end = text.find("\n---", 4)
    if end < 0:
        raise ValueError("unterminated YAML front matter")
    block = text[4:end]
    values: dict[str, object] = {}
    current_list: str | None = None
    for raw in block.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("- ") and current_list:
            values.setdefault(current_list, []).append(line[2:].strip().strip('"\''))
            continue
        match = re.match(r"^([A-Za-z][A-Za-z0-9_-]*):(?:\s+(.*))?$", line)
        if not match:
            continue
        key, value = match.groups()
        if value is None:
            values[key] = []
            current_list = key
            continue
        current_list = None
        value = value.strip().strip('"\'')
        if value.lower() in {"true", "false"}:
            values[key] = value.lower() == "true"
        else:
            values[key] = value
    return values


def collect() -> list[dict[str, object]]:
    records = []
    for collection in ("posts", "notes", "experiments"):
        for path in sorted((ROOT / collection).glob("*/index.qmd")):
            meta = parse_front_matter(path)
            status = meta.get("status")
            paths = meta.get("paths", [])
            if isinstance(paths, str):
                paths = [paths]
            records.append(
                {
                    "kind": collection[:-1],
                    "slug": path.parent.name,
                    "url": f"/{collection}/{path.parent.name}/",
                    "title": meta.get("title", ""),
                    "description": meta.get("description", ""),
                    "date": meta.get("date", ""),
                    "updated": meta.get("updated", meta.get("date", "")),
                    "status": status,
                    "draft": meta.get("draft", False),
                    "paths": paths,
                    "image": meta.get("image", ""),
                    "image-alt": meta.get("image-alt", ""),
                }
            )
    return records


def validate(records: list[dict[str, object]]) -> list[str]:
    errors = []
    for record in records:
        public = record["status"] in {"finished", "nearly-finished"} and record["draft"] is False
        if record["status"] not in STATUSES:
            errors.append(f"{record['url']}: status must be finished, nearly-finished, or draft")
        if not isinstance(record["paths"], list) or not set(record["paths"]).issubset(ALLOWED_PATHS):
            errors.append(f"{record['url']}: paths contain an unknown identifier")
        if public and not str(record["title"]).strip():
            errors.append(f"{record['url']}: public item is missing title")
        if public and not str(record["description"]).strip():
            errors.append(f"{record['url']}: public item is missing description")
        if public and record["image"] and not str(record["image-alt"]).strip():
            errors.append(f"{record['url']}: image-alt is required when image is set")
        if public and record["status"] == "draft":
            errors.append(f"{record['url']}: draft item cannot be public")
        if public and record["kind"] == "experiment":
            source = _front_matter_lines(record["slug"], record["kind"])
            if not any(line.startswith("repo:") for line in source) or not any(line.startswith("artifact:") for line in source):
                errors.append(f"{record['url']}: public experiment needs repo and artifact links")
    return errors


def _front_matter_lines(slug: object, kind: object) -> list[str]:
    path = ROOT / {"experiment": "experiments"}.get(str(kind), str(kind)) / str(slug) / "index.qmd"
    return path.read_text(encoding="utf-8").splitlines() if path.exists() else []


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    records = collect()
    errors = validate(records)
    if errors:
        raise SystemExit("\n".join(f"ERROR: {error}" for error in errors))

    generated = ROOT / "_generated"
    generated.mkdir(exist_ok=True)
    public = [r for r in records if r["status"] in {"finished", "nearly-finished"} and r["draft"] is False]
    public.sort(key=lambda r: str(r["updated"]), reverse=True)
    (generated / "content-index.json").write_text(
        json.dumps({"generated": date.today().isoformat(), "items": public}, indent=2) + "\n",
        encoding="utf-8",
    )
    (generated / "recently-tended.json").write_text(
        json.dumps(public[:3], indent=2) + "\n", encoding="utf-8"
    )
    print(f"Validated {len(records)} content items; {len(public)} public.")
    if args.check:
        print("Maturity gate passed.")


if __name__ == "__main__":
    main()
