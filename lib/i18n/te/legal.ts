// Telugu translations for the /legal page titles, OTP field and PWA install banner.
// Terminology: lib/i18n/GLOSSARY.md
//
// Scope note: the long-form legal body copy is lawyer-reviewed English prose and
// is deliberately not in `lib/i18n/keys/legal.ts`. Only titles, nav labels and
// the install prompt are translated here.
import type { Dict } from "../en";

export const teLegal = {
  // ── Legal documents ───────────────────────────────────────────────────
  "legal.cookies": "కుకీలు",
  "legal.cookiesTitle": "కుకీల విధానం",
  "legal.privacy": "గోప్యత",
  "legal.privacyTitle": "గోప్యతా విధానం",
  "legal.refunds": "రిఫండులు",
  "legal.refundsTitle": "రిఫండు విధానం",
  "legal.terms": "నిబంధనలు",
  "legal.termsTitle": "సేవా నిబంధనలు",

  // ── OTP field ─────────────────────────────────────────────────────────
  "a11y.otpGroup": "ఒకసారి పాస్‌వర్డ్ ధృవీకరణ కోడ్",

  // ── PWA install banner ────────────────────────────────────────────────
  "pwa.androidBody": "వేగవంతమైన బుకింగ్‌లు, సంపూర్ణ స్క్రీన్ ప్రయాణాల కోసం హోమ్ స్క్రీన్‌కు జోడించండి.",
  "pwa.bannerTitle": "9bhk యాప్‌ను ఇన్‌స్టాల్ చేయండి",
  "pwa.dismissAction": "తెలిసింది",
  "pwa.dismissLabel": "యాప్ ఇన్‌స్టాల్ బ్యానర్‌ను మూసివేయండి",
  "pwa.installLabel": "యాప్‌ను ఇన్‌స్టాల్ చేయండి",
  "pwa.iosBody": "పూర్తి యాప్ అనుభవం కోసం షేర్ > 'హోమ్ స్క్రీన్‌కు జోడించు' నొక్కండి.",
  "pwa.stepsAddToHome": "హోమ్ స్క్రీన్‌కు జోడించు",
  "pwa.stepsShare": "షేర్",
  "pwa.stepsTap": "నొక్కండి",
} as const satisfies Partial<Dict>;
