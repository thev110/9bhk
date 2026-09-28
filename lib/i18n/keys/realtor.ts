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
  "realtor.statCoastalHoldings": "Coastal Holdings",
  "realtor.statBeachfrontEstates": "Direct beachfront estates",
  "realtor.statCoBrokingFee": "Co-Broking Fee",
  "realtor.statLockedSplit": "Standard locked split",

  // ── Client roster ───────────────────────────────────────────────────────
  "realtor.rosterTitle": "Private Client Roster",
  "realtor.rosterBody": "Clients onboarded here are cryptographically bound to your agency profile.",
  "realtor.onboardClient": "+ Onboard Client",
  "realtor.ndaProtected": "NDA Protected",
  "realtor.labelCorridor": "Corridor:",
  "realtor.labelAutomotiveNeed": "Automotive Need:",
  "realtor.addedOn": "Added on {date}",
  "realtor.presentHoldings": "Present Holdings",
  "realtor.removeClient": "Remove",

  // ── Seller cross-sell ───────────────────────────────────────────────────
  "realtor.sellerPrompt": "Representing a coastal estate seller?",
  "realtor.sellerBody":
    "List your client's beachfront property with verified title documentation, garage specs, and exclusive co-broking visibility.",
  "realtor.listForSale": "List Property for Sale",
  "realtor.viewAllHoldings": "View All Holdings",

  // ── Onboard client sheet ────────────────────────────────────────────────
  "realtor.sheetOnboardTitle": "Onboard Private Client",
  "realtor.sheetBody":
    "Onboarding binds this buyer mandate to your agency ID, safeguarding your co-broking commission across all 9bhk coastal estates.",
  "realtor.fieldClientName": "Client Full Name / Entity Alias",
  "realtor.clientNamePlaceholder": "e.g. Vikramaditya K or Sovereign Family Trust",
  "realtor.fieldPhone": "Direct Phone / WhatsApp",
  "realtor.fieldEmailOptional": "Direct Email (Optional)",
  "realtor.fieldMinBudget": "Min Budget (₹ Cr)",
  "realtor.fieldMaxBudget": "Max Budget (₹ Cr)",
  "realtor.fieldCoastalStretch": "Preferred Coastal Stretch",
  "realtor.fieldGarageNeed": "Automotive & Garage Requirement",

  // ── Garage requirement options ──────────────────────────────────────────
  "realtor.optionCollectorVault": "Subterranean Collector Vault (<7° Supercar Ramp)",
  "realtor.optionMarinePort": "Beach & Marine Port (Jet Ski / Boat Trailer Slip)",
  "realtor.optionEvPavilion": "Executive EV Pavilion (High Output 22-50kW Chargers)",
  "realtor.optionTeakPortico": "Coastal Teak Portico (Shaded Pergola for Cruisers)",

  // ── Mandate footer ──────────────────────────────────────────────────────
  "realtor.enforceNda": "Enforce Buyer NDA & Confidentiality",
  "realtor.fieldMandateNotes": "Mandate Notes & Vehicle Types",
  "realtor.mandateNotesPlaceholder":
    "e.g. Collector of vintage Italian sports cars; requires zero salt mist intrusion...",
  "realtor.leadLockActive": "Lead Lock Active",
  "realtor.completeOnboarding": "Complete Onboarding",

  // ── Toasts ──────────────────────────────────────────────────────────────
  "realtor.toastNeedNamePhone": "Please provide client name and phone number.",
  "realtor.toastClientOnboarded": "Client \"{name}\" onboarded. Commission rights locked.",
  "realtor.toastPresentationOn": "Presentation Mode Activated: Direct owner contacts hidden.",
  "realtor.toastPresentationOff": "Presentation Mode Deactivated.",
  "realtor.toastClientRemoved": "Removed client {name}",
} as const;
