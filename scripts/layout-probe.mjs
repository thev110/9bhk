/**
 * Layout probe.
 *
 * Drives a headless Chrome over the DevTools Protocol to find horizontal
 * overflow — the failure mode where a page renders wider than its own column
 * and text is clipped at the right edge on a phone.
 *
 * Reports, per viewport:
 *   • `document.scrollWidth` vs the viewport width
 *   • every element whose right edge extends past the app column
 *   • every element with a width above the app column
 *
 * The app shell is a 430px column, so anything whose right edge sits past it
 * is escaping — either a long unbreakable string, a fixed width, or a flex/grid
 * item that refused to shrink.
 *
 * Usage:
 *   node scripts/layout-probe.mjs                       # localhost:3000
 *   BASE_URL=https://www.9bhk.app node scripts/layout-probe.mjs
 *
 * Chrome is launched on a free port and closed automatically. Nothing is
 * installed: it speaks CDP over Node's built-in WebSocket.
 */

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const PORT = Number(process.env.CDP_PORT || 9333);
const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

/** Widths worth testing: small phone, large phone, tablet, desktop. */
const VIEWPORTS = [
  { name: "phone-360", width: 360, height: 780, mobile: true },
  { name: "phone-390", width: 390, height: 844, mobile: true },
  { name: "phone-430", width: 430, height: 932, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, mobile: false },
  { name: "desktop-1440", width: 1440, height: 900, mobile: false },
];

const PAGES = [
  "/",
  "/stays",
  "/farmhouses",
  "/beach-houses/ecr",
  "/locations/ecr",
  "/locations",
  "/guides",
  "/guides/ecr-weekend-stays",
  "/faq",
  "/about",
  "/contact",
  "/buy",
  "/search",
  "/property/bay-breakers-vault",
  "/legal/terms",
];

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (existsSync(p)) return p;
  }
  return null;
}

async function waitForDevtools(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return await res.json();
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Chrome DevTools endpoint did not come up");
}

/** Minimal CDP client over the built-in WebSocket. */
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      const entry = this.pending.get(msg.id);
      if (entry) {
        this.pending.delete(msg.id);
        if (msg.error) entry.reject(new Error(msg.error.message));
        else entry.resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`${method} timed out`));
        }
      }, 30000);
    });
  }
  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || "evaluate threw");
    }
    return res.result.value;
  }
}

/**
 * Runs in the page. Finds anything escaping the app column or the viewport.
 * Runs in the browser, so the result is real layout, not a static guess.
 */
const PROBE = `(() => {
  const app = document.querySelector('.app');
  const appRight = app ? app.getBoundingClientRect().right : 0;
  const appLeft = app ? app.getBoundingClientRect().left : 0;
  const vw = document.documentElement.clientWidth;
  const offenders = [];
  const seen = new Set();

  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    // An element that scrolls its own overflow is not escaping the page.
    if (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflowX === 'hidden' || style.overflowX === 'clip') continue;

    /*
     * Skip anything mounted directly on <body>. Those are page shells and
     * portal targets — sonner's toast region is a bare <section> that spans
     * the viewport by design — and they are not column content, so "escaped
     * the app column" does not apply to them. Genuine document overflow on
     * these is still caught, by \`pageOverflows\` below.
     */
    if (el.parentElement === document.body) continue;

    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;

    const pastViewport = r.right > vw + 1;
    const pastApp = app && r.right > appRight + 1;
    if (!pastViewport && !pastApp) continue;

    /*
     * Skip anything living inside a horizontal scroller. The listing rail is
     * exactly this case: .rail has overflow-x:auto, each card is wrapped in an
     * <article>, so checking only the immediate parent reported every card in
     * a deliberately peekable rail as an overflow.
     */
    let ancestor = el.parentElement;
    let inScroller = false;
    let widerAncestor = false;
    while (ancestor && ancestor !== document.body) {
      const as = getComputedStyle(ancestor);
      if (as.overflowX === 'auto' || as.overflowX === 'scroll' || as.overflowX === 'hidden' || as.overflowX === 'clip') {
        inScroller = true;
        break;
      }
      if (ancestor.getBoundingClientRect().right > r.right + 1) widerAncestor = true;
      ancestor = ancestor.parentElement;
    }
    if (inScroller || widerAncestor) continue;

    const key = el.tagName + '.' + (el.className || '').toString().split(' ')[0];
    if (seen.has(key)) continue;
    seen.add(key);

    offenders.push({
      selector: el.tagName.toLowerCase() + (el.className ? '.' + el.className.toString().trim().split(/\\s+/).join('.') : ''),
      tag: el.tagName.toLowerCase(),
      classes: (el.className || '').toString().slice(0, 60),
      width: Math.round(r.width),
      right: Math.round(r.right),
      overflowBy: Math.round(Math.max(r.right - vw, r.right - appRight)),
      pastViewport,
      pastApp,
      text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 70),
      scrollW: el.scrollWidth,
      clientW: el.clientWidth,
      /* The chain that produced the width, so the report names the cause
         instead of just the symptom. */
      chain: (() => {
        const out = [];
        let n = el;
        while (n && n !== document.body && out.length < 8) {
          const s = getComputedStyle(n);
          const b = n.getBoundingClientRect();
          out.push(
            n.tagName.toLowerCase() +
              (n.className ? '.' + n.className.toString().trim().split(/\\s+/).slice(0, 2).join('.') : '') +
              ' w=' + Math.round(b.width) +
              ' ox=' + s.overflowX +
              ' disp=' + s.display,
          );
          n = n.parentElement;
        }
        return out;
      })(),
    });
  }

  return {
    viewportWidth: vw,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    appLeft: Math.round(appLeft),
    appRight: Math.round(appRight),
    appWidth: app ? Math.round(app.getBoundingClientRect().width) : 0,
    pageOverflows: document.documentElement.scrollWidth > vw + 1,
    /* Direct children of <body>, including portal targets. An offender whose
       chain is one link long is mounted here, which is how a Radix portal or a
       toast layer gets found without guessing. */
    bodyChildren: Array.from(document.body.children).map((n) => {
      const s = getComputedStyle(n);
      const b = n.getBoundingClientRect();
      return (
        n.tagName.toLowerCase() +
        (n.className ? '.' + n.className.toString().trim().split(/\\s+/).slice(0, 2).join('.') : '') +
        ' w=' + Math.round(b.width) +
        ' ox=' + s.overflowX +
        ' pos=' + s.position
      );
    }),
    offenders: offenders.slice(0, 25),
  };
})()`;

/**
 * Runs in the page. Asserts the three specific layout contracts this script
 * exists to protect, so a regression names itself instead of needing a human
 * to compare screenshots.
 */
const ASSERT = `(() => {
  const fails = [];
  const px = (v) => parseFloat(v) || 0;
  const vw = document.documentElement.clientWidth;

  /*
   * 1. Every primary-nav link must be inside the viewport. The nav used to be
   *    a flex item that would not shrink below its 612px content, which pushed
   *    "Destinations", "Guides" and "For sale" off-screen on a phone with no
   *    scrollbar to reach them.
   */
  const nav = document.querySelector('.seo-header nav');
  if (nav) {
    const links = Array.from(nav.querySelectorAll('a'));
    const hidden = links.filter((a) => a.getBoundingClientRect().right > document.documentElement.clientWidth + 1);
    if (hidden.length) {
      fails.push(
        'primary nav: ' + hidden.length + '/' + links.length + ' links off-screen → ' +
          hidden.map((a) => a.textContent.trim()).join(', '),
      );
    }
    /* The header is sticky. Once the nav wraps to three rows it eats ~160px of
       a 780px phone, so cap the whole header rather than only checking that the
       links are on screen. */
    const header = document.querySelector('.seo-header');
    const headerH = header ? Math.round(header.getBoundingClientRect().height) : 0;
    if (headerH > 150) fails.push('.seo-header is ' + headerH + 'px tall on a ' + vw + 'px viewport (max 150)');
  }

  /*
   * 2. The homepage editorial layer must carry the app shell's gutter. It set
   *    only margin-top and padding-bottom, so its cards and FAQ rows ran flush
   *    against both edges of the column.
   */
  const homeSeo = document.querySelector('.home-seo');
  if (homeSeo) {
    const s = getComputedStyle(homeSeo);
    const pad = Math.min(px(s.paddingLeft), px(s.paddingRight));
    if (pad < 12) fails.push('.home-seo gutter is ' + pad + 'px, expected >= 12px');
  }

  /*
   * 3. The listing rail must fade its right edge. A 280px card cannot fit twice
   *    in a 430px column, so the rail always ends on a fragment; the fade is
   *    what stops that fragment reading as a clipped layout.
   */
  const rail = document.querySelector('.rail');
  if (rail) {
    const s = getComputedStyle(rail);
    const mask = s.maskImage || s.webkitMaskImage || 'none';
    if (mask === 'none' || mask === '') fails.push('.rail has no right-edge mask');
  }

  return fails;
})()`;

async function main() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error("No Chrome or Edge found. Set CHROME_PATH and re-run.");
    process.exitCode = 1;
    return;
  }

  const profile = mkdtempSync(join(tmpdir(), "9bhk-probe-"));
  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--disable-extensions",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let ws;
  let totalProblems = 0;

  try {
    await waitForDevtools(PORT);
    const target = await (
      await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })
    ).json();

    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve);
      ws.addEventListener("error", () => reject(new Error("CDP socket failed")));
    });

    const cdp = new Cdp(ws);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });

    for (const vp of VIEWPORTS) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile,
      });

      console.log(`\n── ${vp.name} (${vp.width}px) ${"─".repeat(44)}`);

      /* Optional: also write full-page PNGs, for judging a change by eye rather
         than by assertion. PROBE_SHOTS=<dir> node scripts/layout-probe.mjs */
      const shotDir = process.env.PROBE_SHOTS;
      const shotPages = shotDir ? (process.env.PROBE_SHOT_PAGES || "/,/stays").split(",") : [];

      for (const path of PAGES) {
        await cdp.send("Page.navigate", { url: `${BASE}${path}` });
        /* Wait for load, then let fonts and images settle so the measurement
           reflects the final layout rather than a mid-load one. */
        await new Promise((r) => setTimeout(r, path === "/" ? 1400 : 700));

        if (shotDir && shotPages.includes(path)) {
          /*
           * PROBE_SHOT_AT=".home-seo" screenshots that element's own box rather
           * than a fixed region, so a long page can be inspected one block at a
           * time at 1:1 instead of as an unreadable full-page thumbnail.
           * PROBE_SHOT_CLIP="x,y,w,h" is the manual alternative.
           */
          let params = { format: "png", captureBeyondViewport: !process.env.PROBE_SHOT_CLIP };
          const clipSpec = process.env.PROBE_SHOT_CLIP;
          if (clipSpec) {
            const [x, y, width, height] = clipSpec.split(",").map(Number);
            params.clip = { x, y, width, height, scale: 1 };
          } else if (process.env.PROBE_SHOT_AT) {
            const box = await cdp.evaluate(
              `(() => { const e = document.querySelector(${JSON.stringify(process.env.PROBE_SHOT_AT)});
                if (!e) return null; const r = e.getBoundingClientRect();
                return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`,
            );
            if (box) {
              params.clip = {
                x: box.x,
                y: box.y,
                width: box.width,
                height: Math.min(box.height, 1400),
                scale: 1,
              };
            }
          }
          const shot = await cdp.send("Page.captureScreenshot", params);
          mkdirSync(shotDir, { recursive: true });
          const name =
            (path === "/" ? "home" : path.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "")) +
            `--${vp.name}.png`;
          writeFileSync(join(shotDir, name), Buffer.from(shot.data, "base64"));
          console.log(`  shot ${join(shotDir, name)}`);
        }

        const result = await cdp.evaluate(PROBE);
        const problems = result.offenders.filter((o) => o.overflowBy > 1);
        const assertions = await cdp.evaluate(ASSERT);
        const flag = result.pageOverflows || problems.length || assertions.length ? "✖" : "✔";

        if (!problems.length && !result.pageOverflows && !assertions.length) {
          console.log(`${flag} ${path.padEnd(30)} scrollW ${result.documentScrollWidth} · app ${result.appWidth}px @${result.appLeft}–${result.appRight}`);
        } else {
          totalProblems += 1;
          console.log(
            `${flag} ${path.padEnd(30)} scrollW ${result.documentScrollWidth} vs viewport ${result.viewportWidth}` +
              (result.pageOverflows ? "  PAGE OVERFLOWS" : ""),
          );
          for (const a of assertions) console.log(`      ! ${a}`);
          if (process.env.PROBE_DUMP_BODY) {
            for (const c of result.bodyChildren) console.log(`      body ▸ ${c}`);
          }
          for (const o of problems) {
            console.log(`      +${o.overflowBy}px  ${o.selector}`);
            console.log(`             w=${o.width} scrollW=${o.scrollW} clientW=${o.clientW}  "${o.text}"`);
            for (const link of o.chain) console.log(`             ↑ ${link}`);
          }
        }
      }
    }

    console.log(
      totalProblems === 0
        ? `\n✔ No horizontal overflow at any tested viewport.\n`
        : `\n✖ ${totalProblems} viewport/page combinations overflow.\n`,
    );
    if (totalProblems) process.exitCode = 1;
  } finally {
    try {
      ws?.close();
    } catch {
      /* already closed */
    }
    chrome.kill();
    await new Promise((r) => setTimeout(r, 300));
    rmSync(profile, { recursive: true, force: true });
  }
}

await main();
