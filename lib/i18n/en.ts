import { adminKeys } from "./keys/admin";
import { groupKeys } from "./keys/group";
import { hostKeys } from "./keys/host";
import { legalKeys } from "./keys/legal";
import { onboardingKeys } from "./keys/onboarding";
import { realtorKeys } from "./keys/realtor";

/**
 * English catalog — the single source of truth for every user-facing string.
 *
 * Keys are namespaced by surface (nav.*, auth.*, property.*, ...). The `t()`
 * helper accepts `keyof typeof en`, so a typo or a missing key is a compile
 * error rather than a blank label at runtime.
 *
 * Keys below are grouped inline by area. Larger surfaces keep their keys in
 * lib/i18n/keys/<surface>.ts and are spread in at the bottom, so a single
 * surface stays reviewable on its own.
 *
 * Tamil and Telugu catalogs fall back to these values until translated, so
 * English is always the safety net.
 */
export const en = {
  // ── Shell / navigation ────────────────────────────────────────────────
  "nav.primary": "Primary",
  "nav.explore": "Stays",
  "nav.buy": "Buy",
  "nav.saved": "Wishlists",
  "nav.trips": "Trips",
  "nav.profile": "Profile",
  "nav.back": "Back",
  "nav.menu": "Menu",

  // ── Brand bar ─────────────────────────────────────────────────────────
  "brand.changeLocation": "Change location, currently {city}",

  // ── Accessibility labels ──────────────────────────────────────────────
  "a11y.saveName": "Save {name}",
  "a11y.removeName": "Remove {name}",

  // ── Common actions ────────────────────────────────────────────────────
  "action.save": "Save",
  "action.remove": "Remove",
  "action.cancel": "Cancel",
  "action.confirm": "Confirm",
  "action.continue": "Continue",
  "action.back": "Back",
  "action.close": "Close",
  "action.submit": "Submit",
  "action.retry": "Try again",
  "action.viewAll": "View all",
  "action.seeDetails": "See details",
  "action.edit": "Edit",
  "action.delete": "Delete",
  "action.done": "Done",
  "action.next": "Next",
  "action.previous": "Previous",

  // ── Toasts ────────────────────────────────────────────────────────────
  "toast.saved": "Saved {name}",
  "toast.removed": "Removed {name}",

  // ── Settings (shared vocabulary) ──────────────────────────────────────
  // The values are the English identity tokens from lib/properties.ts; these
  // are display labels only — see lib/i18n/vibes.ts.
  "setting.seaside": "Seaside",
  "setting.hillStation": "Hill Station",
  "setting.city": "In the City",
  "setting.countryside": "Countryside",

  // ── Garage taxonomy (shared vocabulary) ───────────────────────────────
  // Optional on every listing. A villa with no garage simply omits the spec.
  "garage.collectorVault": "Collector Vault",
  "garage.marinePort": "Marine Port",
  "garage.evPavilion": "EV Pavilion",
  "garage.teakPortico": "Teak Portico",

  // ── Property / listing chrome ─────────────────────────────────────────
  "property.forSale": "For Sale",
  "property.sale": "Sale",
  "property.guestFavourite": "Guest favourite",
  "property.estate": "Estate",
  "property.bedroomsShort": "{n} Bedrooms",
  "property.acquisition": "Acquisition: {price}",
  "property.askingPrice": "asking price",
  "property.perNight": "/ night",
  "property.carBay": "{n}-Car Bay",
  "property.supercarReady": "{n}-Car · Supercar Ready",
  "property.carVault": "{n}-Car Vault",
  "property.carPort": "{n}-Car Port",
  "property.vehicles": "{garage} ({n} Vehicles)",
  "property.evKw": "{kw}kW DC",

  // ── Home ──────────────────────────────────────────────────────────────
  "home.greeting.morning": "Good morning",
  "home.greeting.afternoon": "Good afternoon",
  "home.greeting.evening": "Good evening",
  "home.title": "Villas built for gathering",
  "home.subtitle":
    "Whole villas, bungalows and pool houses — seaside, in the hills, in the city or out in the country. Three bedrooms minimum, no hotel rooms.",
  "home.searchPlaceholder": "Search villas, bungalows, hill stations or pools",
  "home.where": "Where",
  "home.when": "When",
  "home.guests": "Guests",
  "home.addDates": "Add dates",
  "home.guestCount": "{n} guests",
  "home.sectionSlowWeekends": "Made for slow weekends",
  "home.sectionVibe": "Pick your setting",
  "home.sectionNearby": "Escapes near you",
  "home.sectionPopular": "Popular group houses",
  "home.seeAll": "See all",
  "home.hostEyebrow": "Own a villa or a bungalow?",
  "home.hostTitle": "List your place for private stays or for sale.",
  "home.listForSale": "List for Sale",
  "home.hostGuests": "Host Guests",
  "home.realtorPortal": "Realtor Portal →",
  "home.whereTitle": "Where to?",
  "home.whenTitle": "When are you going?",
  "home.whenBody": "Pick dates on a farmhouse when you check availability. Minimum stay is 2 nights.",
  "home.browseStays": "Browse available stays",
  "home.anyAgeCounts": "Any age counts here",

  // ── Search / a11y ─────────────────────────────────────────────────────
  "a11y.openCommandPalette": "Open command palette",
  "a11y.commandHint": "Press ⌘K or Ctrl+K to search",
  "a11y.search": "Search",
  "a11y.tripDetails": "Trip details",
  "a11y.fewerGuests": "Fewer guests",
  "a11y.moreGuests": "More guests",
  "a11y.rating": "Rated {rating} out of 5 from {reviews} reviews",

  // ── Roles ─────────────────────────────────────────────────────────────
  "role.buyer": "Group Booker",
  "role.realtor": "Licensed Broker",
  "role.seller": "Estate Owner",
  "role.buyerLong": "Group Booker / Investor",
  "role.realtorLong": "Licensed Realtor / Broker",
  "role.sellerLong": "Villa or Bungalow Owner",

  // ── Auth ──────────────────────────────────────────────────────────────
  "auth.signIn": "Sign in",
  "auth.signOut": "Sign out",
  "auth.createAccount": "Create account",

  // ── Settings ──────────────────────────────────────────────────────────
  "settings.language": "Language",
  "settings.languageSub": "Choose your preferred language",
  "a11y.languageGroup": "Interface language",

  // ── Profile ───────────────────────────────────────────────────────────
  "profile.title": "Profile",
  "profile.signInPrompt": "Sign in to save stays, manage trips and book farmhouses.",
  "profile.explorer": "Explorer",
  "profile.phoneNotAdded": "Phone not added",
  "profile.addPhoneTitle": "Add your phone number",
  "profile.actionNeeded": "Action needed",
  "profile.addPhoneBody":
    "Your Google account is connected, but we need your mobile number to send check-in pin codes and gate directions.",
  "profile.addMobile": "Add mobile number",
  "profile.realtorCard": "Realtor Portal",
  "profile.realtorCardSub": "Client roster & presentation.",
  "profile.sellCard": "List an Estate",
  "profile.sellCardSub": "Rent it out or list for sale.",
  "profile.realtorBrokerPortal": "Realtor & Broker Portal",
  "profile.clientOnboarding": "Client Onboarding",
  "profile.personalDetails": "Personal details",
  "profile.upcomingCount": "{n} upcoming",
  "profile.notifications": "Notifications",
  "profile.privacyTerms": "Privacy, terms and refunds",
  "profile.adminWorkspace": "Admin workspace",
  "profile.staffOnly": "Staff only",
  "profile.fieldFullName": "Full name",
  "profile.fieldEmail": "Email",
  "profile.fieldEmailHelp": "Used for booking updates.",
  "profile.fieldMobile": "Mobile number",
  "profile.fieldRole": "Account Role",
  "profile.fieldAgency": "Agency / Firm Name",
  "profile.agencyPlaceholder": "e.g. Sotheby's Coastal",
  "profile.fieldRera": "RERA License ID",
  "profile.reraPlaceholder": "e.g. TN/AGENT/0491/2023",
  "profile.fieldHomeCity": "Home city",
  "action.saveChanges": "Save changes",
  "toast.signedOut": "Signed out successfully",
  "toast.savedChanges": "Saved changes",

  // ── Saved ─────────────────────────────────────────────────────────────
  "saved.sub": "Saved",
  "saved.emptyTitle": "Nothing saved yet.",
  "saved.emptyBody": "Save places you want to come back to.",
  "saved.emptyBody2": "Tap the heart on any farmhouse and it lands here for your next escape.",
  "saved.explore": "Explore farmhouses",
  "saved.popularNow": "Popular right now",

  // ── Notifications ─────────────────────────────────────────────────────
  "notifications.title": "Notifications",
  "notifications.empty": "You're all caught up.",
  "notifications.emptyBody":
    "Booking confirmations, gate codes, host messages and check-in details will appear here as you book stays.",

  // ── Search ────────────────────────────────────────────────────────────
  "search.title": "Search",
  "search.placeholder": "Search places, areas or farmhouses",
  "a11y.clearSearch": "Clear search",
  "a11y.sortResults": "Sort results",
  "home.anywhere": "Anywhere",
  "search.staysCount": "{n} stays",
  "search.resultCountOne": "{n} stay",
  "search.resultCountMany": "{n} stays",
  "search.sortRecommended": "Recommended",
  "search.sortLow": "Price: low to high",
  "search.sortHigh": "Price: high to low",
  "search.sortRating": "Top rated",
  "search.emptyTitle": "No farmhouses match those filters.",
  "search.emptyBody": "Try widening the search or clearing a filter or two.",
  "search.clearAll": "Clear all filters",
  "search.whenBody":
    "Farmhouses maintain custom availability calendars. Pick your check-in dates directly on any stay page to see live weekend rates and lock in your reservation.",
  "search.viewAllDates": "View all available dates",
  "search.guestsTitle": "Number of guests",
  "search.totalGuests": "Total guests",
  "search.adultsKids": "Adults, kids and visitors",
  "search.applyGuestOne": "Apply {n} guest",
  "search.applyGuestMany": "Apply {n} guests",

  // ── Trips ─────────────────────────────────────────────────────────────
  "trips.title": "Trips",
  "trips.signInPrompt": "Sign in to view your booked farmhouses and trips.",
  "trips.tabUpcoming": "Upcoming",
  "trips.tabPast": "Past",
  "trips.tabCancelled": "Cancelled",
  "trips.emptyUpcoming": "No upcoming trips booked yet.",
  "trips.emptyPast": "Past stays will gather here.",
  "trips.emptyCancelled": "No cancelled trips.",
  "trips.emptyBody":
    "Book a farmhouse getaway and it will appear here with directions and check-in instructions.",
  "trips.viewTrip": "View trip",
  "trips.writeReview": "Write a review",
  "trips.bookAgain": "Book again",
  "trips.sheetTitle": "Your trip",
  "a11y.yourTrip": "Your trip",
  "trips.bookingRef": "Booking #{code}",
  "trips.checkIn": "Check-in",
  "trips.checkOut": "Check-out",
  "trips.guestsAndNights": "{n} guests · {nights} nights",
  "trips.totalPaid": "Total paid",
  "trips.cancellationNote": "Free cancellation until 5 Jun 2026. After that, 50% refund until 10 Jun 2026.",
  "trips.contactHost": "Contact host",
  "trips.getHelp": "Get help",
  "booking.statusConfirmed": "Confirmed",
  "booking.statusAwaiting": "Awaiting host",
  "booking.statusCompleted": "Completed",
  "booking.statusCancelled": "Cancelled",

  // ── 404 ───────────────────────────────────────────────────────────────
  "notFound.title": "Not found",
  "notFound.heading": "This page is not here.",
  "notFound.body": "The link may be old, or the stay may have been removed.",
  "notFound.back": "Back to explore",

  // ── Auth flows ────────────────────────────────────────────────────────
  "auth.welcome": "Welcome",
  "auth.signInToApp": "Sign in to 9bhk",
  "auth.tagline": "Book farmhouses, view trips and save escapes.",
  "auth.continueGoogle": "Continue with Google",
  "auth.googleDisabled": "Google sign-in is not turned on yet. Add the Google client in Supabase first.",
  "auth.signInEmail": "Sign in with email",
  "auth.signInOtp": "Sign in with OTP",
  "auth.fieldEmail": "Email",
  "auth.fieldPassword": "Password",
  "auth.passwordPlaceholder": "Your password",
  "auth.forgotPassword": "Forgot password?",
  "auth.resetSent": "Password reset link sent to your email",
  "auth.signingIn": "Signing you in…",
  "auth.fieldMobile": "Mobile Number",
  "auth.errPhone": "Enter a valid 10-digit mobile number.",
  "auth.errEmail": "Enter a valid email address.",
  "auth.errPassword": "Enter your password to continue.",
  "auth.otpSent": "OTP sent! (Use demo code: 492018)",
  "auth.errOtpShort": "Enter the full 6-digit OTP code.",
  "auth.sendingCode": "Sending code…",
  "auth.getOtp": "Get 6-digit OTP",
  "auth.otpPrompt": "Enter the 6-digit verification code sent to {phone}:",
  "auth.verifying": "Verifying…",
  "auth.verifyAndSignIn": "Verify and sign in",
  "auth.resendOtp": "Resend OTP",
  "auth.newToApp": "New to 9bhk?",
  "auth.heroAltLogin": "A farmhouse veranda opening onto a green garden",
  "auth.heroAltSignup": "A stone cottage with a garden at a farmhouse",
  "toast.signedIn": "Signed in successfully",

  // ── Signup ────────────────────────────────────────────────────────────
  "auth.signupTagline": "Tell us who's escaping. Optional details can wait until your profile.",
  "auth.orSignupEmail": "or sign up with email",
  "auth.namePlaceholder": "Your name",
  "auth.errName": "Please add the name on the booking.",
  "auth.phoneOptional": "Optional",
  "auth.phoneHelp": "Used only to confirm your bookings.",
  "auth.createPasswordPlaceholder": "Create a password",
  "auth.creatingAccount": "Creating your account…",
  "auth.postPermission": "We never post anything without your permission.",
  "auth.alreadyAccount": "Already have an account?",
  "auth.invalidCredentials": "Incorrect email or password.",
  "auth.emailNotConfirmed": "Confirm your email address first, then sign in.",
  "auth.checkInboxToConfirm": "Account created. Check your email to confirm your address.",
  "auth.rateLimited": "Too many attempts. Please wait a moment and try again.",
  "auth.errorGeneric": "Something went wrong. Please try again.",
  "toast.accountCreated": "Account created",

  // ── Command palette ───────────────────────────────────────────────────
  "cmdk.label": "Global Command Palette",
  "cmdk.placeholder": "Search villas, bungalows, settings or pool houses… (ESC)",
  "a11y.closeSearch": "Close search",
  "cmdk.empty": "No villas or commands match that search.",
  "cmdk.groupEstates": "Featured Group Houses",
  "cmdk.groupPortals": "Primary Portals & Actions",
  "cmdk.groupGarage": "Automotive & Garage Architecture",
  "cmdk.groupZone": "Browse by Setting",
  "cmdk.buyMarketplace": "Buy Marketplace (Estates For Sale)",
  "cmdk.realtorPortal": "Realtor & Broker Portal",
  "cmdk.exploreStays": "Explore Group Stays",
  "cmdk.listEstate": "List an Estate (For Sale / Rent)",
  "cmdk.savedSanctuaries": "Saved Sanctuaries",
  "cmdk.myTrips": "My Trips",
  "cmdk.profileSettings": "Profile & Settings",
  "cmdk.adminConsole": "Admin Operations Console",
  "cmdk.collectorVaults": "Subterranean Collector Vaults (Supercar Low-Ramp)",
  "cmdk.marineSlipway": "Beach & Marine Slipway Ports",
  "cmdk.evPavilions": "High-Output EV Pavilions (50kW+ DC)",
  "cmdk.teakPorticos": "Open Timber Porticos",
  "cmdk.estatesAlong": "Stays in {city}",
  "cmdk.tip": "Tip: Press ⌘K or Ctrl+K anytime",

  // ── Booking notifications (generated in the store) ────────────────────
  "note.paymentSentTitle": "Payment sent",
  "note.paymentSentBody": "{property} is waiting for the host to confirm. You'll be notified when the stay is booked.",
  "note.stayBookedTitle": "Stay is booked",
  "note.stayBookedBody": "{property} is confirmed. Check Trips for arrival details.",
  "note.justNow": "Just now",
  "note.yourFarmhouse": "Your farmhouse",

  // ── Buy / acquisitions ────────────────────────────────────────────────
  "buy.hello": "Acquisitions & Estates",
  "buy.title": "Estates For Sale",
  "buy.subtitle":
    "Freehold villas, bungalows and pool houses across the coast, the hills, the city and the countryside — with verified land records.",
  "buy.filterEyebrow": "Setting & Garage Filter",
  "buy.filterAll": "All Estates",
  "buy.filterAnyGarage": "Any Garage",
  "buy.filterSupercar": "Supercar Low-Ramp (<7°)",
  "buy.availableHoldings": "Available Holdings ({n})",
  "buy.corridor": "Coast, Hills, City & Countryside",
  "buy.askingPrice": "Asking Price",
  "buy.garageCars": "{garage} ({n} Cars)",
  "buy.supercarReady": "Supercar Ready",
  "buy.inspectSpecs": "Inspect Specs",
  "buy.scheduleWalkthrough": "Schedule Private Walkthrough",
  "buy.clientSovereignty": "Client Sovereignty",
  "buy.brokerQuestion": "Representing buyers of large group houses?",
  "buy.brokerBody":
    "Onboard your clients to lock in co-broking commission splits, protect private buyer contact information, and enable Presentation Mode with your agency credentials.",
  "buy.openWorkspace": "Open Realtor Workspace",
  "buy.listForSale": "List Your Property For Sale",
  "buy.requestReceived": "Request Received",
  "buy.advisorAssigned": "Confidential advisor assigned.",
  "buy.coordinateBody": "We will coordinate directly with you {withAgency} to schedule an on-site architectural walkthrough.",
  "buy.coordinateAgency": "and your agency",
  "buy.inquiringFor": "Inquiring for {name} ({price}).",
  "buy.fieldBuyerName": "Full Name",
  "buy.namePlaceholder": "Your Name",
  "buy.fieldPhone": "Direct Phone",
  "buy.representingClient": "I am representing a client as a realtor / broker",
  "buy.fieldAgency": "Brokerage / Agency Name",
  "buy.agencyPlaceholder": "e.g. Sotheby's Realty / Knight Frank / Independent RERA",
  "buy.discreet": "Discreet & Direct",
  "buy.submitInquiry": "Submit Acquisition Inquiry",
  "buy.brokerMandate": "Broker Mandate: {agency}",
  "toast.walkthroughRecorded": "Private acquisition walkthrough request recorded.",

  // ── Property detail ───────────────────────────────────────────────────
  // Detail layout is setting-aware: the "Setting & Grounds" block renders for
  // every listing, the shoreline sub-block only for `setting === "seaside"`,
  // and the garage block only when a garage spec exists.
  "detail.estate": "Group House",
  "detail.gone": "This house is no longer listed.",
  "detail.exploreStays": "Explore group stays",
  "detail.presentationMode": "Presentation Mode",
  "detail.presentationSub": "Unbranded client view · direct host info hidden",
  "action.exit": "Exit",
  "toast.exitedPresentation": "Exited Client Presentation Mode",
  "detail.morePhotos": "+ 18 curated architectural photos",
  "property.listedForSale": "Listed for Sale",
  "detail.tideBoundary": "{m}m to the shoreline",
  "detail.acquisitionOpportunity": "Acquisition Opportunity",
  "detail.clearTitle": "Clear Title",
  "detail.estateGround": "Estate Ground",
  "detail.groundAndTitle": "{ground} · Verified Records",
  "detail.scheduleWalkthroughShort": "Schedule Walkthrough",
  "detail.statGuests": "{n} guests capacity",
  "detail.statSuites": "{n} bedrooms",
  "detail.statBeds": "{n} beds",
  "detail.statBaths": "{n} bathrooms",
  "detail.settingTitle": "Setting & Grounds",
  "detail.settingBody":
    "Every 9bhk listing is a whole house you take over for the stay — a villa, bungalow or pool house with at least three bedrooms. No rooms inside a hotel, no shared common areas with strangers.",
  "detail.settingLabel": "Setting",
  "detail.subVerifiedSetting": "Verified listing category",
  "detail.settingDetailLabel": "What you get",
  "detail.landAreaLabel": "Land Area",
  "detail.subNoLandRecord": "Ask host for survey",
  "detail.shorelineTitle": "Shoreline & Privacy Boundary",
  "detail.shorelineBody":
    "This house sits directly on the sand with no public road in between. Boardwalk, gate and dune access are private to the booking.",
  "detail.beachFrontageLabel": "Beach Frontage",
  "detail.subUninterrupted": "Uninterrupted shoreline",
  "detail.highTideLine": "High-Tide Line",
  "detail.meters": "{n} Meters",
  "detail.subDirectOcean": "Direct ocean view",
  "detail.sandAccess": "Sand Access",
  "detail.privateBoardwalk": "Private Boardwalk",
  "detail.subGateToDune": "Direct gate to dune",
  "detail.coastalZone": "Coastal Zone",
  "detail.subVerifiedClearance": "Verified clearance",
  "detail.garageTitle": "Garage & Parking",
  "detail.vehicleCapacity": "{n}-Vehicle Capacity",
  "detail.garageArchitecture": "Garage Architecture",
  "detail.subClimateSealed": "Climate-sealed bays",
  "detail.supercarLowRamp": "Supercar Low-Ramp",
  "detail.rampReady": "Ready (<7° Angle)",
  "detail.standardIncline": "Standard Incline",
  "detail.subZeroScrape": "Zero frame scrape",
  "detail.subSuvCruiser": "SUV & Cruiser",
  "detail.evHighOutput": "EV Charging",
  "detail.kwOutput": "{kw}kW Output",
  "detail.noCharging": "No Charger",
  "detail.subLoadBalancer": "Intelligent load balancer",
  "detail.washdownBay": "Washdown Bay",
  "detail.deionized": "Deionized Fresh Water",
  "detail.standardWash": "Standard Wash",
  "detail.subStripsMist": "Strips salt and monsoon grit",
  "detail.noGarageTitle": "No Garage",
  "detail.noGarageBody":
    "This house has no enclosed garage. Parking is on the drive or in open bays — fine for a weekend, worth asking about if you are travelling with a low car.",
  "detail.aboutTitle": "About this house",
  "detail.amenitiesTitle": "Curated amenities",
  "detail.whereTitle": "Where you'll be",
  "detail.whereBody":
    "Exact coordinates and the gate or lockbox code are shared with you once the stay is confirmed.",
  "detail.covenantsTitle": "House covenants",
  "detail.covenant1": "Check-in from 2:00 PM, caretaker on site",
  "detail.covenant2": "Check-out before 11:00 AM",
  "detail.covenant3": "No parties or events without written host approval",
  "detail.covenant4": "Quiet hours after 11:00 PM across all settings",
  "detail.askingOrStay": "Asking · or ₹{price}/night stay",
  "detail.exclusiveStay": "Whole house, just your group",
  "action.copyLink": "Copy Link",
  "toast.linkCopied": "Unbranded client link copied",
  "action.privateViewing": "Private Viewing",
  "action.reserveStay": "Reserve Stay",
  "detail.arrangeInspection": "Arrange a private on-site inspection for {name} ({setting}).",
  "detail.namePlaceholder": "Your Name",
  "detail.mandateField": "Notes & Timeline (Optional)",
  "detail.mandatePlaceholder": "Number of people travelling, dates, pool or bonfire needs, vehicle requirements...",
  "detail.confidentialDirect": "Confidential & Direct",
  "action.confirmWalkthrough": "Confirm Walkthrough",
  "detail.tourBody":
    "We will contact you directly to arrange an on-site walkthrough and share arrival details.",
  "toast.needNamePhone": "Please provide your name and phone number.",
  "toast.viewingReceived": "Private viewing request received. A confidential advisor will contact you.",

  // ── Vibe / filter vocabulary ───────────────────────────────────────────
  // The values in VIBES and FILTERS (lib/properties.ts) double as search
  // tokens and URL params, so they stay English. These are display labels
  // only — see lib/i18n/vibes.ts.
  "vibe.collectorGarage": "Collector Garage",
  "vibe.evReady": "EV Ready",
  "vibe.pool": "Pool",
  "vibe.largeGroups": "Large Groups",
  "vibe.bonfire": "Bonfire",
  "filter.supercarGarage": "Supercar Garage",

  // ── Per-surface fragments ──────────────────────────────────────────────
  // Each fragment is a plain `as const` object; spreading keeps every key
  // literal so `keyof typeof en` stays a compile-time check.
  ...onboardingKeys,
  ...realtorKeys,
  ...hostKeys,
  ...groupKeys,
  ...adminKeys,
  ...legalKeys,
} as const;

export type DictKey = keyof typeof en;
export type Dict = Record<DictKey, string>;
