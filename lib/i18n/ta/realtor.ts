// Tamil (தமிழ்) — Realtor / broker portal surface (`app/realtor/page.tsx`).
// Terminology: lib/i18n/GLOSSARY.md
import type { Dict } from "../en";

export const taRealtor = {
  // ── Portal chrome ───────────────────────────────────────────────────────
  "realtor.portalTitle": "ரியல்டர் போர்டல்",
  "realtor.workspaceEyebrow": "நகர்வோர் & முகவர்க்குழு பணியிடம்",
  "realtor.reraVerified": "ஆர்இஆர் சரிபார்க்கப்பட்டது",
  // REVIEW: "mandate" (exclusive agency instruction) has no established Tamil
  // real-estate word; transliterated and left for a native-speaker pass.
  "realtor.mandatesTitle": "வாடிக்கையாளர் பதிவு & மாண்டேட்டுகள்",
  "realtor.agencyRera": " · ஆர்இஆர் #{rera}",

  // ── Presentation mode ───────────────────────────────────────────────────
  "realtor.presentationMode": "சிறப்பு முறை",
  "realtor.presentationActive": "சிறப்பு முறை செயலில் உள்ளது",
  "realtor.presentationDisable": "செயலிடாது",
  "realtor.presentationLive": "வாடிக்கையாளர் சிறப்பு முறை செயலில் உள்ளது",
  "realtor.presentationLiveBody":
    "நேரடி வழங்குபவர் தொடர்புகளும் அகனிலை வருவாய்களும் மறைக்கப்பட்டுள்ளன. உங்கள் வாடிக்கையாளருக்குப் பட்டியல்களைக் காட்டும்போது, உங்கள் முகவர்க்குழு அடையாளங்கள் தெரியும்.",

  // ── Stat tiles ──────────────────────────────────────────────────────────
  "realtor.statOnboardedClients": "பதிவு செய்யப்பட்ட வாடிக்கையாளர்கள்",
  // REVIEW: "lead lock" is brokerage jargon with no Tamil equivalent; used a
  // descriptive "நேரடி வாய்ப்பு பூட்டு" (direct-prospect lock) instead.
  "realtor.statLeadLock": "நேரடி வாய்ப்பு பூட்டு உறுதி",
  "realtor.statActiveMandates": "செயல்படும் மாண்டேட்டுகள்",
  "realtor.statTotalBuyingPower": "மொத்த வாங்கும் திறன்",
  "realtor.statCoastalHoldings": "கடற்கரை சொத்துகள்",
  "realtor.statBeachfrontEstates": "நேரடி கடற்கரை நிலங்கள்",
  // REVIEW: "co-broking" is industry jargon; transliterated per Rule 1 rather
  // than invented as a Tamil compound.
  "realtor.statCoBrokingFee": "கோ-புரோகிங் கமிஷன்",
  // REVIEW: "locked split" (fixed commission share) has no standard Tamil term.
  // "விளக்கம்" reads as "explanation"; the correct word for a share is
  // "பங்கு" (see GLOSSARY "Commission split"). Needs a native-speaker fix.
  "realtor.statLockedSplit": "நிலையான பூட்டிய விளக்கம்",

  // ── Client roster ───────────────────────────────────────────────────────
  "realtor.rosterTitle": "தனிப்பட்ட வாடிக்கையாளர் பட்டியல்",
  "realtor.rosterBody":
    "இங்கு பதிவு செய்யப்படும் வாடிக்கையாளர்கள் உங்கள் முகவர்க்குழு சுயவிவரத்துடன் குறியீட்டு முறையில் இணைக்கப்படுகின்றன.",
  "realtor.onboardClient": "+ வாடிக்கையாளரைப் பதிவு செய்",
  "realtor.ndaProtected": "என்டிஎ காப்புபடுத்தப்பட்டது",
  // REVIEW: "corridor" is a mapped geography term; transliterated rather than
  // forced into a general word like "பகுதி" that also means "region".
  "realtor.labelCorridor": "காரிடர்:",
  "realtor.labelAutomotiveNeed": "வாகன தேவை:",
  "realtor.addedOn": "{date} அன்று சேர்க்கப்பட்டது",
  "realtor.presentHoldings": "சொத்துகளைக் காட்டு",
  "realtor.removeClient": "அகற்று",

  // ── Seller cross-sell ───────────────────────────────────────────────────
  "realtor.sellerPrompt": "கடற்கரை நிலம் விற்பவரைப் பிரதிநி஧ித்துக்கொள்கிறீர்களா?",
  "realtor.sellerBody":
    "உங்கள் வாடிக்கையாளரின் கடற்கரைச் சொத்தைச் சரிபார்க்கப்பட்ட உரிமை ஆவணங்கள், கார் கூட விவரங்கள் மற்றும் தனிப்பட்ட கோ-புரோகிங் தெரிவுடன் பட்டியலிடுங்கள்.",
  "realtor.listForSale": "விற்பனைக்குச் சொத்தைப் பட்டியலிடு",
  "realtor.viewAllHoldings": "அனைத்து சொத்துகளையும் காட்டு",

  // ── Onboard client sheet ────────────────────────────────────────────────
  "realtor.sheetOnboardTitle": "தனிப்பட்ட வாடிக்கையாளரைப் பதிவு செய்",
  "realtor.sheetBody":
    "பதிவு செய்வது இந்த வாங்குபவர் மாண்டேட்டை உங்கள் முகவர்க்குழு எண்ணுடன் இணைத்து, அனைத்து 9bhk கடற்கரை நிலங்களிலும் உங்கள் கோ-புரோகிங் கமிஷனைப் பாதுகாக்கிறது.",
  "realtor.fieldClientName": "வாடிக்கையாளரின் முழுப் பெயர் / நிறுவனப் பெயர்",
  "realtor.clientNamePlaceholder": "எ.கா. விக்ரமாதித்யா K அல்லது சுவரின் குடும்ப அறக",
  "realtor.fieldPhone": "நேரடி தொலைபேசி / வாட்ஸ்ஆப்",
  "realtor.fieldEmailOptional": "நேரடி மின்னஞ்சல் (விருப்பம்)",
  "realtor.fieldMinBudget": "குறைந்தபட்ச பட்ஜெட் (₹ Cr)",
  "realtor.fieldMaxBudget": "அதிகபட்ச பட்ஜெட் (₹ Cr)",
  "realtor.fieldCoastalStretch": "விரும்பிய கடற்கரை நீட்சு",
  "realtor.fieldGarageNeed": "வாகன & கார் கூட தேவை",

  // ── Garage requirement options ──────────────────────────────────────────
  "realtor.optionCollectorVault": "புவிக்கீழ் சேகரிப்புக் கார் வைல்ட் (<7° சூப்பர்கார் சாய்வுப் பாதை)",
  "realtor.optionMarinePort": "கடற்கரை & கடல் துறைமுக வாயில் (ஜெட் ஸ்கை / போட் ட்ரைலர் ஸ்லிப்)",
  "realtor.optionEvPavilion": "நிர்வாகி மின்வாயு மண்டபம் (அதிக ஆற்றல் 22-50kW சார்ஜர்கள்)",
  "realtor.optionTeakPortico": "கடற்கரை தேக்கு மரப் போர்க்கோ (க்ரூசர்களுக்கான நிழல் பெர்கோலா)",

  // ── Mandate footer ──────────────────────────────────────────────────────
  "realtor.enforceNda": "வாங்குபவர் என்டிஎ & ரகசியத்தன்மையைச் செயல்படுத்து",
  "realtor.fieldMandateNotes": "மாண்டேட்டு குறிப்புகள் & வாகன வகைகள்",
  "realtor.mandateNotesPlaceholder":
    "எ.கா. பழைய இத்தாலிய விலிசல் வண்டுகளைச் சேகரிப்பவர்; உப்பு மிஸ்ட் ஊடுருவல் முற்றிலும் இல்லாதிருக்க வேண்டும்...",
  "realtor.leadLockActive": "நேரடி வாய்ப்பு பூட்டு செயலில்",
  "realtor.completeOnboarding": "பதிவை முடிக்கவும்",

  // ── Toasts ──────────────────────────────────────────────────────────────
  "realtor.toastNeedNamePhone": "தயவுசெய்து வாடிக்கையாளரின் பெயரையும் தொலைபேசி எண்ணையும் வழங்கவும்.",
  "realtor.toastClientOnboarded": "\"{name}\" பதிவு செய்யப்பட்டார். கமிஷன் உரிமைகள் பூட்டப்பட்டுள்ளன.",
  "realtor.toastPresentationOn": "சிறப்பு முறை செயல்படுத்தப்பட்டது: நேரடி உரிமையாளர் தொடர்புகள் மறைக்கப்பட்டுள்ளன.",
  "realtor.toastPresentationOff": "சிறப்பு முறை செயலிடப்பட்டது.",
  "realtor.toastClientRemoved": "வாடிக்கையாளர் {name} அகற்றப்பட்டார்",
} as const satisfies Partial<Dict>;
