/**
 * Regenerate the app icons from the existing logo artwork.
 *
 * `app/icon.png` was a byte-for-byte copy of `public/logo-mark.png`: a
 * 1254x1254, 1.85 MB PNG. Next.js serves `app/icon.png` as the favicon
 * **unoptimised** — it is not a route, so it bypasses `/_next/image` entirely —
 * which means every browser that opens a 9bhk tab downloads 1.8 MB to render
 * it at 16 px.
 *
 * The mark itself is not changed, only its size. A favicon is never displayed
 * above 64 px in a tab and 180 px as a home-screen icon, so a 512 px master
 * plus a 180 px Apple icon is indistinguishable from the original at every size
 * the platform actually uses, and roughly 98% smaller.
 *
 * Run: node scripts/generate-icons.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = (() => {
  for (const id of ["sharp", "next/node_modules/sharp", "next/dist/compiled/sharp"]) {
    try {
      const m = require(id);
      return m.default || m;
    } catch {
      /* keep looking */
    }
  }
  throw new Error("sharp not found - it ships inside next, so `npm i` is enough");
})();

const SOURCE = "public/logo-mark.png";
if (!existsSync(SOURCE)) {
  console.error(`${SOURCE} is missing - nothing to do.`);
  process.exit(1);
}

const source = readFileSync(SOURCE);
const before = await sharp(source).metadata();
console.log(`source: ${SOURCE}  ${before.width}x${before.height}  ${source.length} bytes`);

const TARGETS = [
  // Next.js metadata files. Served verbatim by `next start` and the CDN, so
  // these are the ones that must be small.
  { out: "app/icon.png", size: 512 },
  { out: "app/apple-icon.png", size: 180 },
  // PWA / web-app-manifest icons. These live in `public/` because the manifest
  // references them by URL; an `app/icon-192.png` would be unreachable (Next
  // only routes `icon` / `apple-icon`), so a 192 or 512 candidate placed in
  // `app/` is a 404 waiting to happen.
  { out: "public/icon-192.png", size: 192 },
  { out: "public/icon-512.png", size: 512 },
];

for (const { out, size } of TARGETS) {
  const buf = await sharp(source)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
  writeFileSync(out, buf);
  const saved = (100 - (buf.length / source.length) * 100).toFixed(1);
  console.log(`  ${out.padEnd(22)} ${size}x${size}  ${String(buf.length).padStart(7)} bytes  (-${saved}%)`);
}

console.log("done.");
