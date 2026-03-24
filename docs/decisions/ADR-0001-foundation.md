# ADR-0001: Establish The MV3 Extension Foundation

- date: `2026-03-23`
- status: `accepted`

## Context

The project goal is to deliver a governed browser extension that exports the active ChatGPT conversation to Markdown while staying easy to review, load locally, and maintain in this workspace.

## Decision

Build the repository under `projects/chatgpt-markdown-exporter` as a Manifest V3 extension with a small, dependency-light structure.

Key design choices:

- keep the extension dependency-free and loadable as unpacked source from `src/`
- isolate DOM parsing and Markdown rendering in `src/lib/exporter-core.js`
- use an action popup for operator settings and download initiation
- keep validation in-repo with a small Node script instead of adding a bundler or full test harness on day one

## Consequences

Positive:

- the project now follows workspace repo governance
- the extension is easier to install, review, and maintain
- the extractor logic can evolve independently from the popup UI

Tradeoffs:

- the extension still depends on third-party DOM structure and will need maintenance when ChatGPT changes
- skipping a build system keeps setup simple but limits advanced tooling

## Rejected Options

- keep the feature as a console snippet only: rejected because the user asked for a Chrome extension deliverable
- build with React or a bundler from day one: rejected to keep the first version operational with minimal setup
