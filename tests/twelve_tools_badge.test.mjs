import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Twelve Tools badge uses the official embed markup and is in both footers", () => {
  const badge = fs.readFileSync("components/seo/twelve-tools-badge.tsx", "utf8");
  assert.match(badge, /<a href="https:\/\/twelve\.tools" target="_blank">/);
  assert.match(badge, /<img src="https:\/\/twelve\.tools\/badge0-white\.svg" alt="Featured on Twelve Tools" width="200" height="54" \/>/);
  for (const file of ["components/seo/site-footer.tsx", "components/seo/home-seo-sections.tsx"]) {
    const src = fs.readFileSync(file, "utf8");
    assert.match(src, /<TwelveToolsBadge \/>/, file);
    assert.doesNotMatch(src, />Featured on Twelve Tools</, `${file}: no visible 'featured' text claim`);
  }
});
