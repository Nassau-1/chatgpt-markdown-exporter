import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const manifestPath = path.join(repoRoot, 'src', 'manifest.json');

try {
  const manifestData = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestData);

  console.log('Checking manifest version...');
  if (manifest.manifest_version !== 3) {
    console.error('Error: Manifest version must be 3');
    process.exit(1);
  }

  console.log('Checking Content Security Policy...');
  if (!manifest.content_security_policy) {
    console.error('Error: Missing content_security_policy');
    process.exit(1);
  }

  if (!manifest.content_security_policy.extension_pages) {
    console.error('Error: Missing content_security_policy.extension_pages');
    process.exit(1);
  }

  const expectedCSP = "script-src 'self'; object-src 'none'; style-src 'self';";
  if (manifest.content_security_policy.extension_pages !== expectedCSP) {
    console.error(`Error: Incorrect CSP. Expected: "${expectedCSP}", Got: "${manifest.content_security_policy.extension_pages}"`);
    process.exit(1);
  }

  console.log('Checking host permissions...');
  const expectedHosts = [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*"
  ];
  for (const host of expectedHosts) {
    if (!manifest.host_permissions.includes(host)) {
      console.error(`Error: Missing host permission: ${host}`);
      process.exit(1);
    }
  }

  console.log('Manifest validation successful!');
} catch (error) {
  console.error('Validation failed:', error.message);
  process.exit(1);
}
