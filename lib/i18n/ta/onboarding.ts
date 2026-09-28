// Tamil (தமிழ்) — Client onboarding surface (`app/onboarding/page.tsx`).
// Terminology: lib/i18n/GLOSSARY.md
import type { Dict } from "../en";

export const taOnboarding = {
  // ── Step 1 — role picker ────────────────────────────────────────────────
  "onboarding.marketplacePill": "நேரடி கடற்கரை & வாகன சந்தை",
  "onboarding.heroTitle": "கடற்கரையை நீங்கள் எப்படி அனுபவிக்கிறீர்கள்?",
  // REVIEW: "mandate" (role/instruction being selected) has no established
  // Tamil real-estate word; transliterated for a native-speaker pass.
  "onboarding.heroBody":
    "உங்கள் பட்டியல்கள், வாடிக்கையாளர் மேலாண்மை மற்றும் கட்டடகலைக் கருவிகளைத் தனிப்பயனாக்க உங்கள் மாண்டேட்டைத் தேர்ந்தெடுக்கவும்.",
  "onboarding.exploreAsGuest": "விருந்தினராக ஆராய",

  // ── Role cards ──────────────────────────────────────────────────────────
  "onboarding.roleBuyer": "வாங்குபவர் அல்லது கடற்கரை விருந்தினர்",
  "onboarding.roleBuyerBody":
    "சரிபார்க்கப்பட்ட நேரடி கடல்முக கடற்கரை வீடுகளையும் சேகரிப்புக் கார் வைல்டுகளையும் பெறுங்கள் அல்லது முன்பதிவு செய்யுங்கள்.",
  "onboarding.roleRealtor": "உரிமம் பெற்ற ரியல்டர் / நகர்வோர்",
  // REVIEW: "co-broking lock" is brokerage jargon; "co-broking" transliterated
  // per Rule 1 rather than coin-joined into a Tamil compound.
  "onboarding.roleRealtorBody":
    "பெயரின்றி சிறப்பு முறை, தனிப்பட்ட வாடிக்கையாளர் பட்டியல் மற்றும் 1.5%–2% கோ-புரோகிங் பூட்டு.",
  "onboarding.roleSeller": "நில உரிமையாளர் அல்லது விற்பவர்",
  "onboarding.roleSellerBody":
    "கோடி மதிப்பில் விற்பனைக்காகவோ தேர்ந்தெடுக்கப்பட்ட தங்குமிரங்களுக்காகவோ நேரடி கடல்முக நிலங்களையும் விலாக்களையும் பட்டியலிடுங்கள்.",

  // ── Role short names (continue button) ──────────────────────────────────
  "onboarding.roleBuyerShort": "வாங்குபவர்",
  "onboarding.roleRealtorShort": "ரியல்டர்",
  "onboarding.roleSellerShort": "நில உரிமையாளர்",
  "onboarding.continueAs": "{role} ஆக தொடரவும்",

  // ── Step 2 — credentials ────────────────────────────────────────────────
  "onboarding.credentialsPill": "சுயவிவரம் & மாண்டேட்டு அடையாளங்கள்",
  "onboarding.titleRealtor": "முகவர் & முகவர்க்குழு பதிவு",
  "onboarding.titleSeller": "நில சரிபார்ப்பு விவரங்கள்",
  "onboarding.titleBuyer": "உங்கள் தேடலைத் தனிப்பயனாக்குங்கள்",

  // ── Common fields ───────────────────────────────────────────────────────
  "onboarding.fieldPrincipalAgent": "முதன்மை முகவரின் பெயர்",
  "onboarding.fieldFullName": "முழுப் பெயர்",
  "onboarding.namePlaceholder": "எ.கா. விக்ரமாதித்யா சந்திரன்",
  "onboarding.fieldPhone": "நேரடி தொடர்பு தொலைபேசி",

  // ── Realtor fields ──────────────────────────────────────────────────────
  "onboarding.fieldAgency": "முகவர்க்குழு / நிறுவனப் பெயர்",
  "onboarding.agencyPlaceholder": "எ.கா. பேவ்யூ நைவேட் அட்வைசரி",
  "onboarding.fieldRera": "ஆர்இஆர் லைசென்ஸ் எண் / சான்றிதழ்",
  // REVIEW: "co-broking attribution" (crediting the other side of a deal) has
  // no Tamil term; transliterated per Rule 1, wording left literal.
  "onboarding.reraHelp":
    "கோ-புரோகிங் பங்கீடு மற்றும் சரிபார்க்கப்பட்ட முகவர் குறியீட்டைச் செயல்படுத்துகிறது.",
  "onboarding.fieldAcquisitionRange": "வழக்கமான வாடிக்கையாளர் கொள்முதல் வரம்பு",
  "onboarding.budgetBoutique": "₹5 Cr – ₹15 Cr (பூட்டிக் மணற்பரப்புப் பகுதிகள்)",
  "onboarding.budgetSupercar": "₹15 Cr – ₹35 Cr (சூப்பர்கார் வைல்ட் நிலங்கள்)",
  "onboarding.budgetSignature": "₹35 Cr – ₹100+ Cr (சிறப்பு முனைப்பரப்புகள்)",

  // ── Buyer fields ────────────────────────────────────────────────────────
  "onboarding.fieldCoastalInterest": "முதன்மை கடற்கரை ஆர்வம்",
  "onboarding.intentBoth": "வாங்குதல் & தனிப்பட்ட தங்குமிரங்கள் இரண்டும்",
  "onboarding.intentBuy": "நேரடி சொத்து கொள்முதல் (விற்பனைக்கு)",
  "onboarding.intentRent": "தனிப்பட்ட கடற்கரைத் தங்குமிரங்கள் மட்டும்",
  "onboarding.fieldAutomotive": "வாகன வசதிகள்",

  // ── Seller fields ───────────────────────────────────────────────────────
  "onboarding.fieldFrontage": "கடல் முனைப்பரப்பு (நேரடி அடி)",
  "onboarding.frontagePlaceholder": "எ.கா. தடையற்ற கடற்கரை 150 அடி",

  // ── Form actions ────────────────────────────────────────────────────────
  "onboarding.back": "பின்செல்",
  "onboarding.activating": "சுயவிவரம் செயல்படுத்தப்படுகிறது…",
  "onboarding.complete": "பதிவை முடிக்கவும்",

  // ── Toasts ──────────────────────────────────────────────────────────────
  "onboarding.optionCollectorVault": "புவிக்கீழ் சேகரிப்புக் கார் வைல்ட் (<7° சாய்வுப் பாதை)",
  "onboarding.optionMarinePort": "கடற்கரை & கடல் துறைமுக வாயில் (போட் ட்ரைலர் ஸ்லிப்வே)",
  "onboarding.optionEvPavilion": "அதிக ஆற்றல் மின்வாயு மண்டபம் (22kW+ DC)",
  "onboarding.optionTeakPortico": "கடற்கரை தேக்கு மரப் திறந்த போர்க்கோ",

  // ── Toasts ─────────────────────────────────────────────────────────────
  "onboarding.toastNeedName": "தயவுசெய்து உங்கள் பெயரை உள்ளிடவும்",
  "onboarding.toastRealtorActivated":
    "ரியல்டர் பணியிடம் செயல்படுத்தப்பட்டது. ஆர்இஆர் அடையாளங்கள் பதிவு செய்யப்பட்டன.",
  "onboarding.toastSellerWelcome": "நல்வரவு, உரிமையாளர். நிலப் பட்டியலுக்குச் செல்கிறோம்.",
  "onboarding.toastBuyerWelcome": "9bhk கடற்கரைக்கு நல்வரவு.",
} as const satisfies Partial<Dict>;
