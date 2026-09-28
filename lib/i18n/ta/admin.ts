// Tamil translations for the Admin Operations Console (app/admin/page.tsx).
// Terminology: lib/i18n/GLOSSARY.md
import type { Dict } from "../en";

export const taAdmin = {
  // ── Page chrome ─────────────────────────────────────────────────────────
  "admin.consoleSub": "பட்டியல்களை ஆய்வு செய்யவும், வழங்குபவர்களைச் சரிபார்க்கவும், முன்பதிவுகளை நிர்வகிக்கவும், செயல்பாடுக் கருவிகளை இயக்கவும்.",
  "admin.operationsConsole": "செயல்பாடுக் கட்டுப்பாட்டுப் பலகை",
  "admin.pageBarTitle": "நிர்வாகச் செயல்பாடுகள்",
  "admin.restrictedWorkspace": "கட்டுப்படுத்தப்பட்ட பணியிடம்",
  "admin.staff": "பணியாளர்கள்",

  // ── Workspace tabs ──────────────────────────────────────────────────────
  "admin.tabBookings": "முன்பதிவுகள்",
  "admin.tabOverview": "மேலோட்டம்",
  "admin.tabProperties": "சொத்துகள்",
  "admin.tabReviews": "ஆய்வுகள்",
  "admin.tabUsers": "பயனர்கள்",
  "admin.tabVerification": "சரிபார்ப்பு",

  // ── Overview stats ──────────────────────────────────────────────────────
  "admin.accountsDirectory": "கணக்குகள் பட்டியல்",
  "admin.activeStays": "{n} செயல்படும் பயணங்கள்",
  "admin.liveMarketplace": "நேரடை சந்தை",
  // REVIEW: "check" (a queued background job) has no distinct Tamil term; mapped to "சரிபார்ப்பு", which overlaps "ஆய்வு" (review) and "சரிபார்ப்பு" elsewhere in this console.
  "admin.queuedChecks": "நிருவரியில் உள்ள சரிபார்ப்புகள்",
  "admin.statBookings": "முன்பதிவுகள்",
  "admin.statProperties": "சொத்துகள்",
  "admin.statUsers": "பயனர்கள்",
  "admin.statVerification": "சரிபார்ப்பு",
  "admin.usersActive": "{n} செயல்பாட்டில்",

  // ── Database status ─────────────────────────────────────────────────────
  "admin.dbActiveTables": "செயல்படும் அட்டவணைகள்: bhk_properties, bhk_bookings, bhk_profiles, bhk_notifications. நிர்வாக நிலை மாற்றங்களும் விலை புதுப்பிப்புகளும் நேரடியாக Supabase-இல் சேமிக்கப்படுகின்றன.",
  "admin.dbConnected": "தரவுத்தளம் இணைக்கப்பட்டது",
  "admin.dbLocalMode": "உள்ளூர் முறை",
  "admin.dbNoRemote": "இந்த சூழலில் ரிமோட் தரவுத்தள URL கண்டறியப்படவில்லை. சொத்துகள், முன்பதிவுகள், ஆய்வுகள் உள்ளூர் நிலையில் திருப்பிச் செயல்பாட்டில் நிர்வகிக்கப்படுகின்றன.",
  "admin.liveSupabase": "நேரடை Supabase இணைப்பு",
  "admin.liveSupabaseTable": "Supabase bhk_properties-க்கு நேரடியாக இணைக்கப்பட்டுள்ளது",
  "admin.localMockMode": "உள்ளூர் மாதிரி கேட்டளை முறை",
  "admin.localPrototype": "உள்ளூர் முன்நோட்ட நிலை",
  "admin.syncCatalogToDb": "கேட்டளையை DB-க்கு ஒத்திசைவுசெய்",
  "admin.syncToDb": "DB-க்கு ஒத்திசைவுசெய்",
  "admin.syncing": "ஒத்திசைவாகிறது...",

  // ── Management & queues ─────────────────────────────────────────────────
  "admin.bookingsManager": "முன்பதிவு மேலாண்மை",
  "admin.checksPending": "{n} சரிபார்ப்புகள் நிலுவையில்",
  // REVIEW: "farmhouse" labels listed vacation rentals here, not working farms; "பண்ணைவீடு" is the literal standard word — confirm it is what staff expect in this console.
  "admin.farmhouseDirectory": "பண்ணைவீடு பட்டியல்",
  "admin.managementQueues": "நிர்வாகம் & நிருவரிகள்",
  "admin.propertyReviews": "சொத்து ஆய்வுகள்",
  "admin.totalCount": "மொத்தம் {n}",
  "admin.verificationQueue": "சரிபார்ப்பு நிருவரி",
  "admin.waitingCount": "நிலுவையில் {n}",

  // ── Operations tools ────────────────────────────────────────────────────
  "admin.exportBookingsCsv": "முன்பதிவுகள் CSV ஏற்றுமதி",
  "admin.newTestBooking": "புதிய சோதனை முன்பதிவு",
  "admin.operationsTools": "செயல்பாடுக் கருவிகள்",
  "admin.refreshCache": "கேஷ் புதுப்பி",
  "admin.resetDemoQueues": "டெமோ நிருவரிகளை மீட்டமை",
  "admin.toolsIntro": "விரைவான நிர்வாகத் தூண்டிகள் மற்றும் கணினி உதவிக் கருவிகள்:",

  // ── Activity feed ───────────────────────────────────────────────────────
  "admin.recentActivity": "சமீபத்திய செயல்பாடு",
  "admin.viewAuditLog": "ஆய்வுப் பதிவைப் பார்க்கவும்",

  // ── Properties tab ──────────────────────────────────────────────────────
  "admin.editRate": "விலை மாற்று",
  "admin.farmhousesDatabase": "பண்ணைவீடுகள் & தரவுத்தளம்",
  "admin.filterAll": "அனைத்தும்",
  "admin.filterDraft": "வரைவு",
  "admin.filterPublished": "வெளியிடப்பட்டது",
  "admin.newPricePlaceholder": "புதிய இரவு விலை (₹)",
  "admin.pricePerNight": "₹{amount} / இரவு",
  "admin.publishToExplore": "எக்ஸ்ப்ளோரில் வெளியிடவும்",
  "admin.unpublishStay": "பயணத்தை வெளியிடாதே",
  "admin.viewStay": "பயணத்தைப் பார்க்கவும்",

  // ── Reviews tab ─────────────────────────────────────────────────────────
  "admin.approve": "அனுமதி",
  "admin.fieldAmenities": "வசதிகள்",
  "admin.fieldHost": "வழங்குபவர்",
  "admin.fieldNightlyPrice": "இரவு விலை",
  "admin.inThisBatch": "இந்தத் தொகுப்பில் {n}",
  "admin.listingRef": "பட்டியல் #{id}",
  "admin.queueClear": "ஆய்வு நிருவரி காலியாக உள்ளது!",
  "admin.queueClearBody": "சமர்ப்பிக்கப்பட்ட அனைத்துப் பண்ணைவீடுகளும் ஆய்வு செய்யப்பட்டு முடிவு செய்யப்பட்டுவிட்டன.",
  "admin.reviewQueue": "சொத்து ஆய்வு நிருவரி",
  "admin.reloadSampleQueue": "மாதிரி நிருவரியை மீண்டும் ஏற்றவும்",
  "admin.requestChanges": "மாற்றங்கள் கோரவும்",
  "admin.reject": "நிராகரி",
  "admin.submittedDocuments": "சமர்ப்பிக்கப்பட்ட ஆவணங்கள்",

  // ── Review outcome toasts ────────────────────────────────────────────────
  "admin.reviewApprovedPublished": "பட்டியல் அனுமதிக்கப்பட்டு வெளியிடப்பட்டது",
  "admin.reviewChangesRequested": "வழங்குபவரிடம் மாற்றங்கள் கோரப்பட்டன",
  "admin.reviewRejected": "பட்டியல் நிராகரிக்கப்பட்டது",

  // ── Users tab ───────────────────────────────────────────────────────────
  "admin.listingsCount": "{n} பட்டியல்கள்",
  "admin.noFlags": "எந்தக் குறியீடும் இல்லை",
  "admin.reactivate": "மீண்டும் செயல்படுத்து",
  "admin.suspend": "இடைநிறுத்து",
  "admin.syncUsers": "பயனர்களை ஒத்திசைவுசெய்",
  "admin.tripsCount": "{n} பயணங்கள்",
  "admin.userHostDirectory": "பயனர் & வழங்குபவர் பட்டியல்",
  "admin.viewRecord": "பதிவைப் பார்க்கவும்",

  // ── Bookings tab ────────────────────────────────────────────────────────
  "admin.approveStay": "பயணத்தை அனுமதி",
  "admin.dateRange": "{from} முதல் {to} வரை",
  "admin.exportCsv": "CSV ஏற்றுமதி",
  "admin.guestNamed": "விருந்தினர் {name}",
  "admin.issueRefund": "திரும்பப் பணம் வழங்கவும்",
  "admin.upiReference": "யுபிஐ குறிப்பு: {ref}",
  "admin.viewDetails": "விவரங்களைப் பார்க்கவும்",

  // ── Verification tab ────────────────────────────────────────────────────
  "admin.hostVerification": "வழங்குபவர் சரிபார்ப்பு",
  "admin.hostVerifiedBtn": "வழங்குபவர் சரிபார்க்கப்பட்டார்",
  "admin.identityVerification": "அடையாள & சொத்து சரிபார்ப்பு",
  "admin.markVerified": "சரிபார்க்கப்பட்டதாகக் குறியிடவும்",
  "admin.propertyVerification": "சொத்து சரிபார்ப்பு",
  "admin.requestInfo": "தகவல் கோரவும்",
  "admin.verifyHost": "வழங்குபவரைச் சரிபார்க்கவும்",

  // ── Status, role & document labels ──────────────────────────────────────
  "admin.docGovernmentId": "அரசு அடையாள அட்டை",
  "admin.docHostId": "வழங்குபவர் அடையாள அட்டை",
  "admin.docOwnershipProof": "உரிமைச் சான்று",
  "admin.docPayoutAccount": "வருவாய் கணக்கு",
  "admin.docPhoneEmail": "தொலைபேசி + மின்னஞ்சல்",
  "admin.docTaxReceipt": "சொத்து வரிச் சான்று",
  "admin.roleFlagged": "குறியிடப்பட்டது",
  "admin.roleGuest": "விருந்தினர்",
  "admin.roleHost": "வழங்குபவர்",
  "admin.roleHostPending": "வழங்குபவர் · நிலுவையில்",
  "admin.roleHostVerified": "வழங்குபவர் · சரிபார்க்கப்பட்டது",
  "admin.stateActive": "செயல்படுகிறது",
  "admin.stateDraft": "வரைவு",
  "admin.stateDocsInReview": "ஆவணங்கள் ஆய்வில்",
  "admin.stateMissing": "விடுபட்டுள்ளது",
  "admin.stateMissingDocs": "ஆவணங்கள் விடுபட்டுள்ளன",
  "admin.statePending": "நிலுவையில்",
  "admin.statePublished": "வெளியிடப்பட்டது",
  "admin.stateSuspended": "இடைநிறுத்தப்பட்டது",
  "admin.stateVerified": "சரிபார்க்கப்பட்டது",

  // ── User record sheet ───────────────────────────────────────────────────
  "admin.a11yUserRecord": "பயனர் பதிவு",
  "admin.fieldListings": "பட்டியல்கள்",
  "admin.fieldPhone": "தொலைபேசி",
  "admin.reactivateAccount": "கணக்கை மீண்டும் செயல்படுத்தவும்",
  "admin.suspendAccount": "கணக்கை இடைநிறுத்தவும்",

  // ── Booking record sheet ────────────────────────────────────────────────
  "admin.a11yBookingRecord": "முன்பதிவுப் பதிவு",
  "admin.fieldDates": "தேதிகள்",
  "admin.fieldGuestEmail": "விருந்தினர் மின்னஞ்சல்",
  "admin.fieldGuestName": "விருந்தினர் பெயர்",
  "admin.fieldGuestPhone": "விருந்தினர் தொலைபேசி",
  "admin.fieldProperty": "சொத்து",
  "admin.fieldTotal": "மொத்தம்",
  "admin.fieldUpiRef": "யுபிஐ குறிப்பு",
  "admin.pendingHostCheck": "வழங்குபவர் சரிபார்ப்பு நிலுவையில்",

  // ── Audit log sheet ─────────────────────────────────────────────────────
  "admin.a11yAuditLog": "ஆய்வுப் பதிவு",
  "admin.auditActor": "பணியாளர்: admin@9bhk.app",
  "admin.auditLog": "நிர்வாக ஆய்வுப் பதிவு",
  "admin.auditLogBody": "அனைத்து நிர்வாக மற்றும் செயல்பாட்டு பரிமாற்றங்களும் பணியாளர் அடையாளத்துடன் பதிவு செய்யப்படுகின்றன.",

  // ── Toasts ──────────────────────────────────────────────────────────────
  "admin.toastBookingConfirmed": "விருந்தினருக்கு முன்பதிவு #{code} உறுதிப்படுத்தப்பட்டது",
  "admin.toastCacheRefreshed": "கேட்டளை & சர்வர் கேஷ் புதுப்பிக்கப்பட்டது",
  "admin.toastDocReminder": "ஆவணம் பதிவேற்ற நினைவூட்டல் {name} அனுப்பப்பட்டது",
  "admin.toastErrPrice": "சரியான விலைத் தொகையை உள்ளிடவும்",
  "admin.toastExported": "முன்பதிவுகள் CSV-க்கு ஏற்றுமதி செய்யப்பட்டன",
  "admin.toastHostVerified": "வழங்குபவர் {name} சரிபார்க்கப்பட்டார் — அணுகல் அனுமதிக்கப்பட்டது",
  "admin.toastNoSupabase": "தற்போதைய சூழலில் Supabase சூழல் மாற்றிகள் கட்டமைக்கப்படவில்லை",
  "admin.toastOwnershipRequest": "உரிமை ஆவணக் கோரிக்கை {name} அனுப்பப்பட்டது",
  "admin.toastPriceUpdated": "இரவு விலை ₹{amount} எனப் புதுப்பிக்கப்பட்டது",
  "admin.toastPropertyVerified": "{name} சரிபார்க்கப்பட்டு வெளியிடத் தயாராக உள்ளது",
  "admin.toastQueuesRestored": "ஆய்வு நிருவரிகள் மாதிரி நிலைக்கு மீட்டமைக்கப்பட்டன",
  "admin.toastRefundIssued": "முன்பதிவு #{code} க்குத் திரும்பப் பணம் வழங்கப்பட்டது",
  "admin.toastStatusNow": "{name} இப்போது {status}",
  "admin.toastSyncFailed": "ஒத்திசைவு தோல்வி: {message}",
  "admin.toastSynced": "அனைத்துப் பண்ணைவீடுகளும் Supabase தரவுத்தளத்திற்கு ஒத்திசைவாகின்றன!",
  "admin.toastTestBooking": "சோதனை முன்பதிவு #{code} உருவாக்கப்பட்டது!",
  "admin.toastUserReactivated": "{name} மீண்டும் செயல்படுத்தப்பட்டார்",
  "admin.toastUserSuspended": "{name} இடைநிறுத்தப்பட்டார்",
  "admin.toastUsersSynced": "பயனர் பட்டியல் Supabase Auth உடன் ஒத்திசைவாக்கப்பட்டது",

  // ── Activity log entries ────────────────────────────────────────────────
  "admin.logApproved": "அனுமதிக்கப்பட்டது",
  "admin.logBookingApproved": "முன்பதிவு #{code} கைமுறையாக அனுமதிக்கப்பட்டது",
  "admin.logBulkSynced": "கேட்டளை திணிவாக Supabase (bhk_properties) க்கு ஒத்திசைவாக்கப்பட்டது",
  "admin.logCacheFlushed": "கணினி கேட்டளை கேஷ் காலீராக்கப்பட்டது",
  "admin.logChangesRequested": "மாற்றங்கள் கோரப்பட்டன",
  "admin.logDeedRequested": "{name} க்கு வழங்குபவரிடம் உரிமைச் சான்று கோரப்பட்டது",
  "admin.logDocsRequested": "{name} இடமிருந்து ஆவணங்கள் கோரப்பட்டன",
  "admin.logExported": "முன்பதிவுகள் அறிக்கை CSV ஏற்றுமதி செய்யப்பட்டது",
  "admin.logHostVerified": "வழங்குபவர் {name} சரிபார்க்கப்பட்டார்",
  "admin.logPriceUpdated": "{name} க்கான இரவு விலை ₹{amount} எனப் புதுப்பிக்கப்பட்டது",
  "admin.logPropertyVerification": "சொத்து {name} சரிபார்ப்பு முடிந்தது",
  "admin.logQueuesReset": "மாதிரி ஆய்வு நிருவரி மீட்டமைக்கப்பட்டது",
  "admin.logRefundIssued": "₹{amount} திரும்பப் பணம் #{code} க்கு வழங்கப்பட்டது",
  "admin.logRejected": "நிராகரிக்கப்பட்டது",
  "admin.logStatusUpdated": "சொத்து {name} நிலை {status} எனப் புதுப்பிக்கப்பட்டது",
  "admin.logTestBooking": "சோதனை முன்பதிவு #{code} உருவாக்கப்பட்டது",
  "admin.logUserStatus": "பயனர் {name} நிலை {status} என அமைக்கப்பட்டது",
} as const satisfies Partial<Dict>;
