import { en, type Dict } from "./en";
import { teAdmin } from "./te/admin";
import { teCore } from "./te/core";
import { teGroup } from "./te/group";
import { teHost } from "./te/host";
import { teLegal } from "./te/legal";
import { teOnboarding } from "./te/onboarding";
import { teRealtor } from "./te/realtor";

/**
 * Telugu (తెలుగు) catalog.
 *
 * Translations live one file per surface under `lib/i18n/te/` so parallel
 * authoring does not collide and each surface stays reviewable on its own.
 * Anything missing here falls back to `en`, so the UI is never blank — but
 * `npm test` fails on an incomplete catalog, because a partially-English UI is
 * a worse outcome than an untranslated one.
 *
 * Terminology: `lib/i18n/GLOSSARY.md`. Values marked `// REVIEW:` need a
 * native-speaker pass.
 */
export const te: Dict = {
  ...en,
  ...teCore,
  ...teOnboarding,
  ...teRealtor,
  ...teHost,
  ...teGroup,
  ...teAdmin,
  ...teLegal,
};
