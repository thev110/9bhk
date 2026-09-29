/**
 * Key fragment — Client Onboarding (`app/onboarding/page.tsx`).
 *
 * Merged into `lib/i18n/en.ts` by the catalog owner. Values are the exact
 * English strings the component rendered before extraction.
 *
 * Garage-type option labels live under `onboarding.option*` rather than the
 * shared `garage.*` vocabulary, because the onboarding copy carries a
 * qualifier the short shared labels would drop.
 */
export const onboardingKeys = {
  // ── Step 1 — role picker ────────────────────────────────────────────────
  "onboarding.marketplacePill": "Whole Villas, Bungalows & Pool Houses",
  "onboarding.heroTitle": "How will you use 9bhk?",
  "onboarding.heroBody":
    "Select your mandate to personalize your listings, client management, and architectural tools.",
  "onboarding.exploreAsGuest": "Explore as Guest",

  // ── Role cards ──────────────────────────────────────────────────────────
  "onboarding.roleBuyer": "Group Booker or Buyer",
  "onboarding.roleBuyerBody": "Reserve whole villas and bungalows with pools, or buy one outright.",
  "onboarding.roleRealtor": "Licensed Realtor / Broker",
  "onboarding.roleRealtorBody": "Unbranded presentation mode, private client roster, and 1.5%–2% co-broking lock.",
  "onboarding.roleSeller": "Property Owner or Seller",
  "onboarding.roleSellerBody": "List your villa, bungalow or pool house for sale or for curated group stays.",

  // ── Role short names (continue button) ──────────────────────────────────
  "onboarding.roleBuyerShort": "Booker",
  "onboarding.roleRealtorShort": "Realtor",
  "onboarding.roleSellerShort": "Owner",
  "onboarding.continueAs": "Continue as {role}",

  // ── Step 2 — credentials ────────────────────────────────────────────────
  "onboarding.credentialsPill": "Profile & Mandate Credentials",
  "onboarding.titleRealtor": "Agent & Agency Registration",
  "onboarding.titleSeller": "Property Verification Details",
  "onboarding.titleBuyer": "Personalize Your Search",

  // ── Common fields ───────────────────────────────────────────────────────
  "onboarding.fieldPrincipalAgent": "Principal Agent Name",
  "onboarding.fieldFullName": "Full Name",
  "onboarding.namePlaceholder": "e.g. Vikramaditya Chandran",
  "onboarding.fieldPhone": "Direct Contact Phone",

  // ── Realtor fields ──────────────────────────────────────────────────────
  "onboarding.fieldAgency": "Agency / Firm Name",
  "onboarding.agencyPlaceholder": "e.g. Bayview Private Advisory",
  "onboarding.fieldRera": "RERA License ID / Certificate",
  "onboarding.reraHelp": "Enables co-broking attribution and verified agent checkmark.",
  "onboarding.fieldAcquisitionRange": "Typical Client Acquisition Range",
  "onboarding.budgetBoutique": "₹5 Cr – ₹15 Cr (Boutique hill & city homes)",
  "onboarding.budgetSupercar": "₹15 Cr – ₹35 Cr (Large villas with collector garages)",
  "onboarding.budgetSignature": "₹35 Cr – ₹100+ Cr (Signature coastal estates)",

  // ── Buyer fields ────────────────────────────────────────────────────────
  "onboarding.fieldCoastalInterest": "Primary Setting",
  "onboarding.intentBoth": "Both Buying & Private Stays",
  "onboarding.intentBuy": "Direct Property Acquisition (For Sale)",
  "onboarding.intentRent": "Private Group Stays Only",
  "onboarding.fieldAutomotive": "Parking & Garage",

  // ── Seller fields ───────────────────────────────────────────────────────
  "onboarding.fieldFrontage": "Seaside Frontage Linear Feet (if applicable)",
  "onboarding.frontagePlaceholder": "e.g. 150 ft uninterrupted beach",

  // ── Form actions ────────────────────────────────────────────────────────
  "onboarding.back": "Back",
  "onboarding.activating": "Activating Profile…",
  "onboarding.complete": "Complete Onboarding",

  // ── Garage-type options (carried a qualifier the short labels drop) ─────
  "onboarding.optionCollectorVault": "Subterranean Collector's Vault (<7° ramp)",
  "onboarding.optionMarinePort": "Beach & Marine Port (Boat Trailer Slipway)",
  "onboarding.optionEvPavilion": "High-Output EV Pavilion (22kW+ DC)",
  "onboarding.optionTeakPortico": "Open Timber Portico",

  // ── Toasts ─────────────────────────────────────────────────────────────
  "onboarding.toastNeedName": "Please enter your name",
  "onboarding.toastRealtorActivated": "Realtor Workspace activated. RERA credentials recorded.",
  "onboarding.toastSellerWelcome": "Welcome owner. Proceeding to property listing.",
  "onboarding.toastBuyerWelcome": "Welcome to 9bhk.",
} as const;
