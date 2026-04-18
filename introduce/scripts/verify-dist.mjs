/**
 * Post-build check: ensures dist/index.html references /introduce/... and files exist.
 * Prevents deploying a broken tree (C-09) or shipping HTML that points at missing hashed chunks.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

function fail(msg) {
  console.error(`verify-dist: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  fail(`missing ${indexPath} — run npm run build first`);
}

const html = fs.readFileSync(indexPath, 'utf8');

if (!html.includes('/introduce/assets/')) {
  fail('dist/index.html must reference assets under /introduce/assets/ (check vite.config.ts base)');
}

const scriptSrc = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
const linkHref = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map((m) => m[1]);
const refs = [...scriptSrc, ...linkHref];

for (const ref of refs) {
  if (!ref.startsWith('/introduce/')) {
    fail(`unexpected asset URL (must be under /introduce/): ${ref}`);
  }
  const rel = ref.replace(/^\/introduce\//, '');
  const abs = path.join(distDir, rel.replace(/\//g, path.sep));
  if (!fs.existsSync(abs)) {
    fail(`referenced file missing on disk: ${ref} → ${abs}`);
  }
}

const png = path.join(distDir, 'StudySolo.png');
if (!fs.existsSync(png)) {
  fail('missing dist/StudySolo.png — ensure public/StudySolo.png exists');
}

console.log('verify-dist: OK (introduce base + hashed assets + favicon present)');
