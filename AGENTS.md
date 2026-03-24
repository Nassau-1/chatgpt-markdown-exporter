# Repository Agent Rules

This repository follows the shared workspace governance model.

## Required Maintenance

- keep `README.md`, `SECURITY.md`, `CHANGELOG.md`, and `TODO.md` current
- update `docs/architecture.md` when architecture changes
- add an ADR when a material decision is made
- keep live secrets and runtime state out of Git
- prefer `scripts/validate-extension.ps1` for local checks in this workspace

## Repo Shape

- treat `src/` as the unpacked extension root
- keep reusable extraction logic in `src/lib/`
- keep developer checks in `scripts/`

## Documentation Rules

- repo docs use standard Markdown links
- Obsidian-only notes can use `[[Wiki Links]]`
- use ISO dates and timestamps for status and history
