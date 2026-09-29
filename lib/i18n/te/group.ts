/**
 * Telugu (తెలుగు) translations for the group-stay surfaces: date calendar,
 * celebration capacity and Split Pay.
 *
 * Terminology follows `lib/i18n/GLOSSARY.md` and the file is complete as of
 * 2026-09-29; `npm test` fails if a key is missing.
 */
export const teGroup = {
  // ── Calendar ───────────────────────────────────────────────────────────
  "calendar.checkIn": "చెక్-ఇన్",
  "calendar.checkOut": "చెక్-అవుట్",
  "calendar.apply": "తేదీలను వర్తించు",
  "calendar.clear": "తేదీలను తొలగించు",
  "calendar.body":
    "చెక్-ఇన్ మరియు చెక్-అవుట్ తేదీలను ఎంచుకోండి. ఇప్పటికే బుక్ అయిన లేదా యజమాని నిరోధించిన రాత్రులు బూడిద రంగులో ఉంటాయి.",
  "calendar.unavailable": "అందుబాటులో లేదు",
  "calendar.nightsOne": "{n} రాత్రి",
  "calendar.nightsMany": "{n} రాత్రులు",
  "calendar.nights": "రాత్రులు",
  "calendar.availableCount": "ఈ తేదీల్లో {n} బసలు అందుబాటులో ఉన్నాయి",

  // ── Celebration capacity ───────────────────────────────────────────────
  "celebration.filter": "వేడుకలకు సిద్ధం",
  "celebration.sectionTitle": "వేడుక సామర్థ్యం",
  "celebration.capacityValue": "{n} అతిథుల వరకు",
  "celebration.powerValue": "{kw} కి.వా. అనుమతించిన విద్యుత్ లోడ్",
  "celebration.curfewValue": "{hour}:00 వరకు సౌండ్ సిస్టమ్ అనుమతి",
  "celebration.parkingValue": "{n} వేడుక పార్కింగ్ స్థలాలు",
  "celebration.generatorValue": "{kw} కి.వా. బ్యాకప్ జెనరేటర్",
  "celebration.catererYes": "బయటి కేటరింగ్ వారికి అనుమతి ఉంది",
  "celebration.catererNo": "ఇంటి వంటగది మాత్రమే",
  "celebration.wizardTitle": "వేడుకలు",
  "celebration.wizardBody":
    "ఈ ఇంటిలో వేడుక, కుటుంబ పునఃకలయిక లేదా సంగీత్ నిర్వహించవచ్చా అని అతిథులకు తెలియజేయండి. విద్యుత్ లోడ్, సౌండ్ కర్ఫ్యూ, పార్కింగ్ స్థలమే దీన్ని నిర్ణయిస్తాయి.",
  "celebration.toggle": "ఈ ఇంటిలో వేడుకలు నిర్వహించవచ్చు",
  "celebration.toggleHelp":
    "ఆస్తిలో వేడుకలకు నిజంగా అనుమతి ఉంటేనే దీన్ని ఆన్ చేయండి.",
  "celebration.fieldCapacity": "గరిష్ఠ వేడుక అతిథులు",
  "celebration.fieldPower": "అనుమతించిన విద్యుత్ లోడ్ (కి.వా.)",
  "celebration.fieldCurfew": "సౌండ్ కర్ఫ్యూ (24 గం)",
  "celebration.fieldParking": "వేడుక పార్కింగ్ స్థలాలు",
  "celebration.fieldGenerator": "జెనరేటర్ (కి.వా.)",
  "celebration.fieldCatering": "కేటరింగ్",

  // ── Split Pay ──────────────────────────────────────────────────────────
  "split.title": "బిల్లును విభజించండి",
  "split.roster": "ఎవరు వస్తున్నారు?",
  "split.rosterPlaceholder": "పేర్లను కామాలతో వేరు చేయండి",
  "split.body":
    "ప్రతి అతిథికి వారి వాటాను పంపండి. గ్రూప్ పూర్తిగా చెల్లించిన తర్వాత, బస ప్రారంభమైన తర్వాత యజమానికి చెల్లింపు జరుగుతుంది.",
  "split.shareOf": "{name} వాటా",
  "split.sendInvite": "ఆహ్వానం పంపు",
  "split.inviteFailed": "ఆహ్వాన లింక్‌ను సృష్టించలేకపోయాం",
  "split.inviteTitle": "ఒక బస బిల్లును పంచుకోవడానికి మీరు ఆహ్వానించబడ్డారు",
  "split.inviteBody": "{organiser} {property} బసను బుక్ చేశారు. మీ వాటా {amount}.",
  "split.yourShare": "మీ వాటా",
  "split.stayDates": "బస తేదీలు",
  "split.payShare": "మీ వాటాను చెల్లించండి",
  "split.paying": "చెల్లింపు పేజీ తెరుచుకుంటోంది…",
  "split.paymentReceived": "చెల్లింపు అందింది. ఇప్పుడు నిర్ధారిస్తున్నాము.",
  "split.invalidLink": "ఈ ఆహ్వాన లింక్ చెల్లదు",
  "split.invalidLinkBody": "ఆహ్వాన లింకులు గడువు ముగుస్తాయి. కొత్త లింక్ పంపమని అడగండి.",
  "split.notLive": "చెల్లింపులు ఇంకా ప్రారంభం కాలేదు",
  "split.notLiveBody": "ఈ డిప్లాయ్‌మెంట్‌లో చెల్లింపు కీలు లేవు, కాబట్టి ఈ వాటాను ఇప్పుడు చెల్లించలేరు.",

  "split.collected": "వసూలైంది",
  "split.outstanding": "ఇంకా వసూలు కావాల్సింది",
  "split.paid": "చెల్లించారు",
  "split.pending": "వేచి ఉంది",
  "split.markPaid": "చెల్లించినట్లు గుర్తించు",
  "split.copyLink": "ఆహ్వాన లింక్‌ను కాపీ చేయి",
  "split.funded": "గ్రూప్ పూర్తిగా చెల్లించింది",
  "split.progress": "{m}లో {n} మంది చెల్లించారు",
  "split.payoutReady": "యజమానికి చెల్లింపు విడుదలైంది",
  "split.payoutTooEarly": "చెక్-ఇన్ రోజున చెల్లింపు విడుదలవుతుంది",
  "split.payoutUnfunded": "{n} మంది అతిథుల కోసం వేచి ఉంది",
  "split.toastInvite": "ఆహ్వాన లింక్ కాపీ అయింది",
  "split.toastPaid": "{name} చెల్లించినట్లు గుర్తించారు",
} as const;
