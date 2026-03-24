# Security Policy

## Scope

This repository covers `chatgpt-markdown-exporter`.

## Never Commit

- live secrets or API keys
- populated `.env` files
- unsanitized ChatGPT exports or screenshots
- local logs, caches, or auth artifacts

## Safe Local Pattern

- keep exported conversations out of Git unless they are intentionally sanitized fixtures
- treat ChatGPT conversations as potentially sensitive user data
- redact names, customer information, credentials, and uploaded file references before sharing samples
- keep live secrets in untracked machine-local files or secret stores when future automation is added

## Release Hygiene

- review staged files before every push
- confirm only intended source, docs, configs, and sanitized assets are included
- keep local Markdown exports and unpacked test copies untracked
- review extension permissions before any public release

## If Something Sensitive Was Committed

1. rotate the exposed secret or credential immediately
2. remove the sensitive value from the repository history if needed
3. document the incident and remediation in the relevant ops notes
4. review whether adjacent credentials, tokens, or files were also exposed

## Extension-Specific Notes

- the extension only reads the current ChatGPT page DOM and stores lightweight UI preferences
- it does not need network permissions or remote code
- any future telemetry or sync feature would require an explicit review and ADR
