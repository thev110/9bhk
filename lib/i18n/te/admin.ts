// Telugu translations for the Admin Operations Console (app/admin/page.tsx).
// Terminology: lib/i18n/GLOSSARY.md
import type { Dict } from "../en";

export const teAdmin = {
  // ── Page chrome ─────────────────────────────────────────────────────────
  "admin.consoleSub": "జాబితాలను సమీక్షించండి, హోస్ట్‌లను ధృవీకరించండి, బుకింగ్‌లను నిర్వహించండి, ఆపరేషన్ టూల్స్‌ను నడపండి.",
  "admin.operationsConsole": "ఆపరేషన్స్ కన్సోల్",
  "admin.pageBarTitle": "అడ్మిన్ ఆపరేషన్స్",
  "admin.restrictedWorkspace": "పరిమితి కార్యక్షేత్రం",
  "admin.staff": "సిబ్బంది",

  // ── Workspace tabs ──────────────────────────────────────────────────────
  "admin.tabBookings": "బుకింగ్‌లు",
  "admin.tabOverview": "అవలోకనం",
  "admin.tabProperties": "ఆస్తులు",
  "admin.tabReviews": "సమీక్షలు",
  "admin.tabUsers": "వినియోగదారులు",
  "admin.tabVerification": "ధృవీకరణ",

  // ── Overview stats ──────────────────────────────────────────────────────
  "admin.accountsDirectory": "ఖాతాల జాబితా",
  "admin.activeStays": "{n} క్రియాశీల ప్రయాణాలు",
  "admin.liveMarketplace": "ప్రత్యక్ష మార్కెట్",
  // REVIEW: "check" (a queued background job) has no distinct Telugu term; mapped to "తనిఖీ", which overlaps "సమీక్ష" (review) and "ధృవీకరణ" (verification) elsewhere in this console.
  "admin.queuedChecks": "క్యూలోలో ఉన్న తనిఖీలు",
  "admin.statBookings": "బుకింగ్‌లు",
  "admin.statProperties": "ఆస్తులు",
  "admin.statUsers": "వినియోగదారులు",
  "admin.statVerification": "ధృవీకరణ",
  "admin.usersActive": "{n} క్రియాశీలం",

  // ── Database status ─────────────────────────────────────────────────────
  "admin.dbActiveTables": "క్రియాశీల పట్టికలు: bhk_properties, bhk_bookings, bhk_profiles, bhk_notifications. అడ్మిన్ స్టేటస్ మార్పులు, ధర నవీకరణలు నేరుగా Supabaseలో నిల్వ అవుతాయి.",
  "admin.dbConnected": "డేటాబేస్ కనెక్ట్ అయింది",
  "admin.dbLocalMode": "లోకల్ మోడ్",
  "admin.dbNoRemote": "ఈ పరిసరంలో రిమోట్ డేటాబేస్ URL కనుగొనబడలేదు. ఆస్తులు, బుకింగ్‌లు, సమీక్షలు లోకల్ స్టేట్‌లో రియాక్టివ్‌గా నిర్వహిస్తాయి.",
  "admin.liveSupabase": "ప్రత్యక్ష Supabase కనెక్షన్",
  "admin.liveSupabaseTable": "Supabase bhk_propertiesకు ప్రత్యక్షంగా కనెక్ట్ అయింది",
  "admin.localMockMode": "లోకల్ మాక్ క్యాటలాగ్ మోడ్",
  "admin.localPrototype": "లోకల్ ప్రొటోటైప్ స్టేట్",
  "admin.syncCatalogToDb": "క్యాటలాగ్‌ను DBకి సింక్ చేయండి",
  "admin.syncToDb": "DBకి సింక్ చేయండి",
  "admin.syncing": "సింక్ అవుతోంది...",

  // ── Management & queues ─────────────────────────────────────────────────
  "admin.bookingsManager": "బుకింగ్ మేనేజర్",
  "admin.checksPending": "{n} తనిఖీలు పెండింగ్‌లో",
  // REVIEW: "farmhouse" labels listed vacation rentals here, not working farms; "ఫార్మ్‌హౌస్" is the literal standard word — confirm it is what staff expect in this console.
  "admin.farmhouseDirectory": "ఫార్మ్‌హౌస్ జాబితా",
  "admin.managementQueues": "నిర్వహణ & క్యూలు",
  "admin.propertyReviews": "ఆస్తి సమీక్షలు",
  "admin.totalCount": "మొత్తం {n}",
  "admin.verificationQueue": "ధృవీకరణ క్యూలు",
  "admin.waitingCount": "పెండింగ్‌లో {n}",

  // ── Operations tools ────────────────────────────────────────────────────
  "admin.exportBookingsCsv": "బుకింగ్‌లు CSV ఎగుమతి",
  "admin.newTestBooking": "కొత్తి టెస్ట్ బుకింగ్",
  "admin.operationsTools": "ఆపరేషన్స్ టూల్స్",
  "admin.refreshCache": "క్యాష్ రిఫ్రెష్ చేయండి",
  "admin.resetDemoQueues": "డెమో క్యూలులను రీసెట్ చేయండి",
  "admin.toolsIntro": "వేగవంతమైన అడ్మిన్ ట్రిగ్గర్లు, సిస్టమ్ యూటిలిటీలు:",

  // ── Activity feed ───────────────────────────────────────────────────────
  "admin.recentActivity": "ఇటీవలి కార్యకలాపం",
  "admin.viewAuditLog": "ఆడిట్ లాగ్‌ను చూడండి",

  // ── Properties tab ──────────────────────────────────────────────────────
  "admin.editRate": "రేట్ సవరించండి",
  "admin.farmhousesDatabase": "ఫార్మ్‌హౌస్‌లు & డేటాబేస్",
  "admin.filterAll": "అన్నీ",
  "admin.filterDraft": "డ్రాఫ్ట్",
  "admin.filterPublished": "ప్రచురించబడింది",
  "admin.newPricePlaceholder": "కొత్తి రాత్రి ధర (₹)",
  "admin.pricePerNight": "₹{amount} / రాత్రి",
  "admin.publishToExplore": "ఎక్స్‌ప్లోర్‌లో ప్రచురించండి",
  "admin.unpublishStay": "ప్రయాణాన్ని ప్రచురించవద్దు",
  "admin.viewStay": "ప్రయాణాన్ని చూడండి",

  // ── Reviews tab ─────────────────────────────────────────────────────────
  "admin.approve": "ఆమోదించండి",
  "admin.fieldAmenities": "సౌకర్యాలు",
  "admin.fieldHost": "హోస్ట్",
  "admin.fieldNightlyPrice": "రాత్రి ధర",
  "admin.inThisBatch": "ఈ బ్యాచ్‌లో {n}",
  "admin.listingRef": "జాబితా #{id}",
  "admin.queueClear": "సమీక్ష క్యూలు ఖాళీగా ఉంది!",
  "admin.queueClearBody": "సమర్పించిన అన్ని ఫార్మ్‌హౌస్‌లు సమీక్ష చేసి నిర్ణయించబడ్డాయి.",
  "admin.reviewQueue": "ఆస్తి సమీక్ష క్యూలు",
  "admin.reloadSampleQueue": "నమూనా క్యూలును మళ్లీ లోడ్ చేయండి",
  "admin.requestChanges": "మార్పులు అడగండి",
  "admin.reject": "తిరస్కరించండి",
  "admin.submittedDocuments": "సమర్పించిన పత్రాలు",

  // ── Review outcome toasts ────────────────────────────────────────────────
  "admin.reviewApprovedPublished": "జాబితా ఆమోదించి ప్రచురించబడింది",
  "admin.reviewChangesRequested": "హోస్ట్ నుండి మార్పులు అడగబడ్డాయి",
  "admin.reviewRejected": "జాబితా తిరస్కరించబడింది",

  // ── Users tab ───────────────────────────────────────────────────────────
  "admin.listingsCount": "{n} జాబితాలు",
  "admin.noFlags": "ఫ్లాగ్‌లు ఏవీ లేవు",
  "admin.reactivate": "మళ్లీ క్రియాతీర్వచేయండి",
  "admin.suspend": "నిలిపివేయండి",
  "admin.syncUsers": "వినియోగదారులను సింక్ చేయండి",
  "admin.tripsCount": "{n} ప్రయాణాలు",
  "admin.userHostDirectory": "వినియోగదారి & హోస్ట్ జాబితా",
  "admin.viewRecord": "రికార్డ్‌ను చూడండి",

  // ── Bookings tab ────────────────────────────────────────────────────────
  "admin.approveStay": "ప్రయాణాన్ని ఆమోదించండి",
  "admin.dateRange": "{from} నుండి {to} వరకు",
  "admin.exportCsv": "CSV ఎగుమతి",
  "admin.guestNamed": "అతిథి {name}",
  "admin.issueRefund": "రిఫండ్ జారీ చేయండి",
  "admin.upiReference": "యుపిఐ సూచన: {ref}",
  "admin.viewDetails": "వివరాలు చూడండి",

  // ── Verification tab ────────────────────────────────────────────────────
  "admin.hostVerification": "హోస్ట్ ధృవీకరణ",
  "admin.hostVerifiedBtn": "హోస్ట్ ధృవీకరించబడ్డారు",
  "admin.identityVerification": "గుర్తింపు & ఆస్తి ధృవీకరణ",
  "admin.markVerified": "ధృవీకరించబడిందిగా గుర్తించండి",
  "admin.propertyVerification": "ఆస్తి ధృవీకరణ",
  "admin.requestInfo": "సమాచారం అడగండి",
  "admin.verifyHost": "హోస్ట్ ధృవీకరించండి",

  // ── Status, role & document labels ──────────────────────────────────────
  "admin.docGovernmentId": "ప్రభుత్వ గుర్తింపు కార్డు",
  "admin.docHostId": "హోస్ట్ గుర్తింపు కార్డు",
  "admin.docOwnershipProof": "ఆధారాల ధృవీకరణ",
  "admin.docPayoutAccount": "ఆదాయ ఖాతా",
  "admin.docPhoneEmail": "ఫోన్ + ఇమెయిల్",
  "admin.docTaxReceipt": "ఆస్తి పన్ను రసీదు",
  "admin.roleFlagged": "ఫ్లాగ్ చేయబడింది",
  "admin.roleGuest": "అతిథి",
  "admin.roleHost": "హోస్ట్",
  "admin.roleHostPending": "హోస్ట్ · పెండింగ్‌లో",
  "admin.roleHostVerified": "హోస్ట్ · ధృవీకరించబడ్డారు",
  "admin.stateActive": "క్రియాశీలం",
  "admin.stateDraft": "డ్రాఫ్ట్",
  "admin.stateDocsInReview": "పత్రాలు సమీక్షలో",
  "admin.stateMissing": "తప్పించబడింది",
  "admin.stateMissingDocs": "పత్రాలు తప్పించబడ్డాయి",
  "admin.statePending": "పెండింగ్‌లో",
  "admin.statePublished": "ప్రచురించబడింది",
  "admin.stateSuspended": "నిలిపివేయబడింది",
  "admin.stateVerified": "ధృవీకరించబడింది",

  // ── User record sheet ───────────────────────────────────────────────────
  "admin.a11yUserRecord": "వినియోగదారి రికార్డ్",
  "admin.fieldListings": "జాబితాలు",
  "admin.fieldPhone": "ఫోన్",
  "admin.reactivateAccount": "ఖాతాను మళ్లీ క్రియాతీర్వచేయండి",
  "admin.suspendAccount": "ఖాతాను నిలిపివేయండి",

  // ── Booking record sheet ────────────────────────────────────────────────
  "admin.a11yBookingRecord": "బుకింగ్ రికార్డ్",
  "admin.fieldDates": "తేదీలు",
  "admin.fieldGuestEmail": "అతిథి ఇమెయిల్",
  "admin.fieldGuestName": "అతిథి పేరు",
  "admin.fieldGuestPhone": "అతిథి ఫోన్",
  "admin.fieldProperty": "ఆస్తి",
  "admin.fieldTotal": "మొత్తం",
  "admin.fieldUpiRef": "యుపిఐ సూచన",
  "admin.pendingHostCheck": "హోస్ట్ తనిఖీ పెండింగ్‌లో",

  // ── Audit log sheet ─────────────────────────────────────────────────────
  "admin.a11yAuditLog": "ఆడిట్ లాగ్",
  "admin.auditActor": "సిబ్బంది: admin@9bhk.app",
  "admin.auditLog": "అడ్మిన్ ఆడిట్ లాగ్",
  "admin.auditLogBody": "అన్ని నిర్వహణ, ఆపరేషన్ లెక్కలను సిబ్బంది గుర్తింపుతో నమోదు చేస్తారు.",

  // ── Toasts ──────────────────────────────────────────────────────────────
  "admin.toastBookingConfirmed": "అతిథి కోసం బుకింగ్ #{code} నిర్ధారించబడింది",
  "admin.toastCacheRefreshed": "క్యాటలాగ్ & సర్వర్ క్యాష్ రిఫ్రెష్ అయింది",
  "admin.toastDocReminder": "పత్రం అప్‌లోడ్ గుర్తు {name}కు పంపబడింది",
  "admin.toastErrPrice": "సరైన ధర మొత్తాన్ని నమోదు చేయండి",
  "admin.toastExported": "బుకింగ్‌లు CSVకి ఎగుమతి అయ్యాయి",
  "admin.toastHostVerified": "హోస్ట్ {name} ధృవీకరించబడ్డారు — ప్రాప్యత ఇవ్వబడింది",
  "admin.toastNoSupabase": "ప్రస్తుత పరిసరంలో Supabase ఎన్విరాన్‌మెంట్ వేరియబుల్స్ కాన్ఫిగర్ చేయబడలేదు",
  "admin.toastOwnershipRequest": "ఆధారం పత్రం అభ్యర్థన {name}కు పంపబడింది",
  "admin.toastPriceUpdated": "రాత్రి రేట్ ₹{amount}కు నవీకరించబడింది",
  "admin.toastPropertyVerified": "{name} ధృవీకరించబడి ప్రచురికకు సిద్ధంగా ఉంది",
  "admin.toastQueuesRestored": "సమీక్ష క్యూలులు నమూనా స్టేట్‌కు తిరిగి స్థాపించబడ్డాయి",
  "admin.toastRefundIssued": "బుకింగ్ #{code}కు రిఫండ్ జారీ అయింది",
  "admin.toastStatusNow": "{name} ఇప్పుడు {status}",
  "admin.toastSyncFailed": "సింక్ విఫలమైంది: {message}",
  "admin.toastSynced": "అన్ని ఫార్మ్‌హౌస్‌లు Supabase డేటాబేస్‌కు సింక్ అయ్యాయి!",
  "admin.toastTestBooking": "టెస్ట్ బుకింగ్ #{code} సృష్టించబడింది!",
  "admin.toastUserReactivated": "{name} మళ్లీ క్రియాతీర్వమయ్యారు",
  "admin.toastUserSuspended": "{name} నిలిపివేయబడ్డారు",
  "admin.toastUsersSynced": "వినియోగదారుల జాబితా Supabase Auth తో సింక్ అయింది",

  // ── Activity log entries ────────────────────────────────────────────────
  "admin.logApproved": "ఆమోదించబడింది",
  "admin.logBookingApproved": "బుకింగ్ #{code} మాన్యువల్‌గా ఆమోదించబడింది",
  "admin.logBulkSynced": "క్యాటలాగ్ బ్యుల్క్‌గా Supabase (bhk_properties)కు సింక్ చేయబడింది",
  "admin.logCacheFlushed": "సిస్టమ్ క్యాటలాగ్ క్యాష్ క్లియర్ చేయబడింది",
  "admin.logChangesRequested": "మార్పులు అడగబడ్డాయి",
  "admin.logDeedRequested": "{name} కోసం హోస్ట్ నుండి ఆధారం అభ్యర్థించబడింది",
  "admin.logDocsRequested": "{name} నుండి పత్రాలు అడగబడ్డాయి",
  "admin.logExported": "బుకింగ్‌లు నివేదిక CSV ఎగుమతి చేయబడింది",
  "admin.logHostVerified": "హోస్ట్ {name} ధృవీకరించబడ్డారు",
  "admin.logPriceUpdated": "{name} రాత్రి రేట్ ₹{amount}కు నవీకరించబడింది",
  "admin.logPropertyVerification": "ఆస్తి {name} ధృవీకరణ పూర్తయింది",
  "admin.logQueuesReset": "నమూనా సమీక్ష క్యూలు రీసెట్ అయింది",
  "admin.logRefundIssued": "₹{amount} రిఫండ్ #{code}కు జారీ అయింది",
  "admin.logRejected": "తిరస్కరించబడింది",
  "admin.logStatusUpdated": "ఆస్తి {name} స్టేటస్ {status}కు నవీకరించబడింది",
  "admin.logTestBooking": "టెస్ట్ బుకింగ్ #{code} జనరించబడింది",
  "admin.logUserStatus": "వినియోగదారి {name} స్టేటస్ {status}కు సెట్ అయ్యింది",
} as const satisfies Partial<Dict>;
