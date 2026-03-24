# ChatGPT Markdown Exporter

Manifest V3 Chrome extension that exports the active ChatGPT conversation to a clean Markdown file.

## Current Status

Status as of 2026-03-24:

- the project is available as a governed workspace repository under `projects/`
- the current version loads as an unpacked Chromium extension with no build step
- the popup includes export settings and a direct link to the latest GitHub repository

## Why This Exists

This project provides a lightweight browser extension for exporting the active ChatGPT conversation to a clean Markdown file with minimal setup and no build pipeline.

## Features

- exports the active ChatGPT thread to Markdown
- preserves headings, paragraphs, lists, links, code blocks, inline code, blockquotes, and simple tables
- stores user preferences for display name and filename prefix via extension storage
- works on both `chatgpt.com` and `chat.openai.com`
- requires no bundler or dependency install for extension loading

## Repo Structure

```text
chatgpt-markdown-exporter/
|-- docs/
|   |-- architecture.md
|   `-- decisions/
|-- scripts/
|   `-- validate-extension.mjs
|-- src/
|   |-- content-script.js
|   |-- lib/
|   |   `-- exporter-core.js
|   |-- manifest.json
|   `-- popup/
|       |-- popup.css
|       |-- popup.html
|       `-- popup.js
|-- CHANGELOG.md
|-- LICENSE
|-- README.md
|-- SECURITY.md
`-- TODO.md
```

## Local Use

1. Open this repository folder.
2. Run `powershell -ExecutionPolicy Bypass -File .\scripts\validate-extension.ps1` from the repo root.
3. Open `chrome://extensions`.
4. Enable Developer mode.
5. Choose `Load unpacked`.
6. Select [src](C:\Users\EnzoTERRIER\Codex\projects\chatgpt-markdown-exporter\src).
7. Open a ChatGPT conversation and click the extension action.

## Verification

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\validate-extension.ps1
```

The validation script checks:

- required extension files exist
- the manifest parses and references real files
- the declared host permissions and popup wiring are present

## Security

See [SECURITY.md](./SECURITY.md).

## Change History

See [CHANGELOG.md](./CHANGELOG.md) and [TODO.md](./TODO.md).

## Decisions

- architecture overview: [docs/architecture.md](./docs/architecture.md)
- initial repo and extension decision: [docs/decisions/ADR-0001-foundation.md](./docs/decisions/ADR-0001-foundation.md)

## Intentionally Excluded

- server-side sync or cloud backups
- Chrome Web Store packaging automation
- export support for attachments beyond placeholders and alt text
- support for every possible OpenAI UI experiment without future selector updates

## Known Constraints

- ChatGPT is a third-party web UI and DOM changes can break extraction
- the extension only exports the conversation visible to the signed-in browser session
- image-heavy responses currently export as placeholders rather than binary assets
