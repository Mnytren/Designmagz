import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3];

const require = createRequire(import.meta.url);
let puppeteer;
const candidates = [
  'puppeteer',
  'C:/Users/nateh/AppData/Local/Temp/puppeteer-test/node_modules/puppeteer',
];
for (const c of candidates) {
  try { puppeteer = require(c); break; } catch {}
}
if (!puppeteer) {
  console.error('Puppeteer not found. Install with: npm install puppeteer');
  process.exit(1);
}

const dir = join(process.cwd(), 'temporary screenshots');
await mkdir(dir, { recursive: true });
const existing = (await readdir(dir)).filter((f) => /^screenshot-\d+/.test(f));
const next = existing.reduce((m, f) => Math.max(m, parseInt(f.match(/^screenshot-(\d+)/)[1], 10)), 0) + 1;
const file = join(dir, `screenshot-${next}${label ? '-' + label : ''}.png`);

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 2400 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: file, fullPage: true });
await browser.close();
console.log(file);
