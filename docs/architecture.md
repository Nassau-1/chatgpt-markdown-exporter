# Architecture

## Context

- project: `chatgpt-markdown-exporter`
- purpose: `Export ChatGPT conversations to Markdown through a packaged Chrome extension.`
- date: `2026-03-23`

## Goals

- turn a one-off browser-console workflow into a reusable Chrome extension
- keep the project dependency-light so install and review remain simple
- isolate DOM parsing logic so selector updates are localized

## Components

- `src/manifest.json`: Manifest V3 extension entrypoint and permissions
- `src/lib/exporter-core.js`: DOM parsing and Markdown rendering logic shared by the content script
- `src/content-script.js`: message bridge between the extension UI and the active ChatGPT page
- `src/popup/*`: operator-facing UI for export settings and download initiation
- `scripts/validate-extension.ps1`: repo-local integrity checks that run on this Windows workspace

## Data And Control Flow

1. The popup loads stored settings and validates that the active tab is a supported ChatGPT URL.
2. The popup sends an `EXPORT_MARKDOWN` request to the content script already attached to the page.
3. The content script calls the exporter core to inspect the live DOM and build Markdown plus a sanitized filename.
4. The popup receives the payload and saves it through the Chrome downloads API.

## Boundaries

In scope:

- exporting a visible ChatGPT conversation from the active browser tab
- lightweight user preferences stored in extension storage
- repo governance, validation, and extension documentation

Out of scope:

- scraping private APIs or bypassing platform controls
- syncing exports to third-party services
- supporting browsers outside the Chrome extension model without adaptation work

## Operational Notes

- the extension uses host permissions only for `chatgpt.com` and `chat.openai.com`
- selector drift in the ChatGPT web app is the primary operational risk
- there is no build pipeline; the `src/` directory is the unpacked extension root
