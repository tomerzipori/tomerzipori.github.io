# tomerzipori.github.io

Tomer Zipori's portfolio site for work on models, evidence, and useful research
tools.

## Local workflow

```bash
make check
quarto preview
```

New content is private by default:

```bash
make new-note TITLE="A title"
make new-article TITLE="A title"
make new-experiment TITLE="A title"
```

Set `status` to `finished` or `nearly-finished` and `draft: false` only after
the content passes the public maturity gate. `_site/` and generated indexes are
not committed.
