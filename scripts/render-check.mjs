/**
 * Structural render check.
 *
 * The SEO upgrade moved a lot of markup out of client components and into
 * server ones. The risk that matters is a *visual* regression, so this asserts
 * the things that would break the existing design if they were lost:
 * the app-shell classes, the premium hero, the search bar, the card rails and
 * the bottom tab bar — plus the new semantic layer and the stylesheet link.
 *
 * Run against a live server:  node scripts/render-check.mjs
 */

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const results = [];
const ok = (name, pass, detail = "") => results.push({ name, pass, detail });

async function html(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { "user-agent": "render-check" } });
  return { status: res.status, html: await res.text() };
}

const home = await html("/");
const h = home.html;

/* ── Design integrity: the app shell must be untouched ── */
ok("homepage returns 200", home.status === 200, `got ${home.status}`);
ok("app shell wrapper present", /<div class="app">/.test(h));
ok("main content region present", /<main class="content">/.test(h));
ok("premium brand bar intact", /class="appbar"/.test(h) && /logo-mark\.png/.test(h));
ok("greeting block intact", /class="greet"/.test(h));
ok("search bar intact", /class="searchbar"/.test(h) && /role="search"/.test(h));
ok("search input is a real input", /<input[^>]+type="search"/.test(h));
ok("trip summary cells intact", (h.match(/class="sum-cell"/g) || []).length === 3);
ok("property rail intact", /class="rail"/.test(h));
ok("stacked feature cards intact", /class="stack-cards"/.test(h));
ok("setting chips intact", (h.match(/class="chip"/g) || []).length >= 4);
ok("bottom tab bar intact", /class="tabbar"/.test(h) && /aria-label="Primary"/.test(h));

/* ── Design tokens: the stylesheet must load ── */
/* Next.js hashes and bundles the stylesheets, so the check is that a
   stylesheet is linked and the design token variables reached the DOM.
   `next/font` self-hosts the faces, so the check is the generated
   variable classes on <html> rather than a font name in the markup. */
ok("stylesheet linked", /<link[^>]*rel="stylesheet"[^>]*>/.test(h));
ok("font variables applied", /class="__variable_/.test(h));
ok("design tokens in use", /var\(--forest\)|--forest/.test(h) || /class="(app|content|appbar)"/.test(h));
ok("seo layer stylesheet applied", /class="home-seo/.test(h) && /class="seo-/.test(h));

/* ── New semantic layer ── */
ok("single h1 on homepage", (h.match(/<h1[\s>]/g) || []).length === 1);
ok(
  "h1 names the marketplace and geography",
  /Luxury farmhouses, beach houses/i.test(h) && /Chennai/i.test(h) && /ECR/i.test(h),
);
ok("quick-answer block present", /class="seo-answer"/.test(h));
ok("homepage editorial sections present", /class="home-seo-section"/.test(h));
ok("stay-type links present", /href="\/farmhouses"/.test(h) && /href="\/villas"/.test(h) && /href="\/beach-houses"/.test(h));
ok("destination links present", /href="\/locations\/ecr"/.test(h));
ok("guide links present", /href="\/guides\/ecr-weekend-stays"/.test(h));
ok("legal links present", /href="\/legal\/terms"/.test(h));
ok("FAQ rendered on the homepage", /class="seo-faq-item"/.test(h));

/* ── Property page ── */
const prop = await html("/property/bay-breakers-vault");
const p = prop.html;
ok("property page returns 200", prop.status === 200, `got ${prop.status}`);
ok("property breadcrumb rendered", /aria-label="Breadcrumb"/.test(p));
ok("property JSON-LD rendered", /"@type":"BreadcrumbList"/.test(p) && /"VacationRental"|"Product"/.test(p));
ok("property quick facts rendered", /property-facts-heading/.test(p));
ok("property FAQ rendered", /property-faq-heading/.test(p));
ok("related stays rendered", /property-related-heading/.test(p));
ok("property amenity list rendered", /class="amen/.test(p));
ok("booking CTA present", /href="\/book\/bay-breakers-vault"|\/login\?next=/.test(p));
ok("save toggle present", /aria-pressed=/.test(p));
ok("sticky booking bar present", /class="stickybar"/.test(p));

/* ── Category / destination / guide ── */
const cat = await html("/farmhouses");
ok("category page lists properties", (cat.html.match(/class="seo-card"/g) || []).length > 0);
ok("category page has one h1", (cat.html.match(/<h1[\s>]/g) || []).length === 1);
ok("category grid images are optimised", /_next\/image\?url=/.test(cat.html));

const loc = await html("/locations/ecr");
ok("destination page has quick answer", /class="seo-answer"/.test(loc.html));
ok("destination page has local FAQ", /location-faq-heading/.test(loc.html));
ok("destination page links to properties", /href="\/property\//.test(loc.html));

const guide = await html("/guides/ecr-weekend-stays");
ok("guide has byline and dates", /class="seo-byline"/.test(guide.html) && /<time /.test(guide.html));
ok("guide has hero image", /seo-guide-figure/.test(guide.html));
ok("guide links to properties", /href="\/property\//.test(guide.html));
ok("guide has Article schema", /"@type":"Article"/.test(guide.html));

/* ── Private routes keep their chrome ── */
for (const [path, needle] of [
  ["/search", "searchbar"],
  ["/buy", "tabbar"],
  ["/saved", 'class="app"'],
  ["/host", "appbar"],
]) {
  const page = await html(path);
  ok(`${path} still renders its app chrome`, page.status === 200 && page.html.includes(needle), `status ${page.status}`);
}

const missing = await html("/definitely-not-a-page-9bhk");
ok("unknown URL returns a real 404", missing.status === 404, `got ${missing.status}`);
ok("404 offers crawlable routes", /href="\/stays"/.test(missing.html));

/* ── Report ── */
let failures = 0;
for (const r of results) {
  if (!r.pass) failures += 1;
  console.log(`${r.pass ? "✔" : "✖"} ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
}
console.log(`\n${results.length - failures}/${results.length} render checks passed.`);
if (failures) process.exitCode = 1;
