#!/usr/bin/env python3
"""Create a hidden Quarto content stub."""

from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    if not slug:
        raise SystemExit("Title must contain at least one letter or number.")
    return slug


def main() -> None:
    if len(sys.argv) != 3 or sys.argv[1] not in {"note", "article", "experiment"}:
        raise SystemExit("Usage: scaffold_content.py note|article|experiment \"Title\"")

    kind, title = sys.argv[1], sys.argv[2].strip()
    if not title:
        raise SystemExit("A title is required.")

    folder = {"note": "notes", "article": "posts", "experiment": "experiments"}[kind]
    destination = ROOT / folder / slugify(title) / "index.qmd"
    if destination.exists():
        raise SystemExit(f"Refusing to overwrite {destination.relative_to(ROOT)}")

    destination.parent.mkdir(parents=True, exist_ok=True)
    today = date.today().isoformat()
    escaped_title = title.replace('"', '\\"')
    extra = ""
    if kind == "experiment":
        extra = "repo: # public repository URL\nartifact: # stable artifact URL\n"

    destination.write_text(
        f'''---\ntitle: "{escaped_title}"\ndescription: "TODO: one clear sentence."\ndate: {today}\nupdated: {today}\nstatus: draft\ndraft: true\npaths:\n  - tools-for-thinking\nimage: ""\nimage-alt: ""\n{extra}---\n\n<!-- Complete the metadata and write the question before publishing. -->\n\n# The question\n\nTODO.\n''',
        encoding="utf-8",
    )
    print(f"Created {destination.relative_to(ROOT)}")
    print("It is hidden until status is finished/nearly-finished and draft is false.")
    print("Preview with: quarto preview")


if __name__ == "__main__":
    main()
