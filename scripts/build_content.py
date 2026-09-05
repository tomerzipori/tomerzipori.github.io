#!/usr/bin/env python3
"""Validate public content and build the site's deterministic content fragments."""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "_generated"
ALLOWED_PATHS = {
    "evidence-and-belief",
    "models-and-meaning",
    "data-and-strange-claims",
    "tools-for-thinking",
}
PUBLIC_STATUSES = {"finished", "nearly-finished"}
STATUSES = PUBLIC_STATUSES | {"draft"}
COLLECTIONS = ("posts", "notes", "experiments")
THEMES = (
    ("evidence-and-belief", "Evidence and belief"),
    ("models-and-meaning", "Models and meaning"),
    ("data-and-strange-claims", "Data and strange claims"),
    ("tools-for-thinking", "Tools for thinking"),
)
FEATURED_URLS = (
    "/notes/distilhubert-padding-study/",
    "/posts/looking-for-an-animal-neuron/",
    "/experiments/neuron-playground/",
    "/experiments/local-agent-toolkit/",
    "/experiments/blue-movies/",
    "/notes/criteria-move-answers/",
    "/notes/a-useful-local-agent-earns-its-keep/",
)
RECENT_NOTE_SLUGS = (
    "distilhubert-padding-study",
    "a-useful-local-agent-earns-its-keep",
    "criteria-move-answers",
)


def _scalar(value: str) -> object:
    value = value.strip()
    if value.lower() in {"true", "false"}:
        return value.lower() == "true"
    if value.startswith(("\"", "'")) and value.endswith(value[0]):
        return value[1:-1]
    if value.startswith("[") and value.endswith("]"):
        return [item.strip().strip("\"'") for item in value[1:-1].split(",") if item.strip()]
    return value


def parse_front_matter(path: Path) -> dict[str, object]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError(f"{path}: missing YAML front matter")
    end = text.find("\n---", 4)
    if end < 0:
        raise ValueError(f"{path}: unterminated YAML front matter")
    values: dict[str, object] = {}
    current_list: str | None = None
    for raw in text[4:end].splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("- ") and current_list:
            values.setdefault(current_list, []).append(line[2:].strip().strip('"\''))
            continue
        match = re.match(r"^([A-Za-z][A-Za-z0-9_-]*):(?:\s+(.*))?$", line)
        if not match:
            continue
        key, raw_value = match.groups()
        if raw_value is None:
            values[key] = []
            current_list = key
        else:
            values[key] = _scalar(raw_value)
            current_list = None
    return values


def _as_list(value: object) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value]
    return [str(value)]


def collect() -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    for collection in COLLECTIONS:
        for path in sorted((ROOT / collection).glob("*/index.qmd")):
            meta = parse_front_matter(path)
            kind = {"posts": "article", "notes": "note", "experiments": "project"}[collection]
            records.append(
                {
                    "kind": kind,
                    "collection": collection,
                    "slug": path.parent.name,
                    "url": f"/{collection}/{path.parent.name}/",
                    "title": meta.get("title", ""),
                    "description": meta.get("description", ""),
                    "date": meta.get("date", ""),
                    "updated": meta.get("updated", meta.get("date", "")),
                    "status": meta.get("status"),
                    "draft": meta.get("draft", False),
                    "paths": _as_list(meta.get("paths")),
                    "related": _as_list(meta.get("related")),
                    "image": meta.get("image", ""),
                    "image-alt": meta.get("image-alt", ""),
                    "study-status": meta.get("study-status", ""),
                    "study-status-as-of": meta.get("study-status-as-of", ""),
                    "repo": meta.get("repo", ""),
                    "artifact": meta.get("artifact", ""),
                }
            )
    return records


def is_public(record: dict[str, object]) -> bool:
    return record["status"] in PUBLIC_STATUSES and record["draft"] is False


def validate(records: list[dict[str, object]]) -> list[str]:
    errors: list[str] = []
    urls = {str(record["url"]): record for record in records}
    if len(urls) != len(records):
        errors.append("content URLs must be unique")
    for record in records:
        url = str(record["url"])
        paths = record["paths"]
        if record["status"] not in STATUSES:
            errors.append(f"{url}: status must be finished, nearly-finished, or draft")
        if not isinstance(paths, list) or not paths or not set(paths).issubset(ALLOWED_PATHS):
            errors.append(f"{url}: content needs one or more known paths")
        if is_public(record):
            if not str(record["title"]).strip():
                errors.append(f"{url}: public item is missing title")
            if not str(record["description"]).strip():
                errors.append(f"{url}: public item is missing description")
            if record["image"] and not str(record["image-alt"]).strip():
                errors.append(f"{url}: image-alt is required when image is set")
            if record["kind"] == "project" and not str(record["artifact"]).strip():
                errors.append(f"{url}: public project needs an artifact link")
        related = record["related"]
        if not isinstance(related, list):
            errors.append(f"{url}: related must be a list")
        if is_public(record):
            for target in related:
                if target not in urls or not is_public(urls[target]):
                    errors.append(f"{url}: related target is not a public content URL: {target}")
    public = [record for record in records if is_public(record)]
    if {path for record in public for path in record["paths"]} != ALLOWED_PATHS:
        errors.append("public content must use all four garden paths")
    public_urls = {str(record["url"]) for record in public}
    missing_featured = sorted(set(FEATURED_URLS) - public_urls)
    if missing_featured:
        errors.append(f"homepage featured content is not public: {', '.join(missing_featured)}")
    return errors


def _public(records: list[dict[str, object]]) -> list[dict[str, object]]:
    return sorted(
        (record for record in records if is_public(record)),
        key=lambda record: (str(record["updated"]), str(record["title"])),
        reverse=True,
    )


def _kind_label(kind: str) -> str:
    return {"article": "Article", "note": "Note", "project": "Project"}[kind]


def _status_label(record: dict[str, object]) -> str:
    return "Published" if record["status"] == "finished" else "Nearly finished"


def _record_attrs(record: dict[str, object], prefix: str = "") -> str:
    return (
        f'data-{prefix}url="{escape(str(record["url"]), quote=True)}" '
        f'data-{prefix}kind="{escape(str(record["kind"]), quote=True)}" '
        f'data-{prefix}themes="{escape(" ".join(str(path) for path in record["paths"]), quote=True)}" '
        f'data-{prefix}title="{escape(str(record["title"]), quote=True)}"'
    )


def _archive_row(record: dict[str, object], extra_class: str = "") -> str:
    study = ""
    if record["study-status"]:
        study = (
            f'<span class="study-status" title="Study status checked {escape(str(record["study-status-as-of"]))}">'
            f'{escape(str(record["study-status"]).title())} study</span>'
        )
    return (
        f'<article class="archive-row {extra_class}" data-archive-item '
        f'data-kind="{escape(str(record["kind"]))}" data-title="{escape(str(record["title"]), quote=True)}">'
        f'<span class="status">{_status_label(record)}</span>'
        f'<div><h2 class="row-title"><a href="{escape(str(record["url"]))}">{escape(str(record["title"]))}</a></h2>'
        f'<p class="row-description">{escape(str(record["description"]))}</p>{study}</div>'
        f'<p class="row-type">{_kind_label(str(record["kind"]))} · {escape(str(record["date"])[:4])}</p></article>'
    )


def _write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def _clean_generated() -> None:
    GENERATED.mkdir(exist_ok=True)
    for path in GENERATED.glob("*.html"):
        path.unlink(missing_ok=True)
    for path in GENERATED.glob("*.json"):
        path.unlink(missing_ok=True)


def _garden_map(records: list[dict[str, object]]) -> str:
    by_url = {str(record["url"]): record for record in records}
    edges: list[str] = []
    regions: list[str] = []
    for theme_slug, theme_label in THEMES:
        items = sorted((record for record in records if record["paths"][0] == theme_slug), key=lambda record: str(record["title"]).lower())
        nodes: list[str] = []
        for record in items:
            related = [target for target in record["related"] if target in by_url]
            nodes.append(
                f'<a class="garden-node garden-node--{record["kind"]}" href="{escape(str(record["url"]))}" '
                f'{_record_attrs(record, "garden-")} data-garden-related="{escape(" ".join(related), quote=True)}">'
                f'<span class="garden-node-shape" aria-hidden="true"></span><span class="garden-node-copy">'
                f'<span class="garden-node-kind">{_kind_label(str(record["kind"]))}</span>'
                f'<span class="garden-node-title">{escape(str(record["title"]))}</span></span></a>'
            )
            for extra_theme in record["paths"][1:]:
                edges.append(f'<span class="garden-edge-data" data-from="{escape(str(record["url"]))}" data-to-theme="{escape(str(extra_theme))}"></span>')
        regions.append(
            f'<section class="garden-region garden-region--{theme_slug}" data-garden-region="{theme_slug}">'
            f'<p class="garden-region-label"><span class="region-dot" aria-hidden="true"></span>{theme_label}</p>'
            f'<div class="garden-region-items">{"".join(nodes)}</div></section>'
        )
    return (
        '<div class="garden-map-canvas" data-garden-map-canvas>'
        '<svg class="garden-connections" data-garden-connections aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>'
        f'{"".join(regions)}{"".join(edges)}</div>'
    )


def _garden_list(records: list[dict[str, object]]) -> str:
    groups: list[str] = []
    for theme_slug, theme_label in THEMES:
        items = sorted((record for record in records if record["paths"][0] == theme_slug), key=lambda record: str(record["title"]).lower())
        rows = "".join(
            f'<li data-garden-list-item {_record_attrs(record, "garden-")}><a href="{escape(str(record["url"]))}">'
            f'<span class="garden-list-kind">{_kind_label(str(record["kind"]))}</span>{escape(str(record["title"]))}</a></li>'
            for record in items
        )
        groups.append(
            f'<section class="garden-list-group" data-garden-list-group="{theme_slug}"><h2>{theme_label}</h2>'
            f'<ul class="garden-list-items">{rows}</ul></section>'
        )
    return "".join(groups)


def _relationships(records: list[dict[str, object]]) -> dict[str, tuple[list[dict[str, object]], list[dict[str, object]]]]:
    by_url = {str(record["url"]): record for record in records}
    backlinks: dict[str, list[dict[str, object]]] = {url: [] for url in by_url}
    for record in records:
        for target in record["related"]:
            if target in backlinks:
                backlinks[target].append(record)
    return {
        url: ([by_url[target] for target in record["related"] if target in by_url], backlinks[url])
        for url, record in by_url.items()
    }


def _relationship_fragment(related: list[dict[str, object]], backlinks: list[dict[str, object]]) -> str:
    if not related and not backlinks:
        return ""

    def links(items: list[dict[str, object]]) -> str:
        return "".join(
            f'<li><span class="relationship-kind">{_kind_label(str(item["kind"]))}</span>'
            f'<a href="{escape(str(item["url"]))}">{escape(str(item["title"]))}</a></li>'
            for item in items
        )

    sections = []
    if related:
        sections.append(f'<div><h3>Related</h3><ul>{links(related)}</ul></div>')
    if backlinks:
        sections.append(f'<div><h3>Linked from</h3><ul>{links(backlinks)}</ul></div>')
    return f'<section class="relationship-section" aria-label="Content relationships">{"".join(sections)}</section>'


def _feed(records: list[dict[str, object]]) -> str:
    items = []
    for record in records:
        if record["kind"] not in {"article", "note"}:
            continue
        link = f"https://tomerzipori.github.io{record['url']}"
        items.append(
            f'<item><title>{escape(str(record["title"]))}</title><link>{link}</link><guid isPermaLink="true">{link}</guid>'
            f'<description>{escape(str(record["description"]))}</description><pubDate>{escape(str(record["updated"]))}</pubDate></item>'
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0"><channel><title>Tomer Zipori — Writing</title>'
        '<link>https://tomerzipori.github.io/writing/</link>'
        '<description>Notes and articles on models, evidence, and useful tools.</description>'
        f'{"".join(items)}</channel></rss>'
    )


def generate(records: list[dict[str, object]]) -> None:
    public = _public(records)
    _clean_generated()
    payload = {"generated": date.today().isoformat(), "items": public}
    _write(GENERATED / "content-index.json", json.dumps(payload, indent=2, ensure_ascii=False))
    _write(GENERATED / "recently-tended.json", json.dumps(public[:3], indent=2, ensure_ascii=False))
    _write(GENERATED / "garden-data.html", '<script type="application/json" id="garden-data">' + json.dumps(public, ensure_ascii=False) + "</script>")
    writing = [record for record in public if record["kind"] in {"article", "note"}]
    _write(
        GENERATED / "writing-list.html",
        '<div class="archive-toolbar" data-writing-toolbar><div class="filter-buttons" role="group" aria-label="Writing filters">'
        '<button type="button" class="filter-button is-active" data-writing-filter="all">All</button>'
        '<button type="button" class="filter-button" data-writing-filter="article">Articles</button>'
        '<button type="button" class="filter-button" data-writing-filter="note">Notes</button></div>'
        '<label class="search-field">Search writing <input type="search" data-writing-search placeholder="Title or idea"></label>'
        '<button type="button" class="reset-button" data-writing-reset hidden>Reset</button></div>'
        '<p class="empty-state" data-writing-empty hidden>No writing matches that search.</p>'
        '<div class="archive-list" data-writing-list>' + "".join(_archive_row(record) for record in writing) + "</div>",
    )
    _write(GENERATED / "notes-list.html", '<div class="archive-list">' + "".join(_archive_row(record) for record in public if record["kind"] == "note") + "</div>")
    _write(GENERATED / "projects-list.html", '<div class="archive-list">' + "".join(_archive_row(record) for record in public if record["kind"] == "project") + "</div>")
    for theme_slug, _ in THEMES:
        items = [record for record in public if theme_slug in record["paths"]]
        _write(GENERATED / f"theme-{theme_slug}.html", '<div class="archive-list">' + "".join(_archive_row(record) for record in items) + "</div>")
    _write(GENERATED / "garden-map.html", _garden_map(public))
    _write(GENERATED / "garden-list.html", _garden_list(public))
    by_url = {str(record["url"]): record for record in public}
    featured = [by_url[url] for url in FEATURED_URLS]
    _write(
        GENERATED / "homepage-garden.html",
        '<div class="compact-garden-themes">' + "".join(
            f'<a class="compact-theme compact-theme--{slug}" href="/questions/{slug}/"><span>{label}</span><span class="compact-theme-arrow" aria-hidden="true">↗</span></a>'
            for slug, label in THEMES
        ) + '</div><div class="compact-garden-items">' + "".join(
            f'<a href="{escape(str(record["url"]))}" data-featured-kind="{record["kind"]}"><span>{_kind_label(str(record["kind"]))}</span>{escape(str(record["title"]))}</a>'
            for record in featured
        ) + '</div>',
    )
    recent = [by_url[f"/notes/{slug}/"] for slug in RECENT_NOTE_SLUGS]
    _write(GENERATED / "homepage-recent.html", '<div class="recent-note-list">' + "".join(_archive_row(record, "recent-note-row") for record in recent) + "</div>")
    relationships = _relationships(public)
    for record in public:
        related, backlinks = relationships[str(record["url"])]
        _write(GENERATED / f'{record["kind"]}-{record["slug"]}.html', _relationship_fragment(related, backlinks))
    feed = _feed(public)
    _write(ROOT / "writing" / "index.xml", feed)
    _write(ROOT / "blog" / "blog.xml", feed)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    records = collect()
    errors = validate(records)
    if errors:
        raise SystemExit("\n".join(f"ERROR: {error}" for error in errors))
    generate(records)
    public_count = sum(is_public(record) for record in records)
    print(f"Validated {len(records)} content items; {public_count} public.")
    if args.check:
        print("Maturity gate passed.")


if __name__ == "__main__":
    main()
