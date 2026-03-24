param()

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$extensionRoot = Join-Path $repoRoot "src"

$requiredFiles = @(
  "manifest.json",
  "content-script.js",
  "lib\exporter-core.js",
  "popup\popup.html",
  "popup\popup.css",
  "popup\popup.js"
)

foreach ($relativePath in $requiredFiles) {
  $absolutePath = Join-Path $extensionRoot $relativePath
  if (-not (Test-Path $absolutePath)) {
    throw "Missing required file: $relativePath"
  }
}

$manifestPath = Join-Path $extensionRoot "manifest.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

if ($manifest.manifest_version -ne 3) {
  throw "Manifest must use version 3."
}

if (-not $manifest.action.default_popup) {
  throw "Manifest must define action.default_popup."
}

$referencedFiles = @($manifest.action.default_popup)
$referencedFiles += $manifest.content_scripts | ForEach-Object { $_.js }

foreach ($entry in $referencedFiles) {
  $candidatePath = Join-Path $extensionRoot $entry
  if (-not (Test-Path $candidatePath)) {
    throw "Manifest references a missing file: $entry"
  }
}

$expectedHosts = @(
  "https://chatgpt.com/*",
  "https://chat.openai.com/*"
)

foreach ($requiredHost in $expectedHosts) {
  if ($manifest.host_permissions -notcontains $requiredHost) {
    throw "Missing host permission: $requiredHost"
  }
}

Write-Host "Extension validation passed."
