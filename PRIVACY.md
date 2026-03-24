# Privacy

## Summary

ChatGPT Markdown Exporter is designed to operate locally in the user's browser.

- it exports the active ChatGPT conversation only when the user triggers an export
- it does not send conversation content to external servers
- it does not include analytics, telemetry, ads, or tracking code

## What The Extension Accesses

The extension runs only on:

- `https://chatgpt.com/*`
- `https://chat.openai.com/*`

It reads the visible conversation content from the current ChatGPT page so it can generate a Markdown file for download.

## What The Extension Stores

The extension stores only lightweight user preferences:

- display name used in the export
- filename prefix used for downloads

These preferences are stored using the browser extension storage API.

## What The Extension Does Not Do

The extension does not:

- upload chat content to a remote server
- collect usage analytics
- sell or share personal data
- access websites outside the declared ChatGPT host permissions

## Downloads

When the user chooses to export, the extension creates a Markdown file locally through the browser downloads API. Exported files are saved under the user's control.

## Future Changes

If the project ever adds telemetry, cloud sync, or any new data-sharing behavior, this privacy document should be updated before release.
