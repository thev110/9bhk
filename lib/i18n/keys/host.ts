/**
 * Host surface key fragment — keys for `/host`, `/host/new` and
 * `/host/bookings`. Merged into `lib/i18n/en.ts` by the catalog owner.
 *
 * Only user-facing copy lives here. Route paths, enum-like stored values
 * (`property.type`, `form.amenities`), currency/number formatting and
 * email/phone examples stay inline in the components on purpose.
 */
export const hostKeys = {
  // ── Host workspace ─────────────────────────────────────────────────────
  "host.earnings": "Earnings",
  "host.hosting": "Hosting",
  "host.hostingTools": "Hosting tools",
  "host.switchToGuest": "Switch to guest",
  "host.workspace": "Host workspace",

  // ── Host dashboard ─────────────────────────────────────────────────────
  "host.add": "Add",
  "host.bookings": "Bookings",
  "host.emptyBody": "Add the details once — guests see it in search straight away.",
  "host.emptyTitle": "Ready to host your first escape?",
  "host.fieldUpiId": "UPI ID",
  "host.listYourFarmhouse": "List your farmhouse",
  "host.overviewTitle": "Your hosting at a glance",
  "host.payoutUpi": "Payout UPI",
  "host.payoutUpiBody": "Guests pay this UPI ID when they book. You confirm the stay after the money arrives.",
  "host.resume": "Resume",
  "host.saveUpi": "Save UPI",
  "host.statusDraft": "Draft",
  "host.statusPendingReview": "Pending review",
  "host.statusPublished": "Published",
  "host.untitledFarmhouse": "Untitled farmhouse",
  "host.view": "View",
  "host.yourProperties": "Your properties",

  // ── Host dashboard stats ───────────────────────────────────────────────
  "host.statAcrossFarmhouses": "across 3 farmhouses",
  "host.statLast30": "last 30 days",
  "host.statNextCheckin": "next check-in in 3 days",
  "host.statOccupancy": "Occupancy",
  "host.statThisMonth": "This month",
  "host.statUpcoming": "Upcoming stays",
  "host.statViews": "Views",
  "host.statViewsDelta": "+18% vs last month",

  // ── Listing wizard — progress chrome ───────────────────────────────────
  "host.backToHosting": "Back to hosting",
  "host.newListing": "New listing",
  "host.savedBody": "{name} is saved, including its photos. Guests can see it on Explore.",
  "host.sectionOf": "Step {n} of {total} · {section}",
  "host.submittedTitle": "Submitted for review",
  "host.submitForReview": "Submit for review",

  // ── Listing wizard — step labels ───────────────────────────────────────
  "host.sectionAmenities": "Amenities",
  "host.sectionAvailability": "Availability",
  "host.sectionBasics": "Basics",
  "host.sectionLocation": "Location",
  "host.sectionPhotos": "Photos",
  "host.sectionPreview": "Preview",
  "host.sectionPrice": "Price",
  "host.sectionPublish": "Publish",
  "host.sectionSpace": "Space",

  // ── Listing wizard — step titles ───────────────────────────────────────
  "host.titlePublish": "Ready to publish?",
  "host.titlePhotos": "Add high-res photos",
  "host.titlePreview": "Preview your listing",
  "host.titlePricing": "Set pricing & acquisition terms",
  "host.titleGarage": "Parking, garage & amenities",
  "host.titleBasics": "Tell us about your place",
  "host.titleSpace": "How much space?",
  "host.titleAvailability": "Availability & private access",
  "host.titleSetting": "Where is it, and what kind of place?",

  // ── Listing wizard — basics ────────────────────────────────────────────
  "host.fieldPropertyName": "Property name",
  "host.fieldPropertyType": "Property type",
  "host.fieldShortDescription": "Short description",
  "host.helpShortDescription": "One or two lines. You can expand this later.",
  "host.listForSaleAcquisition": "List for Sale (Acquisition)",
  "host.listForSaleHelp": "Make this property purchasable in the Buy tab",
  "host.maximumGuests": "Maximum guests",
  "host.stepBasics": "The name and short description guests see first.",

  // ── Listing wizard — location & setting ────────────────────────────────
  "host.dragPin": "Drag the pin to your gate",
  "host.fieldArea": "Area or landmark",
  "host.fieldCityOrRegion": "City or region",
  "host.fieldStreetAddress": "Street address",
  "host.helpAddress": "Kept private until a booking is confirmed.",
  "host.stepLocation": "Guests only see the exact pin after booking.",
  "host.fieldSetting": "Setting",
  "host.helpSetting":
    "9bhk houses are whole villas, bungalows and pool houses. Pick wherever yours actually is — the coast, the hills, the city or the countryside.",
  "host.fieldSettingDetail": "One line about the setting",
  "host.settingDetailPlaceholder": "e.g. {setting} — add elevation, frontage or land size",

  // ── Listing wizard — space ─────────────────────────────────────────────
  "host.fieldBathrooms": "Bathrooms",
  "host.fieldBedrooms": "Bedrooms",
  "host.fieldBeds": "Beds",
  "host.stepSpace": "Bedrooms, beds and bathrooms help guests plan the group.",
  "host.minBedroomsNote": "Minimum {n} bedrooms — this is a group house, not a hotel room",
  "host.errMinBedrooms": "9bhk listings need at least {n} bedrooms.",

  // ── Listing wizard — garage & amenities ────────────────────────────────
  "host.beachFrontagePlaceholder": "e.g. 180 ft direct oceanfront",
  "host.curatedAmenities": "Curated Estate Amenities",
  "host.fieldBeachFrontage": "Direct Beach Frontage",
  "host.garageArchitecture": "Garage & Parking (optional)",
  "host.noGarage": "No garage",
  "host.fieldGarageCapacity": "Vehicle capacity",
  "host.qualifierDcFastCharge": "(DC Fast Charge)",
  "host.qualifierJetSkiSlip": "(Jet Ski Slip)",
  "host.qualifierLowRamp": "(<7° Supercar Ramp)",
  "host.qualifierPergola": "(Portico)",
  "host.stepGarage":
    "Beachfront houses can list their frontage. A garage is entirely optional — plenty of good houses have none.",

  // ── Listing wizard — photos ────────────────────────────────────────────
  "host.coverFirstShot": "cover set to the first shot.",
  "host.photosAdded": "{n} photos added",
  "host.stepPhotos": "Upload photos from your phone. They are stored with the listing.",
  "host.uploadPhotos": "Upload photos",
  "host.uploading": "Uploading…",

  // ── Listing wizard — pricing ───────────────────────────────────────────
  "host.acquisitionAsking": "Acquisition asking: {price}",
  "host.acquisitionTerms": "Acquisition Terms",
  "host.askingPricePlaceholder": "e.g. 280000000 (28 Cr)",
  "host.beforeTaxes": "Before taxes",
  "host.cleaningFeeLabel": "Cleaning fee",
  "host.fieldAskingSalePrice": "Asking Sale Price (₹)",
  "host.fieldBaseNightlyPrice": "Base nightly price (₹)",
  "host.fieldCleaningFee": "Cleaning fee (₹)",
  "host.fieldLandArea": "Land / Survey Area",
  "host.fieldSecurityDeposit": "Security deposit (₹) — optional",
  "host.guestPaysTwoNights": "Guest pays for 2 nights",
  "host.helpChargedOnce": "Charged once per stay.",
  "host.helpEnterAskingPrice": "Enter asking price in INR",
  "host.landAreaPlaceholder": "e.g. 4.5 Grounds (10,800 sq.ft)",
  "host.pricingRulesNote": "Seasonal and holiday price overrides are supported later through pricing rules.",
  "host.stepPricing": "Configure nightly stay rates and acquisition terms.",

  // ── Listing wizard — availability ──────────────────────────────────────
  "host.blockDatesBody": "Block dates when the farmhouse is unavailable.",
  "host.calendarBlocked": "Blocked",
  "host.calendarOpen": "Open",
  "host.fieldMinStay": "Minimum stay (nights)",
  "host.nightMany": "{n} nights",
  "host.nightOne": "{n} night",

  // ── Listing wizard — preview ───────────────────────────────────────────
  "host.previewBathrooms": "{n} bathrooms",
  "host.previewBeds": "{n} beds",
  "host.previewBedrooms": "{n} bedrooms",
  "host.previewDescriptionEmpty": "A short description will appear here.",
  "host.previewGuests": "{n} guests",

  // ── Listing wizard — publish ───────────────────────────────────────────
  "host.stepPublish": "Publishing sends this listing to review. You can still edit details after it is approved.",

  // ── Bookings ───────────────────────────────────────────────────────────
  "host.bookingDetails": "Booking details",
  "host.confirmStay": "Confirm stay",
  "host.emptyBookingsBody": "Guest name, email and phone show up here as soon as someone pays on UPI.",
  "host.emptyCancelled": "No cancelled stays yet.",
  "host.emptyPast": "No past stays yet.",
  "host.emptyUpcoming": "No upcoming stays yet.",
  "host.fieldPhone": "Phone",
  "host.manageStays": "Manage your stays",
  "host.manageStaysSub": "Every reservation, calendar block and payout in one place.",
  "host.noEmail": "No email yet",
  "host.noPhone": "No phone yet",
  "host.notAdded": "Not added",
  "host.reference": "Reference",
  "host.statusAwaiting": "Awaiting",
  "host.total": "Total",
  "host.upi": "UPI",
  "host.viewDetails": "View details",

  // ── Bookings — calendar tab ───────────────────────────────────────────
  "host.blockDates": "Block dates",
  "host.blockDatesBodyFull": "Block dates when the farmhouse is unavailable. Guests can't book across blocked nights.",
  "host.calendarAvailable": "Available",
  "host.calendarBooked": "Booked",
  "host.checkinWindow": "Check-in window",
  "host.minimumStay": "Minimum stay",
  "host.tabCalendar": "Calendar",
  "host.tonightsRules": "Tonight's rules",
  "host.weekendPrice": "Weekend price",

  // ── Bookings — earnings tab ────────────────────────────────────────────
  "host.breakdown": "Breakdown",
  "host.cleaningFeesCollected": "Cleaning fees collected",
  "host.downloadStatement": "Download statement",
  "host.earningsDisclaimer": "Amounts come from your payment provider — the prototype shows the shape of the data, not real accounting.",
  "host.earningsSummary": "Across 3 farmhouses · 14 nights booked · ▲ 18%",
  "host.grossBookings": "Gross bookings",
  "host.lastPayout": "last payout 28 Jun 2026",
  "host.netEarnings": "Net earnings",
  "host.netEarningsPeriod": "Net earnings · June 2026",
  "host.paidOut": "Paid out",
  "host.payoutAccount": "Payout account",
  "host.payoutArrives": "arrives 5 Jul 2026",
  "host.payouts": "Payouts",
  "host.pendingPayout": "Pending payout",
  "host.platformFees": "Platform fees (8%)",

  // ── Toasts ─────────────────────────────────────────────────────────────
  "host.toastStayConfirmed": "Stay confirmed. The guest can see it in notifications.",
  "host.toastUpiSaved": "UPI ID saved",

  // ── Validation messages ────────────────────────────────────────────────
  "host.errNameShort": "Add a property name guests will recognise.",
  "host.errPhotoUpload": "Photo upload failed",
  "host.errSaveFailed": "Could not save the listing",
  "host.errDocsNotUploaded": "{n} document(s) could not be uploaded",
  "host.errDocTooLarge": "That file is too large to upload",
  "host.errDocType": "That file type is not supported",
  "host.documentsTitle": "Documents",
  "host.documentsBody": "Upload the documents a reviewer needs to verify this listing.",
  "host.docNone": "No file chosen",
  "host.docReplace": "Replace file",
  "host.docUpload": "Choose file",
} as const;
