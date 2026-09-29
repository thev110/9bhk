/**
 * SEO validation harness.
 *
 * Crawls a running 9bhk instance and asserts the properties that are cheap to
 * regress and expensive to discover late: unique titles and descriptions,
 * self-referencing canonicals, one H1, breadcrumbs, JSON-LD presence, robots
 * directives, sitemap hygiene and orphan detection.
 *
 * Usage:
 *   npm run build && npm start          # in one shell
 *   npm run seo:audit                    # in another
 *   BASE_URL=https://www.9bhk.app npm run seo:audit   # audit production
 *
 * Every check is a warning or an error with an explicit list, so a partial
 * failure still produces a useful report rather than a single throw.
 */

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const TIMEOUT_MS = Number(process.env.SEO_TIMEOUT_MS || 25000);

/** Structured-data types observed across the crawl, for the report. */
const schemaTypes = new Set();

const errors = [];
const warnings = [];
const info = [];

const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const note = (m) => info.push(m);

/* ── Minimal HTML helpers (regex, not a DOM — keeps the script dependency-free) ── */

function metaContent(html, selector) {
  const re = new RegExp(`<meta[^>]*${selector}[^>]*>`, "gi");
  let match;
  while ((match = re.exec(html))) {
    const tag = match[0];
    const order = tag.indexOf(selector);
    const before = tag.slice(0, order);
    // Next.js emits `<meta name="..." content="...">`; handle either attribute order.
    const content = /content="([^"]*)"/.exec(tag)?.[1];
    if (content === undefined) continue;
    void before;
    return decode(content);
  }
  return null;
}

function linkRel(html, rel) {
  const re = new RegExp(`<link[^>]*rel="${rel}"[^>]*>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    const href = /href="([^"]*)"/.exec(m[0])?.[1];
    if (href) out.push(decode(href));
  }
  return out;
}

function decode(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'");
}

function h1s(html) {
  return [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    stripTags(m[1]).replace(/\s+/g, " ").trim(),
  );
}

function headings(html, level) {
  return [...html.matchAll(new RegExp(`<h${level}[^>]*>([\\s\\S]*?)</h${level}>`, "gi"))];
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ");
}

function textOf(html) {
  return stripTags(html).replace(/\s+/g, " ").trim();
}

function jsonLdBlocks(html) {
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let m;
  while ((m = re.exec(html))) {
    try {
      blocks.push(JSON.parse(m[1].replace(/\\u003c/g, "<")));
    } catch (error) {
      err(`${"JSON-LD parse failure"}: ${error.message}`);
    }
  }
  return blocks;
}

function nodeTypes(blocks) {
  const types = new Set();
  for (const block of blocks) {
    const visit = (node) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach(visit);
      if (node["@type"]) {
        for (const t of [].concat(node["@type"])) types.add(t);
      }
      for (const value of Object.values(node)) {
        if (value && typeof value === "object") visit(value);
      }
    };
    visit(block);
  }
  return types;
}

/* ── Fetch ── */

async function fetchPage(pathname) {
  const url = pathname.startsWith("http") ? pathname : `${BASE}${pathname}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": "9bhk-seo-audit/1.0 (+internal)" },
    });
    const html = await res.text();
    return { url, status: res.status, html, location: res.headers.get("location") };
  } catch (error) {
    err(`fetch failed ${url}: ${error.message}`);
    return { url, status: 0, html: "", location: null };
  } finally {
    clearTimeout(timer);
  }
}

/* ── Sitemap ── */

async function readSitemap() {
  const res = await fetch(`${BASE}/sitemap.xml`, { headers: { "user-agent": "9bhk-seo-audit/1.0" } });
  if (!res.ok) {
    err(`sitemap.xml returned ${res.status}`);
    return [];
  }
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
}

const PRIVATE_PREFIXES = [
  "/admin", "/auth", "/book", "/host", "/login", "/notifications",
  "/onboarding", "/profile", "/realtor", "/saved", "/search", "/signup",
  "/split", "/trips", "/api",
];

const NOINDEX_ALLOWED = new Set([
  "/search", "/admin", "/host", "/login", "/signup", "/profile", "/saved",
  "/trips", "/book", "/notifications", "/realtor", "/split", "/_not-found",
]);

/* ── Checks ── */

const seen = {
  titles: new Map(),
  descriptions: new Map(),
  h1: new Map(),
  pages: new Map(),
  inbound: new Map(),
};

function isIndexable(pathname) {
  return !NOINDEX_ALLOWED.has(pathname) && !PRIVATE_PREFIXES.some((p) => pathname.startsWith(p));
}

async function auditPage(pathname, { expectIndex = true, sitemap = [] } = {}) {
  const page = await fetchPage(pathname);
  const p = new URL(pathname, BASE).pathname;

  if (page.status >= 400) {
    if (!pathname.includes("__missing__")) err(`${p} → HTTP ${page.status}`);
    return page;
  }
  if (page.status >= 300) {
    note(`${p} → ${page.status} → ${page.location}`);
    return page;
  }

  const title = metaContent(page.html, 'name="title"') ??
    (/<title>([\s\S]*?)<\/title>/i.exec(page.html)?.[1] ?? "").trim();
  const description = metaContent(page.html, 'name="description"');
  const robots = metaContent(page.html, 'name="robots"') ?? "";
  const canonicals = linkRel(page.html, "canonical");
  const ogImage = /<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i.exec(page.html)?.[1] ?? null;
  const headings1 = h1s(page.html);
  const blocks = jsonLdBlocks(page.html);
  const types = nodeTypes(blocks);
  const bodyText = textOf(page.html);
  const isNoindex = /noindex/i.test(robots);

  if (expectIndex && isNoindex && isIndexable(p)) {
    err(`${p} is indexable-by-design but ships noindex`);
  }
  if (!expectIndex && !isNoindex && !NOINDEX_ALLOWED.has(p)) {
    warn(`${p} was expected to be noindex but is not`);
  }

  /* Title */
  if (!title) err(`${p} has no <title>`);
  else if (title.length > 70) warn(`${p} title is ${title.length} chars (>70): "${title}"`);
  else {
    const prior = seen.titles.get(title);
    if (prior) err(`duplicate title on ${p} and ${prior}: "${title}"`);
    else seen.titles.set(title, p);
  }

  /* Description */
  if (isIndexable(p)) {
    if (!description) err(`${p} has no meta description`);
    else {
      if (description.length < 70) warn(`${p} description is only ${description.length} chars`);
      if (description.length > 200) warn(`${p} description is ${description.length} chars (>200)`);
      const prior = seen.descriptions.get(description);
      if (prior) err(`duplicate description on ${p} and ${prior}`);
      else seen.descriptions.set(description, p);
    }
  }

  /* Canonical */
  if (isIndexable(p)) {
    if (!canonicals.length) err(`${p} has no canonical`);
    else if (canonicals.length > 1) err(`${p} has ${canonicals.length} canonicals`);
    else {
      const canonical = canonicals[0];
      const expected = new URL(canonical).pathname.replace(/\/+$/, "") || "/";
      const actual = p.replace(/\/+$/, "") || "/";
      if (expected !== actual) {
        err(`${p} canonicalises to ${expected} (should self-canonicalise to ${actual})`);
      }
    }
  }

  /* Open Graph */
  if (isIndexable(p) && !ogImage) err(`${p} has no og:image`);

  /* H1 */
  if (!headings1.length) err(`${p} has no <h1>`);
  else if (headings1.length > 1) err(`${p} has ${headings1.length} <h1> elements`);
  else {
    const prior = seen.h1.get(headings1[0]);
    if (prior && isIndexable(p) && isIndexable(prior)) {
      err(`duplicate <h1> on ${p} and ${prior}: "${headings1[0]}"`);
    } else {
      seen.h1.set(headings1[0], p);
    }
  }

  /* Heading order: walk the document in order and flag any downward skip. */
  const ordered = [...page.html.matchAll(/<h([1-6])[^>]*>/gi)].map((m) => Number(m[1]));
  let lastLevel = 0;
  for (const level of ordered) {
    if (level > lastLevel + 1) {
      warn(`${p} skips a heading level (h${lastLevel || 0} -> h${level})`);
      break;
    }
    lastLevel = level;
  }

  /* AEO: an FAQ that asks the same question twice with different answers is
         worse than no FAQ — an answer engine has no way to choose. */
  const questions = [...page.html.matchAll(/class="seo-faq-item"[\s\S]*?<summary>[\s\S]*?<span>([^<]*)<\/span>/g)].map((m) =>
    m[1].replace(/\s+/g, " ").trim(),
  );
  const dupQuestions = [...new Set(questions.filter((q, i) => questions.indexOf(q) !== i))];
  if (dupQuestions.length) {
    err(`${p} asks the same FAQ question more than once: ${dupQuestions.join(" | ")}`);
  }
  if (isIndexable(p) && questions.length && !types.has("FAQPage")) {
    warn(`${p} renders an FAQ with no FAQPage schema`);
  }

  /* Breadcrumbs + JSON-LD */
  const TOP_LEVEL = new Set(["/", "/stays", "/locations", "/guides", "/faq", "/about", "/contact"]);
  if (isIndexable(p) && !TOP_LEVEL.has(p)) {
    if (!/<nav[^>]*aria-label="Breadcrumb"/i.test(page.html)) {
      err(`${p} has no breadcrumb navigation`);
    }
    if (!types.has("BreadcrumbList")) err(`${p} has no BreadcrumbList schema`);
  }
  if (!blocks.length) err(`${p} has no JSON-LD`);

  /* Duplicate @id across the page's graphs. Two nodes with the same @id are
     invalid structured data: Google discards the whole graph rather than
     merging them, so a duplicated BreadcrumbList or FAQPage silently costs
     every other node on the page too. */
  const ids = blocks
    .flatMap((block) => (block["@graph"] ?? [block]))
    .map((node) => node["@id"])
    .filter((id) => typeof id === "string");
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (dupes.length) {
    err(`${p} has duplicate JSON-LD @id: ${dupes.map((d) => String(d).replace(/^https?:\/\/[^/]+/, "")).join(", ")}`);
  }
  if (!types.has("Organization") && !types.has("WebSite")) {
    err(`${p} is missing the site entity schema`);
  }

  /* Thin content */
  if (isIndexable(p) && bodyText.length < 1200) {
    warn(`${p} looks thin: ${bodyText.length} characters of text`);
  }

  /* Internal links → inbound counts for orphan detection. */
  const links = [...page.html.matchAll(/<a[^>]+href="(\/[^"#?]*)"/gi)].map((m) => decode(m[1]));
  for (const link of links) {
    const clean = link.replace(/\/+$/, "") || "/";
    seen.inbound.set(clean, (seen.inbound.get(clean) ?? 0) + 1);
  }

  for (const t of types) schemaTypes.add(t);

  seen.pages.set(p, { indexable: isIndexable(p), inSitemap: sitemap.includes(p) });
  return page;
}

/* ── Main ── */

async function main() {
  console.log(`\n9bhk SEO audit → ${BASE}\n${"─".repeat(58)}`);

  /* 1. robots.txt */
  const robots = await fetch(`${BASE}/robots.txt`);
  const robotsText = await robots.text();
  if (!robots.ok) {
    err(`robots.txt → HTTP ${robots.status}`);
  } else {
    for (const need of ["Sitemap:", "Disallow: /admin", "Disallow: /host", "Disallow: /book", "Disallow: /*?*", "Disallow: /dashboard", "Disallow: /checkout"]) {
      if (!robotsText.includes(need)) warn(`robots.txt missing "${need}"`);
    }
    if (/Disallow:\s*\/_next/i.test(robotsText)) err("robots.txt blocks /_next (breaks rendering)");
    if (/Disallow:\s*\/assets/i.test(robotsText)) err("robots.txt blocks /assets (breaks rendering)");
  }

  /* 2. sitemap */
  const sitemap = await readSitemap();
  note(`sitemap: ${sitemap.length} URLs`);
  for (const url of sitemap) {
    const p = new URL(url).pathname;
    for (const prefix of PRIVATE_PREFIXES) {
      if (p === prefix || p.startsWith(`${prefix}/`)) err(`sitemap contains the private URL ${p}`);
    }
    if (p === "/search") err("sitemap contains /search (noindex)");
  }

  /* 3. Representative pages */
  const mustPass = [
    "/",
    "/stays",
    "/farmhouses",
    "/villas",
    "/beach-houses",
    "/locations",
    "/guides",
    "/faq",
    "/about",
    "/contact",
    "/legal/terms",
    "/property/bay-breakers-vault",
    "/property/palm-grove",
    "/guides/ecr-weekend-stays",
    "/locations/ecr",
  ];
  for (const p of mustPass) await auditPage(p, { sitemap });

  /* 4. Every sitemap URL */
  for (const url of sitemap) {
    const p = new URL(url).pathname;
    if (mustPass.includes(p)) continue;
    await auditPage(p, { sitemap });
  }

  /* 5a. The bare catalog view is a real page and must be indexable. */
  const bareSearch = await fetchPage("/search");
  const bareRobots = metaContent(bareSearch.html, 'name="robots"') ?? "";
  if (/noindex/i.test(bareRobots)) {
    err("bare /search is noindex (it is the full catalog view and should be indexable)");
  }
  if (bareSearch.status !== 200) err(`/search → HTTP ${bareSearch.status}`);
  if (!/Search every private stay/i.test(bareSearch.html)) {
    warn("bare /search has no <title> describing the catalog");
  }

  /* 5b. Every filter permutation must be noindex, and meaningful ones must
         consolidate onto a curated landing page. */
  const permutations = [
    ["/search?guests=7&sort=price", null],
    ["/search?q=villa&vibe=Pool&city=ECR", null],
    ["/search?city=ECR", "/locations/ecr"],
    ["/search?setting=Seaside", "/beach-houses"],
  ];
  for (const [p, expectedCanonical] of permutations) {
    const page = await fetchPage(p);
    const robots = metaContent(page.html, 'name="robots"') ?? "";
    if (!/noindex/i.test(robots)) err(`${p} does not send noindex`);
    if (!/follow/i.test(robots)) warn(`${p} does not send follow`);
    if (expectedCanonical) {
      const canonical = linkRel(page.html, "canonical")[0] ?? "";
      if (!canonical.endsWith(expectedCanonical)) {
        err(`${p} canonicalises to "${canonical}", expected ${expectedCanonical}`);
      }
    }
  }

  /* 5c. Genuinely private surfaces. */
  for (const p of ["/login", "/host", "/saved", "/trips", "/book/bay-breakers-vault"]) {
    const page = await fetchPage(p);
    const robots = metaContent(page.html, 'name="robots"') ?? "";
    if (!/noindex/i.test(robots)) err(`${p} does not send noindex`);
    if (!/follow/i.test(robots)) warn(`${p} does not send follow`);
  }

  /* 6. 404 */
  const missing = await fetchPage("/__missing__" + Date.now());
  if (missing.status !== 404) err(`unknown URL returned ${missing.status}, expected 404`);
  if (/noindex/i.test(metaContent(missing.html, 'name="robots"') ?? "") !== true) {
    warn("404 page does not send noindex");
  }

  /* 7. Redirects */
  for (const [from, to] of [
    ["/farmhouse", "/farmhouses"],
    ["/villa", "/villas"],
    ["/beach-house", "/beach-houses"],
  ]) {
    const res = await fetchPage(from);
    if (res.status < 300 || res.status >= 400) err(`${from} does not redirect (${res.status})`);
    else if (!String(res.location).includes(to)) warn(`${from} → ${res.location}, expected ${to}`);
  }

  /* 7b. Programmatic-SEO gates.
         Every URL below must 404. This is the regression test for "do not
         generate thousands of URLs from permutations": a destination with one
         listing gets no page, an unknown segment is never echoed back, and
         there is no occasion or attribute path to crawl into. */
  const MUST_404 = [
    ["/locations/atlantis", "unknown destination"],
    ["/villas/atlantis", "unknown category × destination"],
    ["/farmhouses/atantis", "unknown segment"],
    ["/villas/ooty", "destination below its inventory threshold (1 listing)"],
    ["/beach-houses/kodaikanal", "category × destination below threshold"],
    ["/farmhouses/weekend-getaway", "occasion pages are not published"],
    ["/farmhouses/2-guests/pool/beach", "no attribute permutations"],
    ["/stays/ooty", "no thin collection pages"],
    ["/guides/does-not-exist", "unknown guide"],
    ["/property/does-not-exist", "unknown listing"],
  ];
  for (const [p, why] of MUST_404) {
    const res = await fetchPage(p);
    if (res.status !== 404) err(`${p} should 404 (${why}) but returned ${res.status}`);
  }

  /* 8. Orphan detection */
  const orphans = sitemap
    .map((url) => new URL(url).pathname.replace(/\/+$/, "") || "/")
    .filter((p) => p !== "/" && (seen.inbound.get(p) ?? 0) === 0);
  for (const p of orphans) err(`orphan page (0 internal links pointing at it): ${p}`);

  /* ── Report ── */
  console.log(`\n${"─".repeat(58)}\nChecked ${seen.pages.size} pages.`);
  for (const n of info) console.log(`  · ${n}`);
  console.log(`  · Structured-data types emitted: ${[...schemaTypes].sort().join(", ")}`);
  if (warnings.length) {
    console.log(`\n⚠ ${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  - ${w}`);
  }
  if (errors.length) {
    console.log(`\n✖ ${errors.length} error(s):`);
    for (const e of errors) console.log(`  - ${e}`);
    process.exitCode = 1;
    return;
  }
  console.log("\n✔ No SEO errors.\n");
}

await main();
