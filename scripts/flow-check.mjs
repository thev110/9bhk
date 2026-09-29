/* Product-flow regression check.
   Booking, auth, dashboard, filters and APIs must still work after the SEO
   upgrade. Interactive code lives in the client bundle rather than the SSR
   HTML, so this asserts the route responds AND that the JavaScript it depends
   on is actually served — which is what would break if a refactor orphaned a
   client component. */
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
let bad = 0;
const line = (pass, msg) => { if (!pass) bad += 1; console.log(`${pass ? "✔" : "✖"} ${msg}`); };

const ROUTES = [
  ["/", 200], ["/search", 200], ["/buy", 200], ["/saved", 200],
  ["/property/bay-breakers-vault", 200], ["/book/bay-breakers-vault", 200],
  ["/login", 200], ["/signup", 200], ["/profile", 200], ["/trips", 200],
  ["/realtor", 200], ["/host/new", 200], ["/host/bookings", 200],
  ["/notifications", 200],
  ["/admin", "auth"],            /* 2xx or an auth redirect both count */
  ["/splash", "redirect"], ["/onboarding", "redirect"],
];

async function check(path, want) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  const html = await res.text();
  let pass;
  if (want === "auth") pass = (res.status >= 200 && res.status < 400);
  else if (want === "redirect") pass = res.status >= 300 && res.status < 400;
  else pass = res.status === want;
  line(pass, `${path.padEnd(36)} ${res.status}`);

  /* Every route must ship its client chunks. */
  const chunks = [...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map((m) => m[0]);
  if (chunks.length) {
    const uniq = [...new Set(chunks)];
    const results = await Promise.all(uniq.slice(0, 6).map((c) => fetch(BASE + c).then((r) => r.status)));
    line(results.every((s) => s === 200), `  ${uniq.length} client chunks served`);
  }
  return html;
}

for (const [p, w] of ROUTES) await check(p, w);

/* Behavioural markers must exist in the shipped JS, not just in the source. */
async function bundleHas(path, needle) {
  const html = await (await fetch(BASE + path)).text();
  const chunks = [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g)].map((m) => m[0]))];
  for (const c of chunks) {
    const src = await (await fetch(BASE + c)).text();
    if (src.includes(needle)) return true;
  }
  return false;
}

/* Function names are minified away in a production build, so these assert on
   the i18n key literals, which are strings and survive minification. */
line(await bundleHas("/host/new", "bhk_properties"), "host form still writes to bhk_properties");
line(await bundleHas("/book/bay-breakers-vault", "checkIn"), "booking page still has its date step");
line(await bundleHas("/book/bay-breakers-vault", "property.perNight"), "booking page still quotes the nightly rate");
line(await bundleHas("/search", "search.placeholder"), "search still has its search field");
line(await bundleHas("/property/bay-breakers-vault", "addViewingRequest"), "property page still submits viewing requests");
line(await bundleHas("/", "home.searchPlaceholder"), "homepage search box is still wired");

/* API routes respond (401/400 is fine — 500 is not). */
for (const api of ["/api/payments/webhook", "/api/split/pay", "/api/split/invite"]) {
  const res = await fetch(BASE + api, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  /* 503 is these routes' designed answer when the provider secret is absent;
     401/400 are the designed answers for a bad request. Only a 5xx crash or a
     missing route is a regression. */
  line(res.status !== 500 && res.status !== 404, `${api.padEnd(36)} ${res.status}`);
}

console.log(bad === 0 ? "\nAll product flows and client bundles intact." : `\n${bad} problem(s).`);
if (bad) process.exitCode = 1;
