// Telugu (తెలుగు) — Realtor / broker portal surface (`app/realtor/page.tsx`).
// Terminology: lib/i18n/GLOSSARY.md
import type { Dict } from "../en";

export const teRealtor = {
  // ── Portal chrome ───────────────────────────────────────────────────────
  "realtor.portalTitle": "రియల్టర్ పోర్టల్",
  "realtor.workspaceEyebrow": "బ్రోకర్ & ఏజెన్సీ వర్క్‌స్పేస్",
  "realtor.reraVerified": "ఆర్ఇఎఆర్ ధృవీకరించబడింది",
  // REVIEW: "mandate" (exclusive agency instruction) has no established Telugu
  // real-estate word; transliterated and left for a native-speaker pass.
  "realtor.mandatesTitle": "కస్టమర్ నమోదు & మ్యాండేట్‌లు",
  "realtor.agencyRera": " · ఆర్ఇఎఆర్ #{rera}",

  // ── Presentation mode ───────────────────────────────────────────────────
  "realtor.presentationMode": "ప్రెజెంటేషన్ మోడ్",
  "realtor.presentationActive": "ప్రెజెంటేషన్ మోడ్ కార్యాచరణలో",
  "realtor.presentationDisable": "నిలిపివేయండి",
  "realtor.presentationLive": "కస్టమర్ ప్రెజెంటేషన్ మోడ్ కార్యాచరణలో ఉంది",
  "realtor.presentationLiveBody":
    "ప్రత్యక్ష హోస్ట్ పరిచయాలు మరియు అంతర్గత మార్జిన్లు దాచబడ్డాయి. మీరు మీ కస్టమర్‌కు జాబితాలను చూపించినప్పుడు, మీ ఏజెన్సీ వివరాలు కనిపిస్తాయి.",

  // ── Stat tiles ──────────────────────────────────────────────────────────
  "realtor.statOnboardedClients": "నమోదు చేసిన కస్టమర్లు",
  // REVIEW: "lead lock" is brokerage jargon with no Telugu equivalent; used a
  // descriptive "నేరువైన అవకాశం లాక్" (direct-prospect lock) instead.
  "realtor.statLeadLock": "నేరువైన అవకాశం లాక్ హామీ",
  "realtor.statActiveMandates": "కార్యాచరణలో ఉన్న మ్యాండేట్‌లు",
  "realtor.statTotalBuyingPower": "మొత్తం కొనుగోలు శక్తి",
  "realtor.statCoastalHoldings": "తీర ఆస్తులు",
  "realtor.statBeachfrontEstates": "ప్రత్యక్ష సముద్రతీర భూములు",
  // REVIEW: "co-broking" is industry jargon; transliterated per Rule 1 rather
  // than invented as a Telugu compound.
  "realtor.statCoBrokingFee": "కో-బ్రోకింగ్ కమిషన్",
  // REVIEW: "locked split" (fixed commission share) has no standard Telugu term.
  "realtor.statLockedSplit": "ప్రామాణిక లాక్ విభజన",

  // ── Client roster ───────────────────────────────────────────────────────
  "realtor.rosterTitle": "గోప్య కస్టమర్ జాబితా",
  "realtor.rosterBody":
    "ఇక్కడ నమోదు చేసిన కస్టమర్లు మీ ఏజెన్సీ ప్రొఫైల్‌తో క్రిప్టోగ్రాఫిక్‌గా బంధించబడతారు.",
  "realtor.onboardClient": "+ కస్టమర్‌ను నమోదు చేయండి",
  "realtor.ndaProtected": "ఎన్‌డిఎ రక్షణ",
  // REVIEW: "corridor" is a mapped geography term; transliterated rather than
  // forced into a general word like "ప్రాంతం" that also means "region".
  "realtor.labelCorridor": "కారిడర్:",
  "realtor.labelAutomotiveNeed": "వాహన అవసరం:",
  "realtor.addedOn": "{date} నాడు జోడించబడింది",
  "realtor.presentHoldings": "ఆస్తులను చూపించండి",
  "realtor.removeClient": "తొలగించండి",

  // ── Seller cross-sell ───────────────────────────────────────────────────
  "realtor.sellerPrompt": "తీర భూమి అమ్మేవారిని ప్రతినిధి చేస్తున్నారా?",
  "realtor.sellerBody":
    "మీ కస్టమర్ సముద్రతీర ఆస్తిని ధృవీకరించిన ఆధార పత్రాలు, గ్యారేజ్ స్పెక్స్ మరియు ప్రత్యేక కో-బ్రోకింగ్ కనిపింపుతో జాబితా చేయండి.",
  "realtor.listForSale": "అమ్మకానికి ఆస్తిని జాబితా చేయండి",
  "realtor.viewAllHoldings": "అన్ని ఆస్తులను చూడండి",

  // ── Onboard client sheet ────────────────────────────────────────────────
  "realtor.sheetOnboardTitle": "గోప్య కస్టమర్‌ను నమోదు చేయండి",
  "realtor.sheetBody":
    "నమోదు చేయడం ఈ కొనుగోరు మ్యాండేట్‌ను మీ ఏజెన్సీ ఐడీతో కలిపి, అన్ని 9bhk తీర భూముల్లో మీ కో-బ్రోకింగ్ కమిషన్‌ను రక్షిస్తుంది.",
  "realtor.fieldClientName": "కస్టమర్ పూర్తి పేరు / సంస్థ యాక్సర్",
  "realtor.clientNamePlaceholder": "ఉదా. విక్రమాదిత్య K లేదా సోవరిన్ ఫ్యామిలీ ట్రస్ట్",
  "realtor.fieldPhone": "ప్రత్యక్ష ఫోన్ / వాట్సాప్",
  "realtor.fieldEmailOptional": "ప్రత్యక్ష ఇమెయిల్ (ఐచ్ఛికం)",
  "realtor.fieldMinBudget": "కనిష్ఠ బడ్జెట్ (₹ Cr)",
  "realtor.fieldMaxBudget": "గరిష్ఠ బడ్జెట్ (₹ Cr)",
  "realtor.fieldCoastalStretch": "ప్రాధాన్య తీర విస్తరణ",
  "realtor.fieldGarageNeed": "వాహన & గ్యారేజ్ అవసరం",

  // ── Garage requirement options ──────────────────────────────────────────
  "realtor.optionCollectorVault": "భూమి కింద కలెక్టర్ వాల్ట్ (<7° సూపర్ కార్ ర్యాంప్)",
  "realtor.optionMarinePort": "సముద్రతీరం & మరైన్ పోర్ట్ (జెట్ స్కీ / బోట్ ట్రెయిలర్ స్లిప్)",
  "realtor.optionEvPavilion": "ఎగ్జిక్యూటివ్ ఇవి పవిలియన్ (హై అవుట్‌పుట్ 22-50kW చార్జర్లు)",
  "realtor.optionTeakPortico": "తీర టీక్ పోర్టికో (క్రూయిసర్ల కోసం నీడ పెర్గోలా)",

  // ── Mandate footer ──────────────────────────────────────────────────────
  "realtor.enforceNda": "కొనుగోరు ఎన్‌డిఎ & గోప్యతను అమల్లో చేయండి",
  "realtor.fieldMandateNotes": "మ్యాండేట్ నోట్స్ & వాహన రకాలు",
  "realtor.mandateNotesPlaceholder":
    "ఉదా. పాత ఇటాలియన్ స్పోర్ట్స్ కార్ల సంకలకుడు; ఉప్పు పాపు చేరడం గోల్యం ఉండకూడదు...",
  "realtor.leadLockActive": "నేరువైన అవకాశం లాక్ కార్యాచరణలో",
  "realtor.completeOnboarding": "నమోదును పూర్తి చేయండి",

  // ── Toasts ──────────────────────────────────────────────────────────────
  "realtor.toastNeedNamePhone": "దయచేసి కస్టమర్ పేరు మరియు ఫోన్ నంబర్‌ను అందించండి.",
  "realtor.toastClientOnboarded": "\"{name}\" నమోదు చేయబడారు. కమిషన్ హక్కులు లాక్ చేయబడ్డాయి.",
  "realtor.toastPresentationOn": "ప్రెజెంటేషన్ మోడ్ కార్యాచరణం: ప్రత్యక్ష యజమాని పరిచయాలు దాచబడ్డాయి.",
  "realtor.toastPresentationOff": "ప్రెజెంటేషన్ మోడ్ నిలిపివేయబడింది.",
  "realtor.toastClientRemoved": "కస్టమర్ {name} తొలగించబడారు",
} as const satisfies Partial<Dict>;
