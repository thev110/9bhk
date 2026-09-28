# Translation glossary — Tamil & Telugu

Shared terminology for the 9bhk catalog. Consistency matters more than
literalism: the same English string must produce the same word in every
surface, or the app reads like it was machine-generated (it partly was).

## Rule 1 — transliterate brands, acronyms and technical taxonomy

Indian real-estate users read these in the target script, not as English
words. Do **not** translate the meaning.

| English | தமிழ் | తెలుగు |
|---|---|---|
| Collector Vault | சேகரிப்புக் கார் வைல்ட் | కలెక్టర్ వాల్ట్ |
| Marine Port | கடல் துறைமுக வாயில் | మరైన్ పోర్ట్ |
| EV Pavilion | மின்வாயு மண்டபம் | ఇవి పవిలియన్ |
| Teak Portico | தேக்கு மரப் போர்க்கோ | టీక్ పోర్టికో |
| Supercar | சூப்பர்கார் | సూపర్ కార్ |
| RERA | ஆர்இஆர் | ఆర్ఇఎఆర్ |
| CRZ | சிஎர்செட் | సిఆర్జెడ్ |
| UPI | யுபிஐ | యుపిఐ |
| LOI | எல்ஓஐ | ఎల్‌ఓఐ‌ |
| OTA | ஓடிஏ | ఓటీఏ |
| Google | Google | Google |
| RERA License ID | ஆர்இஆர் லைசென்ஸ் எண் | ఆర్‌ఇఈఆర్ లైసెన్స్ ఐడీ |

## Rule 2 — use established native vocabulary for everyday UI

| English | தமிழ் | తెలుగు |
|---|---|---|
| Buy | வாங்கு | కొనండి |
| Sell | விற்க | అమ్మండి |
| Save (favourite) | சேமி | భద్రపరచండి |
| Wishlist | விருப்பப் பட்டியல் | ఇష్టమైన జాబితా |
| Trips / trip | பயணம் | ప్రయాణం |
| Guest | விருந்தினர் | అతిథి |
| Book / booking | முன்பதிவு | బుకింగ్ |
| Payment | கட்டணம் | చెల్లింపు |
| Night | இரவு | రాత్రి |
| Host | வழங்குபவர் | హోస్ట్ |
| Buyer | வாங்குபவர் | కొనుగోరు |
| Seller | விற்பவர் | అమ్మేవారు |
| Realtor | ரியல்டர் | రియల్టర్ |
| Broker | நகர்வோர் | బ్రోకర్ |
| Agency / firm | முகவர்க்குழு | ఏజెన్సీ |
| Commission | கமிஷன் | కమిషన్ |
| Commission split | கமிஷன் பங்கு | కమిషన్ విభజన |
| Client | வாடிக்கையாளர் | కస్టమర్ |
| Location | இருப்பிடம் | స్థానం |
| City | நகரம் | నగరం |
| Beach | கடற்கரை | సముద్రతీరం |
| Estate | நிலம் | భూమి |
| Property | சொத்து | ఆస్తి |
| Search | தேடு | వెతకండి |
| Filter | வடிகட்டு | ఫిల్టర్ |
| Cancel | ரத்துசெய் | రద్దు చేయండి |
| Continue | தொடரவும் | కొనసాగించండి |
| Confirm | உறுதிசெய் | నిర్ధారించండి |
| Phone | தொலைபேசி | ఫోన్ |
| Email | மின்னஞ்சல் | ఇమెయిల్ |
| Password | கடவுச்சொல் | పాస్‌వర్డ్ |
| Sign in | உள்நுழை | సైన్ ఇన్ |
| Sign out | வெளியேறு | సైన్ అవుట్ |
| Total | மொத்தம் | మొత్తం |
| Available | கிடைக்கும் | అందుబాటులో |
| Pending | நிலுவையில் | పెండింగ్‌లో |
| Confirmed | உறுதிப்படுத்தப்பட்டது | నిర్ధారించబడింది |
| Cancelled | ரத்து செய்யப்பட்டது | రద్దు చేయబడింది |
| Completed | முடிந்தது | పూర్తయింది |
| Awaiting | காத்திருக்கிறது | వేచి ఉంది |
| Earning / payout | வருவாய் | ఆదాయం |
| Photo | படம் | ఫోటో |
| Description | விவரம் | వివరణ |
| Address | முகவரி | చిరునామా |
| Price | விலை | ధర |
| Area | பரப்பு / நிலப்பரப்பு | విస్తీర్ణం |
| Frontage | முனைப்பரப்பு | ముందుభాగం |
| Boundary | எல்லை | పరిధి |
| Clearance | அனுமதி | అనుమతి |
| Title (legal) | உரிமை | ఆధారం |
| Survey | ஆய்வு | సర్వే |
| Inspection | ஆய்வு | తనిఖీ |
| Listing | பட்டியல் | జాబితా |
| Onboard (client) | பதிவு செய் | నమోదు చేయండి |
| Presentation mode | சிறப்பு முறை | ప్రెజెంటేషన్ మోడ్ |

## Rule 3 — register and sentence style

- **Tamil:** formal-but-warm register. Use `எது` / `ஐ` accusative endings naturally
  (e.g. "முன்பதிவை முடிக்கவும்"). Avoid stiff textbook English-order sentences.
- **Telugu:** natural spoken-register UI copy. Verb-final order.
- Both: use the native `இ`/`లో` style of writing dates and numbers the way a
  local app would, but **keep ₹ amounts in `en-IN` lakh/crore grouping**
  (the app already does this and it must not change).
- Placeholders (`{n}`, `{name}`, `{ft}`) must be preserved **exactly** and in
  the same position, because `translate()` substitutes by name.

## Rule 4 — what must stay identical

- `9bhk.app`, `hello@9bhk.app`, `Coromandel Coastal Advisory`
- `⌘K`, `°`, `₹`, `·`, `→`, `▲`, `ESC`
- City names: Chennai, ECR, Mahabalipuram, Chengalpattu, Kanchipuram, Pondicherry
- RERA number and phone-format examples
- Garage type slugs, option `value=` attributes, enum values, DB column names
- CSV export headers

## Flag for native review

If a string has no confident natural equivalent, **do not invent one**. Use
`/* REVIEW: reason */` on the line above the entry and pick the closest
standard term. `npm test` and the catalog owner will collect these for a
native-speaker pass. Wrong-but-confident is the failure mode we are avoiding.
