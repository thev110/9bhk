// lib/i18n/keys/legal.ts
//
// Key fragment for the /legal pages, the OTP field and the PWA install banner.
// Merge these into `en` in lib/i18n/en.ts.
//
// Note: the long-form legal body copy is deliberately NOT in this fragment. It
// is lawyer-reviewed prose and needs a proper translation pass, so it stays
// English in place until that review happens.

export const legalKeys = {
  // ── Legal documents ───────────────────────────────────────────────────
  "legal.cookies": "Cookies",
  "legal.cookiesTitle": "Cookie policy",
  "legal.privacy": "Privacy",
  "legal.privacyTitle": "Privacy policy",
  "legal.refunds": "Refunds",
  "legal.refundsTitle": "Refund policy",
  "legal.terms": "Terms",
  "legal.termsTitle": "Terms of service",

  // ── OTP field ─────────────────────────────────────────────────────────
  "a11y.otpGroup": "One time password verification code",

  // ── PWA install banner ────────────────────────────────────────────────
  "pwa.androidBody": "Add to home screen for fast bookings and full-screen stays.",
  "pwa.bannerTitle": "Install 9bhk app",
  "pwa.dismissAction": "Got it",
  "pwa.dismissLabel": "Dismiss app install banner",
  "pwa.installLabel": "Install app",
  "pwa.iosBody": "Tap Share > 'Add to Home Screen' for the full app experience.",
  "pwa.stepsAddToHome": "Add to Home Screen",
  "pwa.stepsShare": "Share",
  "pwa.stepsTap": "Tap",
} as const;
