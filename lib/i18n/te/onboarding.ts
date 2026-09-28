// Telugu (తెలుగు) — Client onboarding surface (`app/onboarding/page.tsx`).
// Terminology: lib/i18n/GLOSSARY.md
import type { Dict } from "../en";

export const teOnboarding = {
  // ── Step 1 — role picker ────────────────────────────────────────────────
  "onboarding.marketplacePill": "ప్రత్యక్ష తీర & వాహన మార్కెట్‌ప్లేస్",
  "onboarding.heroTitle": "తీరాన్ని మీరు ఎలా అనుభవించబోతున్నారు?",
  // REVIEW: "mandate" (role/instruction being selected) has no established
  // Telugu real-estate word; transliterated for a native-speaker pass.
  "onboarding.heroBody":
    "మీ జాబితాలు, కస్టమర్ నిర్వహణ మరియు ఆర్కిటెక్చరల్ సాధనాలను వ్యక్తిగతీకరించడానికి మీ మ్యాండేట్‌ను ఎంచుకోండి.",
  "onboarding.exploreAsGuest": "అతిథిగా అన్వేషించండి",

  // ── Role cards ──────────────────────────────────────────────────────────
  "onboarding.roleBuyer": "కొనుగోరు లేదా తీర అతిథి",
  "onboarding.roleBuyerBody":
    "ధృవీకరించబడిన ప్రత్యక్ష సముద్రతీర ఇళ్లు మరియు కలెక్టర్ వాల్ట్‌లను సేకరించండి లేదా రిజర్వ్ చేయండి.",
  "onboarding.roleRealtor": "లైసెన్స్ పొందిన రియల్టర్ / బ్రోకర్",
  // REVIEW: "co-broking lock" is brokerage jargon; "co-broking" transliterated
  // per Rule 1 rather than coin-joined into a Telugu compound.
  "onboarding.roleRealtorBody":
    "బ్రాండ్‌రహిత ప్రెజెంటేషన్ మోడ్, గోప్య కస్టమర్ జాబితా మరియు 1.5%–2% కో-బ్రోకింగ్ లాక్.",
  "onboarding.roleSeller": "భూమి యజమాని లేదా అమ్మేవారు",
  "onboarding.roleSellerBody":
    "కోట్ల ప్రమాణంలో అమ్మకానికి లేదా ఎంచుకున్న సంప్రదాయ విరామాలకు ప్రత్యక్ష సముద్రతీర భూములు మరియు విల్లాలను జాబితా చేయండి.",

  // ── Role short names (continue button) ──────────────────────────────────
  "onboarding.roleBuyerShort": "కొనుగోరు",
  "onboarding.roleRealtorShort": "రియల్టర్",
  "onboarding.roleSellerShort": "భూమి యజమాని",
  "onboarding.continueAs": "{role}గా కొనసాగించండి",

  // ── Step 2 — credentials ────────────────────────────────────────────────
  "onboarding.credentialsPill": "ప్రొఫైల్ & మ్యాండేట్ వివరాలు",
  "onboarding.titleRealtor": "ఏజెంట్ & ఏజెన్సీ నమోదు",
  "onboarding.titleSeller": "భూమి ధృవీకరణ వివరాలు",
  "onboarding.titleBuyer": "మీ వెతకింపును వ్యక్తిగతీకరించండి",

  // ── Common fields ───────────────────────────────────────────────────────
  "onboarding.fieldPrincipalAgent": "ప్రధాన ఏజెంట్ పేరు",
  "onboarding.fieldFullName": "పూర్తి పేరు",
  "onboarding.namePlaceholder": "ఉదా. విక్రమాదిత్య చంద్రన్",
  "onboarding.fieldPhone": "ప్రత్యక్ష సంప్రదాభ ఫోన్",

  // ── Realtor fields ──────────────────────────────────────────────────────
  "onboarding.fieldAgency": "ఏజెన్సీ / ఫర్మ్ పేరు",
  "onboarding.agencyPlaceholder": "ఉదా. బేవ్యూ ప్రైవేట్ అడ్వైజరీ",
  "onboarding.fieldRera": "ఆర్‌ఇఈఆర్ లైసెన్స్ ఐడీ / సర్టిఫికెట్",
  // REVIEW: "co-broking attribution" (crediting the other side of a deal) has
  // no Telugu term; transliterated per Rule 1, wording left literal.
  "onboarding.reraHelp":
    "కో-బ్రోకింగ్ లక్షణం మరియు ధృవీకరించిన ఏజెంట్ చెక్‌మార్క్‌ను సక్రియం చేస్తుంది.",
  "onboarding.fieldAcquisitionRange": "సాధారణ కస్టమర్ సంపాదన పరిధి",
  "onboarding.budgetBoutique": "₹5 Cr – ₹15 Cr (బోటిక్ ఇసుకు ప్రాంతాలు)",
  "onboarding.budgetSupercar": "₹15 Cr – ₹35 Cr (సూపర్ కార్ వాల్ట్ భూములు)",
  "onboarding.budgetSignature": "₹35 Cr – ₹100+ Cr (సిగ్నేచర్ ముందుభాగాలు)",

  // ── Buyer fields ────────────────────────────────────────────────────────
  "onboarding.fieldCoastalInterest": "ప్రాధాన్య తీర ఆసక్తి",
  "onboarding.intentBoth": "కొనుగోలు & గోప్య విరామాలు రెండూ",
  "onboarding.intentBuy": "ప్రత్యక్ష ఆస్తి సేకరణ (అమ్మకానికి)",
  "onboarding.intentRent": "గోప్య సముద్రతీర విరామాలు మాత్రమే",
  "onboarding.fieldAutomotive": "వాహన సౌకర్యాలు",

  // ── Seller fields ───────────────────────────────────────────────────────
  "onboarding.fieldFrontage": "సముద్ర ముందుభాగం (రేఖీయ అడుగులు)",
  "onboarding.frontagePlaceholder": "ఉదా. అవరోధంగా సముద్రతీరం 150 అడుగులు",

  // ── Form actions ────────────────────────────────────────────────────────
  "onboarding.back": "వెనుకకు",
  "onboarding.activating": "ప్రొఫైల్ యాక్టివ్ అవుతోంది…",
  "onboarding.complete": "నమోదును పూర్తి చేయండి",

  // ── Toasts ──────────────────────────────────────────────────────────────
  "onboarding.optionCollectorVault": "భూమి కింద కలెక్టర్ వాల్ట్ (<7° ర్యాంప్)",
  "onboarding.optionMarinePort": "సముద్రతీరం & మరైన్ పోర్ట్ (బోట్ ట్రెయిలర్ స్లిప్‌వే)",
  "onboarding.optionEvPavilion": "హై-అవుట్‌పుట్ ఇవి పవిలియన్ (22kW+ DC)",
  "onboarding.optionTeakPortico": "తీర టీక్ ఓపెన్ పోర్టికో",

  // ── Toasts ─────────────────────────────────────────────────────────────
  "onboarding.toastNeedName": "దయచేసి మీ పేరును నమోదు చేయండి",
  "onboarding.toastRealtorActivated":
    "రియల్టర్ వర్క్‌స్పేస్ కార్యాచరణం. ఆర్ఇఎఆర్ వివరాలు నమోదు చేయబడ్డాయి.",
  "onboarding.toastSellerWelcome": "స్వాగతం యజమాని. భూమి జాబితాకు వెళుతున్నాము.",
  "onboarding.toastBuyerWelcome": "9bhk తీరకు స్వాగతం.",
} as const satisfies Partial<Dict>;
