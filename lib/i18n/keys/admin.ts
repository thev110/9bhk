/**
 * Key fragment — Admin Operations Console (`app/admin/page.tsx`).
 *
 * Merged into `lib/i18n/en.ts` by the catalog owner. Values are the exact
 * English strings the component rendered before extraction.
 *
 * Enum values that double as tab ids (`TABS`), property-status comparisons
 * (`published` / `draft`) and pill modifiers stay literal in the component;
 * only the human-readable label shown to staff is keyed. Seed records in
 * `INITIAL_QUEUE` / `INITIAL_USERS` are property + user data, so their name,
 * meta, host, amenity and flag fields are intentionally absent — the label
 * maps below (`admin.role*`, `admin.doc*`, `admin.state*`) translate those
 * rows at render time instead.
 */
export const adminKeys = {
  // ── Page chrome ─────────────────────────────────────────────────────────
  "admin.consoleSub": "Review listings, verify hosts, manage bookings and run operations tools.",
  "admin.operationsConsole": "Operations console",
  "admin.pageBarTitle": "Admin Operations",
  "admin.restrictedWorkspace": "Restricted workspace",
  "admin.staff": "Staff",

  // ── Workspace tabs ──────────────────────────────────────────────────────
  "admin.tabBookings": "Bookings",
  "admin.tabOverview": "Overview",
  "admin.tabProperties": "Properties",
  "admin.tabReviews": "Reviews",
  "admin.tabUsers": "Users",
  "admin.tabVerification": "Verification",

  // ── Overview stats ──────────────────────────────────────────────────────
  "admin.accountsDirectory": "Accounts directory",
  "admin.activeStays": "{n} active stays",
  "admin.liveMarketplace": "Live marketplace",
  "admin.queuedChecks": "Queued checks",
  "admin.statBookings": "Bookings",
  "admin.statProperties": "Properties",
  "admin.statUsers": "Users",
  "admin.statVerification": "Verification",
  "admin.usersActive": "{n} active",

  // ── Database status ─────────────────────────────────────────────────────
  "admin.dbActiveTables":
    "Active tables: bhk_properties, bhk_bookings, bhk_profiles, bhk_notifications. All admin status toggles and price updates persist directly to Supabase.",
  "admin.dbConnected": "Database Connected",
  "admin.dbLocalMode": "Local Mode",
  "admin.dbNoRemote":
    "No remote database URL detected in this environment. Properties, bookings and reviews are managed reactively in local state.",
  "admin.liveSupabase": "Live Supabase Connection",
  "admin.liveSupabaseTable": "Live connected to Supabase bhk_properties",
  "admin.localMockMode": "Local mock catalog mode",
  "admin.localPrototype": "Local Prototype State",
  "admin.syncCatalogToDb": "Sync Catalog to DB",
  "admin.syncToDb": "Sync to DB",
  "admin.syncing": "Syncing...",

  // ── Management & queues ─────────────────────────────────────────────────
  "admin.bookingsManager": "Bookings manager",
  "admin.checksPending": "{n} checks pending",
  "admin.farmhouseDirectory": "Farmhouse directory",
  "admin.managementQueues": "Management & Queues",
  "admin.propertyReviews": "Property reviews",
  "admin.totalCount": "{n} total",
  "admin.verificationQueue": "Verification queue",
  "admin.waitingCount": "{n} waiting",

  // ── Operations tools ────────────────────────────────────────────────────
  "admin.exportBookingsCsv": "Export Bookings CSV",
  "admin.newTestBooking": "New Test Booking",
  "admin.operationsTools": "Operations Tools",
  "admin.refreshCache": "Refresh Cache",
  "admin.resetDemoQueues": "Reset Demo Queues",
  "admin.toolsIntro": "Quick administrative triggers and system utilities:",

  // ── Activity feed ───────────────────────────────────────────────────────
  "admin.recentActivity": "Recent activity",
  "admin.viewAuditLog": "View audit log",

  // ── Properties tab ──────────────────────────────────────────────────────
  "admin.editRate": "Edit rate",
  "admin.farmhousesDatabase": "Farmhouses & Database",
  "admin.filterAll": "All",
  "admin.filterDraft": "Draft",
  "admin.filterPublished": "Published",
  "admin.newPricePlaceholder": "New nightly price (₹)",
  "admin.pricePerNight": "₹{amount} / night",
  "admin.publishToExplore": "Publish to explore",
  "admin.unpublishStay": "Unpublish stay",
  "admin.viewStay": "View stay",

  // ── Reviews tab ─────────────────────────────────────────────────────────
  "admin.approve": "Approve",
  "admin.fieldAmenities": "Amenities",
  "admin.fieldHost": "Host",
  "admin.fieldNightlyPrice": "Nightly price",
  "admin.docDownload": "Download",
  "admin.docNotePlaceholder": "Reviewer note (optional)",
  "admin.docVerify": "Verify",
  "admin.docView": "View",
  "admin.inThisBatch": "{n} in this batch",
  "admin.listingRef": "Listing #{id}",
  "admin.noDocuments": "No documents uploaded yet",
  "admin.queueClear": "Review queue is clear!",
  "admin.queueClearBody": "All submitted farmhouses have been reviewed and decided.",
  "admin.queueLoading": "Loading the review queue…",
  "admin.reviewQueue": "Property review queue",
  "admin.reloadSampleQueue": "Reload sample queue",
  "admin.refreshQueue": "Refresh queue",
  "admin.requestChanges": "Request changes",
  "admin.reject": "Reject",
  "admin.submittedDocuments": "Submitted documents",
  "admin.submittedToday": "Submitted today",
  "admin.submittedDaysAgo": "Submitted {n} days ago",
  "admin.submittedUnknown": "Submitted earlier",

  // ── Review outcome toasts ────────────────────────────────────────────────
  "admin.reviewApprovedPublished": "Listing approved and published",
  "admin.reviewChangesRequested": "Changes requested from the host",
  "admin.reviewRejected": "Listing rejected",

  // ── Users tab ───────────────────────────────────────────────────────────
  "admin.listingsCount": "{n} listings",
  "admin.noFlags": "No flags",
  "admin.reactivate": "Reactivate",
  "admin.suspend": "Suspend",
  "admin.syncUsers": "Sync Users",
  "admin.tripsCount": "{n} trips",
  "admin.userHostDirectory": "User & host directory",
  "admin.viewRecord": "View record",

  // ── Bookings tab ────────────────────────────────────────────────────────
  "admin.approveStay": "Approve stay",
  "admin.dateRange": "{from} to {to}",
  "admin.exportCsv": "Export CSV",
  "admin.guestNamed": "Guest {name}",
  "admin.issueRefund": "Issue refund",
  "admin.upiReference": "UPI Reference: {ref}",
  "admin.viewDetails": "View details",

  // ── Verification tab ────────────────────────────────────────────────────
  "admin.hostVerification": "Host verification",
  "admin.hostVerifiedBtn": "Host verified",
  "admin.identityVerification": "Identity & property verification",
  "admin.markVerified": "Mark verified",
  "admin.propertyVerification": "Property verification",
  "admin.requestInfo": "Request info",
  "admin.verifyHost": "Verify host",

  // ── Status, role & document labels ──────────────────────────────────────
  "admin.docGovernmentId": "Government ID",
  "admin.docHostId": "Host ID",
  "admin.docOwnershipProof": "Ownership proof",
  "admin.docPayoutAccount": "Payout account",
  "admin.docPhoneEmail": "Phone + email",
  "admin.docTaxReceipt": "Property tax receipt",
  "admin.roleFlagged": "Flagged",
  "admin.roleGuest": "Guest",
  "admin.roleHost": "Host",
  "admin.roleHostPending": "Host · pending",
  "admin.roleHostVerified": "Host · verified",
  "admin.stateActive": "Active",
  "admin.stateDraft": "Draft",
  "admin.stateDocsInReview": "Docs in review",
  "admin.stateMissing": "Missing",
  "admin.stateMissingDocs": "Missing documents",
  "admin.statePending": "Pending",
  "admin.statePublished": "Published",
  "admin.stateRejected": "Rejected",
  "admin.stateSuspended": "Suspended",
  "admin.stateVerified": "Verified",

  // ── User record sheet ───────────────────────────────────────────────────
  "admin.a11yUserRecord": "User record",
  "admin.fieldListings": "Listings",
  "admin.fieldPhone": "Phone",
  "admin.reactivateAccount": "Reactivate Account",
  "admin.suspendAccount": "Suspend Account",

  // ── Booking record sheet ────────────────────────────────────────────────
  "admin.a11yBookingRecord": "Booking record",
  "admin.fieldDates": "Dates",
  "admin.fieldGuestEmail": "Guest email",
  "admin.fieldGuestName": "Guest name",
  "admin.fieldGuestPhone": "Guest phone",
  "admin.fieldProperty": "Property",
  "admin.fieldTotal": "Total",
  "admin.fieldUpiRef": "UPI Ref",
  "admin.pendingHostCheck": "Pending host check",

  // ── Audit log sheet ─────────────────────────────────────────────────────
  "admin.a11yAuditLog": "Audit log",
  "admin.auditActor": "Staff: admin@9bhk.app",
  "admin.auditLog": "Admin audit log",
  "admin.auditLogBody": "All administrative and operational transactions are logged with staff identity.",

  // ── Toasts ──────────────────────────────────────────────────────────────
  "admin.toastBookingConfirmed": "Booking #{code} confirmed for guest",
  "admin.toastCacheRefreshed": "Catalog & server cache refreshed",
  "admin.toastDocReminder": "Document upload reminder sent to {name}",
  "admin.toastErrPrice": "Enter a valid price amount",
  "admin.toastExported": "Bookings exported to CSV",
  "admin.toastHostVerified": "Host {name} verified — access granted",
  "admin.toastNoSupabase": "Supabase environment variables not configured in current environment",
  "admin.toastOwnershipRequest": "Ownership document request sent for {name}",
  "admin.toastPriceUpdated": "Updated nightly rate to ₹{amount}",
  "admin.toastPropertyVerified": "{name} verified and ready to publish",
  "admin.toastQueuesRestored": "Review queues restored to sample state",
  "admin.toastRefundIssued": "Refund issued for booking #{code}",
  "admin.toastStatusNow": "{name} is now {status}",
  "admin.toastSyncFailed": "Sync failed: {message}",
  "admin.toastSynced": "All farmhouses synced to Supabase database!",
  "admin.toastTestBooking": "Test booking #{code} created!",
  "admin.toastUserReactivated": "Reactivated {name}",
  "admin.toastUserSuspended": "Suspended {name}",
  "admin.toastUsersSynced": "User directory synced with Supabase Auth",

  // ── Activity log entries ────────────────────────────────────────────────
  "admin.logApproved": "approved",
  "admin.logBookingApproved": "Booking #{code} manually approved",
  "admin.logBulkSynced": "Bulk synchronized catalog to Supabase (bhk_properties)",
  "admin.logCacheFlushed": "System catalog cache flushed",
  "admin.logChangesRequested": "changes requested",
  "admin.logDeedRequested": "Requested deed from host for {name}",
  "admin.logDocsRequested": "Requested docs from {name}",
  "admin.logExported": "Exported bookings report CSV",
  "admin.logHostVerified": "Host {name} verified",
  "admin.logPriceUpdated": "Nightly rate for {name} updated to ₹{amount}",
  "admin.logPropertyVerification": "Property {name} verification completed",
  "admin.logQueuesReset": "Sample review queue reset",
  "admin.logRefundIssued": "Refund ₹{amount} issued for #{code}",
  "admin.logRejected": "rejected",
  "admin.logStatusUpdated": "Property {name} status updated to {status}",
  "admin.logTestBooking": "Test booking #{code} generated",
  "admin.logUserStatus": "User {name} status set to {status}",

  // ── Reused from the shared catalog ──────────────────────────────────────
  // These are referenced by app/admin/page.tsx but are declared in en.ts, so
  // they are intentionally NOT repeated here:
  //   action.cancel, action.close, action.done, action.save,
  //   booking.statusAwaiting, booking.statusConfirmed, home.guestCount,
  //   nav.trips, note.justNow, profile.fieldEmail, search.staysCount,
  //   trips.bookingRef
  "admin.toastReviewFailed": "Could not load the review",
  "admin.toastDocReviewFailed": "Could not load the document for review",
  "admin.toastDocVerified": "Document verified",
  "admin.toastDocRejected": "Document rejected",
  "admin.toastQueueRefreshed": "Review queue refreshed",
  "admin.logQueueRefreshed": "Review queue refreshed from the database",
  "admin.errDocLink": "The document link could not be opened",
} as const;
