import fs from "node:fs";
import path from "node:path";

/* Detect import cycles reachable from the homepage.
   A client-component import that resolves to `undefined` at render time is
   almost always a cycle, so this runs in CI alongside the other checks. */
const roots = ["app", "components", "lib"];
const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (/\.tsx?$/.test(e.name)) files.push(full);
  }
};
roots.forEach(walk);

function resolve(from, spec) {
  if (!spec.startsWith("@/") && !spec.startsWith(".")) return null;
  const base = spec.startsWith("@/") ? spec.slice(2) : path.join(path.dirname(from), spec);
  for (const ext of [".tsx", ".ts", "/index.tsx", "/index.ts"]) {
    if (fs.existsSync(base + ext)) return base + ext;
  }
  return null;
}

const graph = new Map();
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const deps = [];
  /*
   * Only value imports create a runtime edge. `import type { X } from "./y"`
   * is erased at compile time, so counting it reports a cycle that does not
   * exist in the emitted graph — which is exactly the false positive
   * `lib/supabase/sync.ts` -> `lib/store.tsx` (type-only) used to produce.
   */
  for (const m of src.matchAll(/^\s*import\s+(?!type\b)([^;]*?)\s+from\s+["']([^"']+)["']/gms)) {
    const r = resolve(file, m[2]);
    if (r) deps.push(path.resolve(r));
  }
  graph.set(path.resolve(file), deps);
}

const targets = [
  "app/page.tsx",
  "components/home-experience.tsx",
  "components/home-tab-bar.tsx",
  "components/property-experience.tsx",
  "components/search-experience.tsx",
].map((p) => path.resolve(p));

const found = [];
const state = new Map();
const stack = [];
function dfs(node) {
  if (state.get(node) === "done") return;
  if (state.get(node) === "open") {
    const i = stack.indexOf(node);
    found.push(stack.slice(i).concat(node).map((p) => path.relative(process.cwd(), p)));
    return;
  }
  state.set(node, "open");
  stack.push(node);
  for (const d of graph.get(node) ?? []) dfs(d);
  stack.pop();
  state.set(node, "done");
}
for (const t of targets) dfs(t);

if (found.length) {
  console.log("CYCLES reachable from a page entry point:");
  for (const c of found.slice(0, 8)) console.log("  " + c.join(" -> "));
  process.exitCode = 1;
} else {
  console.log(`No import cycles reachable from any page entry point. (${files.length} modules scanned)`);
}
