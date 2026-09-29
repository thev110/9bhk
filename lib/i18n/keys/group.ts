/**
 * Group-stay key fragment — keys for the date calendar, celebration capacity
 * and Split Pay surfaces.
 *
 * These three hang together: dates decide whether a house is free, celebration
 * capacity decides whether it can take the booking at all, and Split Pay
 * decides how the group funds it.
 *
 * As elsewhere, stored values (`property.celebration`, garage type slugs,
 * status enums) stay English because they are matched against data and put in
 * URLs. Only display copy lives here.
 */
export const groupKeys = {
  // ── Date calendar / availability ───────────────────────────────────────
  "calendar.checkIn": "Check-in",
  "calendar.checkOut": "Check-out",
  "calendar.apply": "Apply dates",
  "calendar.clear": "Clear dates",
  "calendar.body":
    "Pick a check-in and check-out. Nights the host has already booked or blocked are greyed out.",
  "calendar.unavailable": "Not available",
  "calendar.nightsOne": "{n} night",
  "calendar.nightsMany": "{n} nights",
  "calendar.nights": "Nights",
  "calendar.availableCount": "{n} stays free for these dates",

  // ── Celebration capacity ───────────────────────────────────────────────
  // A celebration booking turns on specs a bedroom count does not carry: a DJ
  // rig needs sanctioned load, and a sangeet needs a curfew that permits it.
  "celebration.filter": "Celebration Ready",
  "celebration.sectionTitle": "Celebration capacity",
  "celebration.capacityValue": "Up to {n} guests",
  "celebration.powerValue": "{kw} kW sanctioned load",
  "celebration.curfewValue": "Amplified sound until {hour}:00",
  "celebration.parkingValue": "{n} event parking spaces",
  "celebration.generatorValue": "{kw} kW backup generator",
  "celebration.catererYes": "Outside caterers welcome",
  "celebration.catererNo": "In-house kitchen only",
  "celebration.wizardTitle": "Celebrations",
  "celebration.wizardBody":
    "Tell guests whether this house can host a function, reunion or sangeet. Power load, sound curfew and parking are what actually decide it.",
  "celebration.toggle": "This house can host celebrations",
  "celebration.toggleHelp":
    "Turn this on only if events are genuinely permitted at the property.",
  "celebration.fieldCapacity": "Maximum event guests",
  "celebration.fieldPower": "Sanctioned load (kW)",
  "celebration.fieldCurfew": "Sound curfew (24h)",
  "celebration.fieldParking": "Event parking spaces",
  "celebration.fieldGenerator": "Generator (kW)",
  "celebration.fieldCatering": "Catering",

  // ── Split Pay ──────────────────────────────────────────────────────────
  "split.title": "Split the bill",
  "split.roster": "Who's coming?",
  "split.rosterPlaceholder": "Names, separated by commas",
  "split.body":
    "Send every guest their share. The host is paid once the group is fully funded and the stay has begun.",
  "split.shareOf": "{name}'s share",
  "split.sendInvite": "Send invite",
  "split.inviteFailed": "Couldn't create the invite link",

  // ── Guest invite page (/split/<token>) ─────────────────────────────────
  "split.inviteTitle": "You're invited to split a stay",
  "split.inviteBody": "{organiser} booked {property}. Your share is {amount}.",
  "split.yourShare": "Your share",
  "split.stayDates": "Stay dates",
  "split.payShare": "Pay your share",
  "split.paying": "Opening checkout…",
  "split.paymentReceived": "Payment received. We're confirming it now.",
  "split.invalidLink": "This invite link isn't valid",
  "split.invalidLinkBody": "Invite links expire. Ask the organiser to send a fresh one.",
  "split.notLive": "Payments aren't live yet",
  "split.notLiveBody":
    "This deployment has no payment keys configured, so this share can't be paid yet.",

  "split.collected": "Collected",
  "split.outstanding": "Still to collect",
  "split.paid": "Paid",
  "split.pending": "Waiting",
  "split.markPaid": "Mark as paid",
  "split.copyLink": "Copy invite link",
  "split.funded": "The group is fully funded",
  "split.progress": "{n} of {m} paid",
  "split.payoutReady": "Payout released to the host",
  "split.payoutTooEarly": "Payout releases on check-in day",
  "split.payoutUnfunded": "Waiting on {n} guests",
  "split.toastInvite": "Invite link copied",
  "split.toastPaid": "{name} marked as paid",
} as const;
