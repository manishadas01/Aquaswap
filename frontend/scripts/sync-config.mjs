// Copies the repo's single-source-of-truth network config (../config/*.json)
// into frontend/config so it can be bundled by Next.js even when this
// package is deployed with `frontend/` as the build root.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const rootConfigDir = join(here, '..', '..', 'config');
const localConfigDir = join(here, '..', 'config');

mkdirSync(localConfigDir, { recursive: true });

for (const file of ['testnet.json', 'local.json']) {
  const src = join(rootConfigDir, file);
  const dest = join(localConfigDir, file);
  if (existsSync(src)) {
    copyFileSync(src, dest);
  } else if (!existsSync(dest)) {
    console.warn(`[sync-config] ${src} not found, skipping`);
  }
}
