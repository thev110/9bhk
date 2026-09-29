/**
 * Key fragment — Realtor Portal (`app/realtor/page.tsx`).
 *
 * Merged into `lib/i18n/en.ts` by the catalog owner. Values are the exact
 * English strings the component rendered before extraction.
 */
export const realtorKeys = {
  // ── Portal chrome ───────────────────────────────────────────────────────
  "realtor.portalTitle": "Realtor Portal",
  "realtor.workspaceEyebrow": "Broker & Agency Workspace",
  "realtor.reraVerified": "RERA Verified",
  "realtor.mandatesTitle": "Client Onboarding & Mandates",
  "realtor.agencyRera": " · RERA #{rera}",

  // ── Presentation mode ───────────────────────────────────────────────────
  "realtor.presentationMode": "Presentation Mode",
  "realtor.presentationActive": "Presentation Active",
  "realtor.presentationDisable": "Disable",
  "realtor.presentationLive": "Client Presentation Mode is Live",
  "realtor.presentationLiveBody":
    "Direct host contacts and internal margins are masked. When you present listings to your client, your agency credentials will appear.",

  // ── Stat tiles ──────────────────────────────────────────────────────────
  "realtor.statOnboardedClients": "Onboarded Clients",
  "realtor.statLeadLock": "Lead lock guaranteed",
  "realtor.statActiveMandates": "Active Mandates",
  "realtor.statTotalBuyingPower": "Total buying power",
  "realtor.statCoastalHoldings": "Estates",
  "realtor.statBeachfrontEstates": "Villas & bungalows, all settings",
  "realtor.statCoBrokingFee": "Co-Broking Fee",
  "realtor.statLockedSplit": "Standard locked split",

  // ── Client roster ───────────────────────────────────────────────────────
  "realtor.rosterTitle": "Private Client Roster",
  "realtor.rosterBody": "Clients onboarded here are cryptographically bound to your agency profile.",
  "realtor.onboardClient": "+ Onboard Client",
  "realtor.ndaProtected": "NDA Protected",
  "realtor.labelCorridor": "Preferred area:",
  "realtor.labelAutomotiveNeed": "Parking / garage need:",
  "realtor.addedOn": "Added on {date}",
  "realtor.presentHoldings": "Present Holdings",
  "realtor.removeClient": "Remove",

  // ── Seller cross-sell ───────────────────────────────────────────────────
  "realtor.sellerPrompt": "Representing a villa or bungalow seller?",
  "realtor.sellerBody":
    "List your client's property with verified title documentation, garage specs, and exclusive co-broking visibility.",
  "realtor.listForSale": "List Property for Sale",
  "realtor.viewAllHoldings": "View All Holdings",

  // ── Onboard client sheet ────────────────────────────────────────────────
  "realtor.sheetOnboardTitle": "Onboard Private Client",
  "realtor.sheetBody":
    "Onboarding binds this buyer mandate to your agency ID, safeguarding your co-broking commission across all 9bhk listings.",
  "realtor.fieldClientName": "Client Full Name / Entity Alias",
  "realtor.clientNamePlaceholder": "e.g. Vikramaditya K or Sovereign Family Trust",
  "realtor.fieldPhone": "Direct Phone / WhatsApp",
  "realtor.fieldEmailOptional": "Direct Email (Optional)",
  "realtor.fieldMinBudget": "Min Budget (₹ Cr)",
  "realtor.fieldMaxBudget": "Max Budget (₹ Cr)",
  "realtor.fieldCoastalStretch": "Preferred Area",
  "realtor.fieldGarageNeed": "Parking & Garage Requirement",

  // ── Garage requirement options ──────────────────────────────────────────
  "realtor.optionCollectorVault": "Subterranean Collector Vault (<7° Supercar Ramp)",
  "realtor.optionMarinePort": "Beach & Marine Port (Jet Ski / Boat Trailer Slip)",
  "realtor.optionEvPavilion": "Executive EV Pavilion (High Output 22-50kW Chargers)",
  "realtor.optionTeakPortico": "Teak Portico (Shaded Pergola for Cruisers)",

  // ── Mandate footer ──────────────────────────────────────────────────────
  "realtor.enforceNda": "Enforce Buyer NDA & Confidentiality",
  "realtor.fieldMandateNotes": "Mandate Notes & Requirements",
  "realtor.mandateNotesPlaceholder":
    "e.g. Group of ten for a long weekend; needs a pool, bonfire lawn and covered parking for four cars...",
  "realtor.leadLockActive": "Lead Lock Active",
  "realtor.completeOnboarding": "Complete Onboarding",

  // ── Toasts ──────────────────────────────────────────────────────────────
  "realtor.toastNeedNamePhone": "Please provide client name and phone number.",
  "realtor.toastClientOnboarded": "Client \"{name}\" onboarded. Commission rights locked.",
  "realtor.toastPresentationOn": "Presentation Mode Activated: Direct owner contacts hidden.",
  "realtor.toastPresentationOff": "Presentation Mode Deactivated.",
  "realtor.toastClientRemoved": "Removed client {name}",
} as const;
