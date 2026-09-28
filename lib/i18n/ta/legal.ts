// Tamil translations for the /legal page titles, OTP field and PWA install banner.
// Terminology: lib/i18n/GLOSSARY.md
//
// Scope note: the long-form legal body copy is lawyer-reviewed English prose and
// is deliberately not in `lib/i18n/keys/legal.ts`. Only titles, nav labels and
// the install prompt are translated here.
import type { Dict } from "../en";

export const taLegal = {
  // ── Legal documents ───────────────────────────────────────────────────
  "legal.cookies": "குக்கீகள்",
  "legal.cookiesTitle": "குக்கீ கொள்கை",
  "legal.privacy": "தனியுரிமை",
  "legal.privacyTitle": "தனியுரிமைக் கொள்கை",
  "legal.refunds": "திரும்பப் பணங்கள்",
  "legal.refundsTitle": "திரும்பப் பணக் கொள்கை",
  "legal.terms": "விதிமுறைகள்",
  "legal.termsTitle": "சேவை விதிமுறைகள்",

  // ── OTP field ─────────────────────────────────────────────────────────
  "a11y.otpGroup": "ஒருமுறை கடவுச்சொல் சரிபார்ப்புக் குறியீடு",

  // ── PWA install banner ────────────────────────────────────────────────
  "pwa.androidBody": "விரைவான முன்பதிவுகளுக்கும் முழுத்திரைப் பயணங்களுக்கும் முகப்புத் திரையில் சேர்க்கவும்.",
  "pwa.bannerTitle": "9bhk செயலியை நிறுவவும்",
  "pwa.dismissAction": "புரிந்தது",
  "pwa.dismissLabel": "செயலி நிறுவும் அறிவிப்பை மூடவும்",
  "pwa.installLabel": "செயலியை நிறுவு",
  "pwa.iosBody": "முழுமையான செயலி அனுபவத்திற்கு, பகிர் > 'முகப்புத் திரையில் சேர்' என்பதைத் தட்டவும்.",
  "pwa.stepsAddToHome": "முகப்புத் திரையில் சேர்",
  "pwa.stepsShare": "பகிர்",
  "pwa.stepsTap": "தட்டவும்",
} as const satisfies Partial<Dict>;
