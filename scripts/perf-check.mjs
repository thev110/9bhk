/**
 * Payload and image-policy probe.
 *
 * Reports what a crawler and a phone actually download for the pages that
 * matter, so the Core Web Vitals work is measured rather than assumed.
 *
 *   BASE_URL=http://127.0.0.1:3111 node scripts/perf-check.mjs
 */

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

const PAGES = [
  "/",
  "/stays",
  "/property/bay-breakers-vault",
  "/locations/ecr",
  "/guides/ecr-weekend-stays",
  "/search",
];

async function bytes(path) {
  try {
    const res = await fetch(BASE + path);
    if (!res.ok) return 0;
    return (await res.arrayBuffer()).byteLength;
  } catch {
    return 0;
  }
}

function uniq(list) {
  return [...new Set(list)];
}

console.log(
  "page".padEnd(34),
  "html".padStart(9),
  "js".padStart(9),
  "css".padStart(8),
  "img(opt)".padStart(10),
  "img(raw)".padStart(9),
);
console.log("─".repeat(84));

const findings = [];

for (const path of PAGES) {
  const html = await (await fetch(BASE + path)).text();

  const scripts = uniq([...html.matchAll(/<script[^>]+src="(\/_next\/[^"]+\.js)"/g)].map((m) => m[1]));
  const styles = uniq([...html.matchAll(/<link[^>]+href="(\/_next\/[^"]+\.css)"/g)].map((m) => m[1]));
  const imgs = uniq([...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]));

  let js = 0;
  let css = 0;
  let optimised = 0;
  let raw = 0;
  for (const s of scripts) js += await bytes(s);
  for (const c of styles) css += await bytes(c);
  for (const i of imgs) {
    if (i.startsWith("/_next/image")) {
      /* Ask for the largest candidate the page could have requested. */
      optimised += await bytes(`${i.split("&w=")[0]}&w=1200&q=78`);
    } else if (i.startsWith("/")) {
      raw += await bytes(i);
    }
  }

  console.log(
    path.padEnd(34),
    kb(Buffer.byteLength(html)).padStart(9),
    kb(js).padStart(9),
    kb(css).padStart(8),
    kb(optimised).padStart(10),
    kb(raw).padStart(9),
  );

  /* Image policy: a raw <img> on a listing-heavy page is the regression this
     check exists to catch. */
  const rawImgs = imgs.filter((i) => i.startsWith("/assets/") || i.endsWith(".png"));
  if (rawImgs.length && path !== "/admin") {
    findings.push(`${path}: ${rawImgs.length} un-optimised <img> (${rawImgs.slice(0, 2).join(", ")})`);
  }
  if (optimised === 0 && imgs.length) {
    findings.push(`${path}: no next/image candidates`);
  }
}

const home = await (await fetch(BASE + "/")).text();
const prop = await (await fetch(BASE + "/property/bay-breakers-vault")).text();
const cssPath = /<link[^>]+href="(\/_next\/[^"]+\.css)"/.exec(home)?.[1];
const css = cssPath ? await (await fetch(BASE + cssPath)).text() : "";
/* next/font generates a metric-adjusted fallback face per family. Without it
   `display: swap` swaps a differently-shaped font in and the text moves. */
const metricFallbacks = /size-adjust/.test(css);

console.log("\nPolicy");
console.log(`  LCP image preloaded on /property:   ${/as="image"/.test(prop) ? "yes" : "NO"}`);
/* next/image emits `<link rel="preload" as="image" imageSrcSet=...>` for a
   `priority` image. That is the high-priority signal; there is no separate
   fetchpriority attribute on the tag. */
console.log(`  LCP image preloaded (priority):     ${/<link rel="preload"[^>]*as="image"[^>]*imageSrcSet/i.test(prop) ? "yes" : "NO"}`);
console.log(`  Font swap uses metric fallback:     ${metricFallbacks ? "yes (CLS-safe)" : "NO"}`);
console.log(`  Fonts self-hosted by next/font:     ${(home.match(/as="font"/g) || []).length} preload link(s)`);
console.log(`  Render-blocking CSS:                ${(home.match(/rel="stylesheet"/g) || []).length} stylesheet(s)`);
console.log(`  Third-party scripts:                ${(home.match(/src="https?:\/\/(?!www\.9bhk)/g) || []).length}`);

const optimised = await fetch(`${BASE}/_next/image?url=%2Fassets%2Fprop-palm-grove.jpg&w=1200&q=78`, {
  headers: { accept: "image/avif,image/webp,image/*" },
});
const source = await fetch(`${BASE}/assets/prop-palm-grove.jpg`);
const optSize = Number(optimised.headers.get("content-length"));
const srcSize = Number(source.headers.get("content-length"));
console.log(
  `  Listing photo:                      ${kb(optSize)} ${optimised.headers.get("content-type")} vs ${kb(srcSize)} source`,
);

const logo = await fetch(`${BASE}/logo-mark.png`);
const logoOpt = await fetch(`${BASE}/_next/image?url=%2Flogo-mark.png&w=64&q=80`);
const logoSize = Number(logoOpt.headers.get("content-length"));
const logoSrc = Number(logo.headers.get("content-length"));
console.log(`  Header logo (36 px):                ${kb(logoSize)} optimised vs ${kb(logoSrc)} source`);

if (findings.length) {
  console.log("\nFindings");
  for (const f of findings) console.log(`  ! ${f}`);
} else {
  console.log("\nAll listing photography is served through next/image.");
}
