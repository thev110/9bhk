import { en, type Dict } from "./en";
import { taAdmin } from "./ta/admin";
import { taCore } from "./ta/core";
import { taGroup } from "./ta/group";
import { taHost } from "./ta/host";
import { taLegal } from "./ta/legal";
import { taOnboarding } from "./ta/onboarding";
import { taRealtor } from "./ta/realtor";

/**
 * Tamil (தமிழ்) catalog.
 *
 * Translations live one file per surface under `lib/i18n/ta/` so parallel
 * authoring does not collide and each surface stays reviewable on its own.
 * Anything missing here falls back to `en`, so the UI is never blank — but
 * `npm test` fails on an incomplete catalog, because a partially-English UI is
 * a worse outcome than an untranslated one.
 *
 * Terminology: `lib/i18n/GLOSSARY.md`. Values marked `// REVIEW:` need a
 * native-speaker pass.
 */
export const ta: Dict = {
  ...en,
  ...taCore,
  ...taOnboarding,
  ...taRealtor,
  ...taHost,
  ...taGroup,
  ...taAdmin,
  ...taLegal,
};
