/**
 * Tamil (தமிழ்) translations for the group-stay surfaces: date calendar,
 * celebration capacity and Split Pay.
 *
 * Terminology follows `lib/i18n/GLOSSARY.md` and the file is complete as of
 * 2026-09-29; `npm test` fails if a key is missing.
 */
export const taGroup = {
  // ── Calendar ───────────────────────────────────────────────────────────
  "calendar.checkIn": "வருகை",
  "calendar.checkOut": "புறப்பாடு",
  "calendar.apply": "தேதிகளைப் பயன்படுத்து",
  "calendar.clear": "தேதிகளை அழி",
  "calendar.body":
    "வருகை மற்றும் புறப்பாடு தேதிகளைத் தேர்ந்தெடுக்கவும். ஏற்கனவே முன்பதிவு செய்யப்பட்ட அல்லது உரிமையாளர் தடுத்துள்ள இரவுகள் சாம்பல் நிறத்தில் இருக்கும்.",
  "calendar.unavailable": "கிடைக்கவில்லை",
  "calendar.nightsOne": "{n} இரவு",
  "calendar.nightsMany": "{n} இரவுகள்",
  "calendar.nights": "இரவுகள்",
  "calendar.availableCount": "இந்தத் தேதிகளில் {n} தங்குமிடங்கள் கிடைக்கின்றன",

  // ── Celebration capacity ───────────────────────────────────────────────
  "celebration.filter": "விழாக்களுக்குத் தயார்",
  "celebration.sectionTitle": "விழா கொள்ளளவு",
  "celebration.capacityValue": "{n} விருந்தினர்கள் வரை",
  "celebration.powerValue": "{kw} கி.வா. அனுமதிக்கப்பட்ட மின் சுமை",
  "celebration.curfewValue": "{hour}:00 வரை ஒலிபெருக்கி அனுமதி",
  "celebration.parkingValue": "{n} விழா வாகன நிறுத்த இடங்கள்",
  "celebration.generatorValue": "{kw} கி.வா. காப்பு மின்னாக்கி",
  "celebration.catererYes": "வெளி உணவு வழங்குநர்கள் அனுமதிக்கப்படுவர்",
  "celebration.catererNo": "வீட்டு சமையலறை மட்டும்",
  "celebration.wizardTitle": "விழாக்கள்",
  "celebration.wizardBody":
    "இந்த வீட்டில் விழா, குடும்பக் கூட்டம் அல்லது சங்கீதம் நடத்த முடியுமா என்பதை விருந்தினர்களுக்குத் தெரிவிக்கவும். மின் சுமை, ஒலி நிறுத்த நேரம், வாகன நிறுத்த இடம் ஆகியவையே இதைத் தீர்மானிக்கின்றன.",
  "celebration.toggle": "இந்த வீட்டில் விழாக்கள் நடத்தலாம்",
  "celebration.toggleHelp":
    "சொத்தில் விழாக்களுக்கு உண்மையிலேயே அனுமதி இருந்தால் மட்டும் இதை இயக்கவும்.",
  "celebration.fieldCapacity": "அதிகபட்ச விழா விருந்தினர்கள்",
  "celebration.fieldPower": "அனுமதிக்கப்பட்ட மின் சுமை (கி.வா.)",
  "celebration.fieldCurfew": "ஒலி நிறுத்த நேரம் (24 மணி)",
  "celebration.fieldParking": "விழா வாகன நிறுத்த இடங்கள்",
  "celebration.fieldGenerator": "மின்னாக்கி (கி.வா.)",
  "celebration.fieldCatering": "உணவு ஏற்பாடு",

  // ── Split Pay ──────────────────────────────────────────────────────────
  "split.title": "பில்லைப் பிரிக்கவும்",
  "split.roster": "யார் வருகிறார்கள்?",
  "split.rosterPlaceholder": "பெயர்களை காற்புள்ளியால் பிரிக்கவும்",
  "split.body":
    "ஒவ்வொரு விருந்தினருக்கும் அவரது பங்கை அனுப்பவும். குழு முழுமையாகச் செலுத்திய பிறகு, தங்குமிடம் தொடங்கியதும் உரிமையாளருக்குப் பணம் வழங்கப்படும்.",
  "split.shareOf": "{name} பங்கு",
  "split.sendInvite": "அழைப்பை அனுப்பு",
  "split.inviteFailed": "அழைப்பு இணைப்பை உருவாக்க முடியவில்லை",
  "split.inviteTitle": "ஒரு தங்குமிடத்தின் பில்லைப் பிரிக்க நீங்கள் அழைக்கப்பட்டுள்ளீர்கள்",
  "split.inviteBody": "{organiser} {property} தங்குமிடத்தை முன்பதிவு செய்துள்ளார். உங்கள் பங்கு {amount}.",
  "split.yourShare": "உங்கள் பங்கு",
  "split.stayDates": "தங்கும் தேதிகள்",
  "split.payShare": "உங்கள் பங்கைச் செலுத்துங்கள்",
  "split.paying": "செலுத்தல் பக்கத்தைத் திறக்கிறது…",
  "split.paymentReceived": "பணம் பெறப்பட்டது. இப்போது உறுதிப்படுத்துகிறோம்.",
  "split.invalidLink": "இந்த அழைப்பு இணைப்பு செல்லுபடியாகாது",
  "split.invalidLinkBody": "அழைப்பு இணைப்புகள் காலாவதியாகும். புதிய இணைப்பை அனுப்புமாறு கேளுங்கள்.",
  "split.notLive": "பணப் பரிமாற்றம் இன்னும் தொடங்கவில்லை",
  "split.notLiveBody": "இந்த நிறுவலில் கட்டணச் சாவிகள் இல்லை, எனவே இந்தப் பங்கை இப்போது செலுத்த முடியாது.",

  "split.collected": "வசூலானது",
  "split.outstanding": "இன்னும் வசூலிக்க வேண்டியது",
  "split.paid": "செலுத்தப்பட்டது",
  "split.pending": "காத்திருக்கிறது",
  "split.markPaid": "செலுத்தியதாகக் குறி",
  "split.copyLink": "அழைப்பு இணைப்பை நகலெடு",
  "split.funded": "குழு முழுமையாகச் செலுத்தியுள்ளது",
  "split.progress": "{m} இல் {n} பேர் செலுத்தியுள்ளனர்",
  "split.payoutReady": "உரிமையாளருக்குப் பணம் வழங்கப்பட்டது",
  "split.payoutTooEarly": "வருகை நாளில் பணம் வழங்கப்படும்",
  "split.payoutUnfunded": "{n} விருந்தினர்களுக்காகக் காத்திருக்கிறது",
  "split.toastInvite": "அழைப்பு இணைப்பு நகலெடுக்கப்பட்டது",
  "split.toastPaid": "{name} செலுத்தியதாகக் குறிக்கப்பட்டது",
} as const;
