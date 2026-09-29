// Telugu translations — host surface (app/host, app/host/new, app/host/bookings).
// Terminology: lib/i18n/GLOSSARY.md
import type { Dict } from "../en";

export const teHost = {
  // ── Host workspace ─────────────────────────────────────────────────────
  "host.earnings": "ఆదాయం",
  "host.hosting": "హోస్టింగ్",
  "host.hostingTools": "హోస్టింగ్ టూల్స్",
  "host.switchToGuest": "అతిథి వీక్షకు మారండి",
  "host.workspace": "హోస్ట్ వర్క్‌స్పేస్",

  // ── Host dashboard ─────────────────────────────────────────────────────
  "host.add": "జోడించండి",
  "host.bookings": "బుకింగ్‌లు",
  "host.emptyBody": "వివరాలను ఒకసారి జోడించండి — అతిథులు వెంటనే సెర్చ్‌లో చూస్తారు.",
  "host.emptyTitle": "మీ మొదటి గమనానికి హోస్ట్ చేయడానికి సిద్ధమా?",
  "host.fieldUpiId": "యుపిఐ ఐడీ",
  "host.listYourFarmhouse": "మీ ఫారంహౌస్‌ను జాబితాలో చేర్చండి",
  "host.overviewTitle": "మీ హోస్టింగ్ ఒక్క చూపులో",
  "host.payoutUpi": "చెల్లింపు యుపిఐ",
  "host.payoutUpiBody": "అతిథులు బుక్ చేసేటప్పుడు ఈ యుపిఐ ఐడీకి చెల్లిస్తారు. డబ్బు చేరిన తర్వాత మీరు రాత్రిని నిర్ధారిస్తారు.",
  "host.resume": "మళ్లీ కొనసాగించండి",
  "host.saveUpi": "యుపిఐ భద్రపరచండి",
  "host.statusDraft": "డ్రాఫ్ట్",
  "host.statusPendingReview": "సమీక్ష కోసం పెండింగ్‌లో",
  "host.statusPublished": "ప్రచురించబడింది",
  "host.untitledFarmhouse": "పేరు పెట్టని ఫారంహౌస్",
  "host.view": "చూడండి",
  "host.yourProperties": "మీ ఆస్తులు",

  // ── Host dashboard stats ───────────────────────────────────────────────
  "host.statAcrossFarmhouses": "3 ఫారంహౌసుల్లో",
  "host.statLast30": "గత 30 రోజులు",
  "host.statNextCheckin": "తదుపరి చెక్-ఇన్ 3 రోజుల్లో",
  "host.statOccupancy": "ఆక్రమణ",
  "host.statThisMonth": "ఈ నెల",
  "host.statUpcoming": "రాబోయే రాత్రులు",
  "host.statViews": "చూపులు",
  "host.statViewsDelta": "గత నెలతో పోలిస్తే +18%",

  // ── Listing wizard — progress chrome ───────────────────────────────────
  "host.backToHosting": "హోస్టింగ్‌కు తిరిగి",
  "host.newListing": "కొత్త జాబితా",
  "host.savedBody": "{name} దాని ఫోటోలతో సహా సేవ్ అయ్యింది. అతిథులు Explore పేజీలో చూడగలరు.",
  "host.sectionOf": "దబ్బు {n} / {total} · {section}",
  "host.submittedTitle": "సమీక్ష కోసం సమర్పించబడింది",
  "host.submitForReview": "సమీక్ష కోసం సమర్పించండి",

  // ── Listing wizard — step labels ───────────────────────────────────────
  "host.sectionAmenities": "సౌకర్యాలు",
  "host.sectionAvailability": "అందుబాటు",
  "host.sectionBasics": "ప్రాథమిక వివరాలు",
  "host.sectionLocation": "స్థానం",
  "host.sectionPhotos": "ఫోటోలు",
  "host.sectionPreview": "ప్రివ్యూ",
  "host.sectionPrice": "ధర",
  "host.sectionPublish": "ప్రచురించండి",
  "host.sectionSpace": "స్థలం",

  // ── Listing wizard — step titles ───────────────────────────────────────
  "host.titlePublish": "ప్రచురించడానికి సిద్ధమా?",
  "host.titlePhotos": "అధిక రిజల్యూషన్ ఫోటోలను జోడించండి",
  "host.titlePreview": "మీ జాబితాను ప్రివ్యూ చేయండి",
  "host.titlePricing": "ధర మరియు కొనుగోలు నిబంధనలను సెట్ చేయండి",
  "host.titleGarage": "పార్కింగ్, గారేజ్ & సౌకర్యాలు",
  "host.titleBasics": "మీ స్థలం గురించి చెప్పండి",
  "host.titleSpace": "ఎంత స్థలం?",
  "host.titleAvailability": "అందుబాటు & ప్రైవేట్ యాక్సెస్",
  "host.titleSetting": "ఇది ఎక్కడ, ఏ రకమైనది?",

  // ── Listing wizard — basics ────────────────────────────────────────────
  "host.fieldPropertyName": "ఆస్తి పేరు",
  "host.fieldPropertyType": "ఆస్తి రకం",
  "host.fieldShortDescription": "సంక్షిప్త వివరణ",
  "host.helpShortDescription": "ఒకటి లేదా రెండు వరుసలు. తర్వాత దీన్ని విస్తరించగలరు.",
  "host.listForSaleAcquisition": "అమ్మకానికి జాబితా (కొనుగోలు)",
  "host.listForSaleHelp": "ఈ భూమిని కొనేందుకు ఆసక్తి ఉన్నవారికి కొనండి ట్యాబ్‌లో చూపితే",
  "host.maximumGuests": "గరిష్ట అతిథులు",
  "host.stepBasics": "పేరు మరియు సంక్షిప్త వివరణను అతిథులు మొదట చూస్తారు.",

  // ── Listing wizard — location ──────────────────────────────────────────
  "host.dragPin": "మీ దర్వాయను వద్దకు పిన్‌ను లాగండి",
  "host.fieldArea": "విస్తీర్ణం లేదా గుర్తు",
  "host.fieldCityOrRegion": "నగరం లేదా ప్రాంతం",
  "host.fieldStreetAddress": "వీధి చిరునామా",
  "host.helpAddress": "బుకింగ్ నిర్ధారించే వరకు ఇది గోప్యంగా ఉంచబడుతుంది.",
  "host.stepLocation": "బుకింగ్ తర్వాతే అతిథులకు ఖచ్చితమైన పిన్ కనిపిస్తుంది.",
  "host.fieldSetting": "స్థల రకం",
  "host.helpSetting": "9bhk ఇంట్లు పూర్తి వీలువల్ల ఇంట్లు, బంగళాలు, పూల ఇంట్లు. మీ ఇల్లు నిజంగా ఎక్కడ ఉంది — సముద్రం, పర్వతాలు, నగరం, గ్రామీణం — దానినే ఎంచుకోండి.",
  "host.fieldSettingDetail": "స్థలం గురించి ఒక వాక్యం",
  "host.settingDetailPlaceholder": "ఉదా. {setting} — ఎత్తుకు, ముందుభాగం లేదా భూమి విస్తీర్ణం చేర్చండి",

  // ── Listing wizard — space ─────────────────────────────────────────────
  "host.fieldBathrooms": "స్నానగదులు",
  "host.fieldBedrooms": "పడగదులు",
  "host.fieldBeds": "పైలలు",
  "host.stepSpace": "పడగదులు, పైలలు, స్నానగదులు సమూహాన్ని ప్రణాళిక చేయడంలో అతిథులకు సహాయపడతాయి.",
  "host.minBedroomsNote": "కనీసం {n} పడగదులు — ఇది సమూహ ఇల్లు, హోటల్ గది కాదు",
  "host.errMinBedrooms": "9bhk జాబితాలకు కనీసం {n} పడగదులు అవసరం.",

  // ── Listing wizard — garage & amenities ────────────────────────────────
  "host.beachFrontagePlaceholder": "ఉదా. 180 అడుగుల నేరుగా సముద్రతీరం",
  "host.curatedAmenities": "ఎంపిక చేసిన భూమి సౌకర్యాలు",
  "host.fieldBeachFrontage": "నేరుగా సముద్రతీర ముందుభాగం",
  "host.garageArchitecture": "గారేజ్ & పార్కింగ్ (ఐచ్ఛికం)",
  "host.noGarage": "గారేజ్ లేదు",
  "host.fieldGarageCapacity": "వాహన సామర్థ్యం",
  "host.qualifierDcFastCharge": "(డీసీ ఫాస్ట్ చార్జ్)",
  "host.qualifierJetSkiSlip": "(జెట్ స్కీ స్లిప్)",
  "host.qualifierLowRamp": "(<7° సూపర్ కార్ రాంప్)",
  "host.qualifierPergola": "(పోర్టికో)",
  "host.stepGarage": "తీర ఇంట్లు తమ ముందుభాగాన్ని జాబితా చేయవచ్చు. గారేజ్ పూర్తిగా ఐచ్ఛికం — చాలా మంచి ఇంట్లలో ఉండదు.",

  // ── Listing wizard — photos ────────────────────────────────────────────
  "host.coverFirstShot": "మొదటి ఫోటో కవర్‌గా సెట్ అయ్యింది.",
  "host.photosAdded": "{n} ఫోటోలు జోడించబడ్డాయి",
  "host.stepPhotos": "మీ ఫోన్ నుంచి ఫోటోలు అప్‌లోడ్ చేయండి. అవి జాబితాతోనే నిల్వ ఉంటాయి.",
  "host.uploadPhotos": "ఫోటోలు అప్‌లోడ్ చేయండి",
  "host.uploading": "అప్‌లోడ్ అవుతోంది…",

  // ── Listing wizard — pricing ───────────────────────────────────────────
  "host.acquisitionAsking": "కొనుగోలు అడ్డుకున్న ధర: {price}",
  "host.acquisitionTerms": "కొనుగోలు నిబంధనలు",
  "host.askingPricePlaceholder": "ఉదా. 280000000 (28 Cr)",
  "host.beforeTaxes": "పన్నుల ముందు",
  "host.cleaningFeeLabel": "శుచిస్సూతర ఫీజు",
  "host.fieldAskingSalePrice": "అడ్డుకున్న అమ్మక ధర (₹)",
  "host.fieldBaseNightlyPrice": "బేస్ రాత్రి ధర (₹)",
  "host.fieldCleaningFee": "శుచిస్సూతర ఫీజు (₹)",
  "host.fieldLandArea": "భూమి / సర్వే విస్తీర్ణం",
  "host.fieldSecurityDeposit": "భద్రతా డిపాజిట్ (₹) — ఐచ్ఛికం",
  "host.guestPaysTwoNights": "అతిథి 2 రాత్రులకు చెల్లిస్తారు",
  "host.helpChargedOnce": "ప్రతి రాత్రికి ఒకసారి మాత్రమే వస్తుంది.",
  "host.helpEnterAskingPrice": "అడ్డుకున్న ధరను INR లో నమోదు చేయండి",
  "host.landAreaPlaceholder": "ఉదా. 4.5 గ్రౌండ్స్ (10,800 స్క్వేర్ ఫుట్)",
  "host.pricingRulesNote": "సీజన్ మరియు సందర్భోచిత ధర మార్పులను తర్వాత ధర నియమాల ద్వారా సెట్ చేయవచ్చు.",
  "host.stepPricing": "రాత్రి టారిఫ్‌లను మరియు కొనుగోలు నిబంధనలను సెట్ చేయండి.",

  // ── Listing wizard — availability ──────────────────────────────────────
  "host.blockDatesBody": "ఫారంహౌస్ అందుబాటులో లేనప్పుడు తేదీలను బ్లాక్ చేయండి.",
  "host.calendarBlocked": "బ్లాక్ చేయబడింది",
  "host.calendarOpen": "తెరిచి ఉంది",
  "host.fieldMinStay": "కనీసం గడువు (రాత్రులు)",
  "host.nightMany": "{n} రాత్రులు",
  "host.nightOne": "{n} రాత్రి",

  // ── Listing wizard — preview ───────────────────────────────────────────
  "host.previewBathrooms": "{n} స్నానగదులు",
  "host.previewBeds": "{n} పైలలు",
  "host.previewBedrooms": "{n} పడగదులు",
  "host.previewDescriptionEmpty": "ఒక సంక్షిప్త వివరణ ఇక్కడ కనిపిస్తుంది.",
  "host.previewGuests": "{n} అతిథులు",

  // ── Listing wizard — publish ───────────────────────────────────────────
  "host.stepPublish": "ప్రచురిస్తే ఈ జాబితా సమీక్ష కోసం పంపబడుతుంది. ఆమోదం తర్వాత వివరాలను సవరించగలరు.",

  // ── Bookings ───────────────────────────────────────────────────────────
  "host.bookingDetails": "బుకింగ్ వివరాలు",
  "host.confirmStay": "రాత్రిని నిర్ధారించండి",
  "host.emptyBookingsBody": "యుపిఐ ద్వారా ఎవరైనా చెల్లించే వెంటనే పేరు, ఇమెయిల్, ఫోన్ ఇక్కడ కనిపిస్తాయి.",
  "host.emptyCancelled": "రద్దు చేసిన రాత్రులు ఇంకా లేవు.",
  "host.emptyPast": "గత రాత్రులు ఇంకా లేవు.",
  "host.emptyUpcoming": "రాబోయే రాత్రులు ఇంకా లేవు.",
  "host.fieldPhone": "ఫోన్",
  "host.manageStays": "మీ రాత్రులను నిర్వహించండి",
  "host.manageStaysSub": "ప్రతి రిజర్వేషన్, క్యాలెండర్ బ్లాక్, చెల్లింపు అన్నీ ఒకే చోట.",
  "host.noEmail": "ఇమెయిల్ ఇంకా లేదు",
  "host.noPhone": "ఫోన్ ఇంకా లేదు",
  "host.notAdded": "జోడించలేదు",
  "host.reference": "సూచన సంఖ్య",
  "host.statusAwaiting": "వేచి ఉంది",
  "host.total": "మొత్తం",
  "host.upi": "యుపిఐ",
  "host.viewDetails": "వివరాలు చూడండి",

  // ── Bookings — calendar tab ───────────────────────────────────────────
  "host.blockDates": "తేదీలను బ్లాక్ చేయండి",
  "host.blockDatesBodyFull": "ఫారంహౌస్ అందుబాటులో లేనప్పుడు తేదీలను బ్లాక్ చేయండి. బ్లాక్ చేసిన రాత్రులను దాటి అతిథులు బుక్ చేయలేరు.",
  "host.calendarAvailable": "అందుబాటులో",
  "host.calendarBooked": "బుక్ అయ్యింది",
  "host.checkinWindow": "చెక్-ఇన్ విండో",
  "host.minimumStay": "కనీసం గడువు",
  "host.tabCalendar": "క్యాలెండర్",
  "host.tonightsRules": "ఈ రాత్రి నిబంధనలు",
  "host.weekendPrice": "వారాంత్రి ధర",

  // ── Bookings — earnings tab ────────────────────────────────────────────
  "host.breakdown": "వివరణ",
  "host.cleaningFeesCollected": "శుచిస్సూతర ఫీజులు వసూలయ్యాయి",
  "host.downloadStatement": "స్టేట్‌మెంట్ డౌన్‌లోడ్ చేయండి",
  "host.earningsDisclaimer": "మొత్తాలు మీ చెల్లింపు ప్రైవైడర్ నుంచి వస్తాయి — ఇది ప్రోటోటైప్ డేటా ఆకారాన్ని మాత్రమే చూపుతుంది, నిజమైన లెక్కల కాదు.",
  "host.earningsSummary": "3 ఫారంహౌసుల్లో · 14 రాత్రులు బుక్ అయ్యాయి · ▲ 18%",
  "host.grossBookings": "మొత్తం బుకింగ్‌లు",
  "host.lastPayout": "చివరి చెల్లింపు 28 జూన్ 2026",
  "host.netEarnings": "నెట్ ఆదాయం",
  "host.netEarningsPeriod": "నెట్ ఆదాయం · జూన్ 2026",
  "host.paidOut": "చెల్లించారు",
  "host.payoutAccount": "చెల్లింపు ఖాతా",
  "host.payoutArrives": "5 జూలై 2026 నాడు వస్తుంది",
  "host.payouts": "చెల్లింపులు",
  "host.pendingPayout": "పెండింగ్ చెల్లింపు",
  "host.platformFees": "ప్లాట్‌ఫారమ్ ఫీజులు (8%)",

  // ── Toasts ─────────────────────────────────────────────────────────────
  "host.toastStayConfirmed": "రాత్రి నిర్ధారించబడింది. అతిథి నోటిఫికేషన్లలో చూడగలరు.",
  "host.toastUpiSaved": "యుపిఐ ఐడీ సేవ్ అయ్యింది",

  // ── Validation messages ────────────────────────────────────────────────
  "host.errNameShort": "అతిథులు గుర్తించే ఆస్తి పేరును జోడించండి.",
  "host.errPhotoUpload": "ఫోటో అప్‌లోడ్ విఫలమైంది",
  "host.errSaveFailed": "జాబితాను సేవ్ చేయలేకపోయాము",
  "host.errDocsNotUploaded": "{n} పత్రాలు అప్‌లోడ్ కాలేదు",
  "host.errDocTooLarge": "ఆ ఫైల్ చాలా పెద్దది",
  "host.errDocType": "ఆ ఫైల్ రకం మద్దతు లేదు",
  "host.documentsTitle": "పత్రాలు",
  "host.documentsBody": "ఈ జాబితాను రివ్యూ చేయడానికి అవసరమైన పత్రాలను అప్‌లోడ్ చేయండి.",
  "host.docNone": "ఫైల్ ఎంచుకోలేదు",
  "host.docReplace": "ఫైల్ మార్చు",
  "host.docUpload": "ఫైల్ ఎంచుకోండి",
} as const satisfies Partial<Dict>;
