# 9bhk — Feature Opportunities

Grounded in a read of the actual code on 2026-09-29: `app/search/page.tsx`, `app/host/new/page.tsx`,
`lib/properties.ts`, `lib/catalog.tsx`, `supabase/migrations/20260927100000_bhk_marketplace.sql`, and
`farmhouse-marketplace/DATABASE_PLAN.md`.

**How to read the tiers.** Tier 1 is what makes 9bhk *one of a kind*. Tier 2 is table stakes that
currently block Tier 1 from working. Tier 3 is compounding upside once the base is solid. Building Tier 1
before Tier 2 is the most common way a marketplace ships a gimmick instead of a product.

---

## Part 0 — What the code read turned up (the honest starting position)

**1. The date filter is a stub.**
`app/search/page.tsx` renders a "When" sheet containing `search.whenBody` and a **"View all dates" button
that only closes the sheet.** There is no date filtering anywhere in the search pipeline — the `results`
`useMemo` filters on query, city, setting, `active` filters, and guests. **Not dates.**

**2. Double-booking is possible.**
`bhk_bookings` has `check_in` / `check_out` but there is **no `availability` table and no overlap
constraint**. Nothing in the schema or RLS stops two guests booking the same villa for the same weekend.

**3. Your reviews are not real.**
`rating: 4.93, reviews: 96` and similar are **static seed values** in `lib/properties.ts`. There is no
`reviews` table (it's listed in `DATABASE_PLAN.md` and was never built). No guest can leave a review.

**4. Planned, never built.** From `DATABASE_PLAN.md`: `availability`, `pricing_rules`, `reviews`,
`conversations`, `messages`, `property_verifications`, `host_verifications`, `property_images`. Your
schema currently has 6 tables.

> **Why this matters more than it looks.** Your brand rule #3 is *"we don't fabricate specs."* A date
> picker that looks functional but silently ignores dates, and star ratings that came from a seed array,
> are both fabricated specs. **Fix these before pitching the honesty story**, because right now the
> honesty story is the one thing in the deck a sharp investor can falsify in one session with the app.

---

## Part 1 — The Tier 1 wedge features

### ⭐ 1. Split Pay — the group pays together, by UPI

**What it is.** The organizer books, then sends a split link to the group. Each guest pays their own share
by UPI. The host payout releases when the group is fully funded. Per-person amount, not just a total.

**Why it's one of a kind.** Airbnb has partial payment plans, but nobody in India does *social* per-person
splitting escrowed against a group stay. This is uniquely Indian (UPI makes per-person micro-collection
free) and nobody has built it.

**Why people actually want it.** A ₹42,000 villa booking is currently **one person's credit card and seven
awkward follow-up messages.** The organizer carries all the risk and does all the chasing. Split Pay
deletes the single worst part of group travel.

**Why it's worth more than the feature.** Count the loop:

```
1 booking  →  1 organizer + ~7 invited guests, each of whom must create an account to pay
```

That is a **K-factor above 1 inside the product itself** — an acquisition channel that costs nothing per
guest, at the exact moment they're most engaged (they're paying for a trip with friends). No ad channel
gets you a targeted, high-intent user for free. This is the answer to *"how do you acquire users?"* and
it's the strongest investor story available to you.

**Secondary effects:** hosts get paid reliably (the organizer can't flake), and every split is a
transaction you're already in the middle of, which makes the 8% structurally collectable.

**Effort:** medium–hard. Razorpay supports partial collection; the work is the state machine, per-person
amounts, expiry, and "who paid" tracking. **Do not hand-roll this** — build it on the gateway's
capability, not around it.

---

### ⭐ 2. The celebration layer — event-grade specs

**What it is.** Your domain promises **9 bedrooms**. Add the specs that decide whether a house can host a
real event:

| Spec | Why it decides the booking |
|---|---|
| **Power load (kW)** | Can it run a DJ, lighting and catering without tripping |
| **Sound curfew time** | Determines whether a sangeet is legal there at all |
| **Parking count** | "Parking for 50 cars" is a hard yes/no for a wedding |
| **Generator capacity** | Non-negotiable if the event can't fail |
| **Caterer kitchen access** | Can outside caterers work on site |
| **Bathroom-to-bedroom ratio** | 9 bedrooms with 3 bathrooms is a problem nobody states |

Then a filter that closes it: **"Can it host a celebration?"**

**Why it's one of a kind.** Every OTA specs homes for *sleeping*. Nobody specs them for *hosting*. This is
the same instinct that produced your garage taxonomy — and it's the instinct that's actually right: **spec
high-ticket inventory for the use case that pays for it.**

**The unit economics are the real argument.** A celebration booking is ₹1–3 lakh instead of ₹42,000. At the
same 8% that's **₹8,000–24,000 per booking instead of ₹3,360** — roughly **5× the revenue for the same
villa, the same fee, and the same integration.** It moves the ₹1 Cr ARR target from ~41 villas to
roughly **8–12**.

**Effort:** **low** — and this is the highest-leverage change available to you right now. You already have
the pattern: `GARAGE_OPTIONS` in `app/host/new/page.tsx` shows exactly how to add a structured spec set to
the wizard, and `matchesFilter` in `lib/properties.ts` shows how to expose it as a chip. Copy the pattern.
Your existing amenity list already hints at this segment: *"Projector & music"*, *"Outdoor games"*,
bonfire.

**Risk to state honestly:** celebrations bring noise, neighbour complaints, and damage. You'd need
deposit handling and a house-rules layer. Say this in the deck rather than being asked.

---

### ⭐ 3. Verified Reality — earned trust, physically inspected

**What it is.** A **9bhk-Verified** badge that can only be earned by an on-site inspection: photos
date-stamped and GPS-pinned at the property, bedroom/bathroom counts confirmed against the listing, and
exact location revealed only after booking confirmation.

**Why it's one of a kind.** Indian villa rental's defining failure is **bait-and-switch and outright
scams** — a listing with borrowed photos and a phone number. This is why the market is stuck at
phone-number-in-Instagram-bio. **A verification badge is the thing the market is actually missing**, and
it's earned with feet on the ground, not code — which makes it genuinely hard for a global platform to
match locally at speed.

**Why people want it.** Guests want to know the villa exists and the photos are real before sending
₹42,000 to a stranger. This is the trust that converts the whole market.

**Effort:** low code, **high ops**. The schema is small (`property_verifications` is already in your plan);
the cost is someone visiting villas. That's also the moat.

**Do this in one corridor first** — it's the thing that makes "one corridor to liquidity" credible.

---

## Part 2 — Tier 2: the enablers (table stakes, but currently blocking)

### 4. A real availability calendar + anti-double-booking constraint
**Fixes the stub.** Add an `availability` table and a Postgres **exclusion constraint** on
`(property_id, daterange)` so the database itself makes double-booking impossible — not application logic
you can forget to call. Then wire real date filtering into the `results` `useMemo` in
`app/search/page.tsx`, and make `host.stepBlockDatesBody` an actual calendar instead of a legend.
**This unblocks features 1, 2, 6 and 7.** Nothing above works without it.

### 5. Verified reviews, tied to completed bookings
Replace the seed `rating`/`reviews` numbers with real records. Your own plan already specifies the correct
rule: *"Reviews may be created only for eligible completed bookings."* Enforce it in the schema. This makes
your ratings **true**, which is the entire premise of the brand, and it's the social proof the Buy tab
needs for ₹16 Cr estates.

### 6. Group roster & arrival preferences
On booking, the organizer names the group: headcount, vegetarian/non-veg count, arrival times, driver
details, pool/bonfire intent. Feeds directly into split amounts (feature 1) and host prep. Turns a
transaction into a planned trip, and gives the host something no OTA gives them.

### 7. Caretaker thread per booking
In Indian villa stays the **caretaker is the actual service layer** — arrival, cook, housekeeping. A
per-booking thread (arrival timeline, meal preferences) cuts host support load and is the kind of small
operational mercy hosts switch platforms for.

---

## Part 3 — Tier 3: compounding

### 8. Host pricing intelligence
`pricing_rules` is planned and unbuilt; hosts currently set one flat `price`. Show them what peers
actually get — *"comparable villas in ECR get ₹18,200 on weekends vs ₹9,900 on weekdays"* (that spread is
real: it's the Nemmeli farmhouse's actual published rate). **This is a supply-acquisition pitch**, not a
feature: *"we'll make you more per night than the phone-number channel."*

### 9. Automatic realtor commission settlement
Extend Razorpay to actually pay the agent's 2% on close. Today you track `commission_rate` and lock
attribution; this **pays it**. It makes the phrase "provable commission" literally true, and it's the
moment the broker rail becomes infrastructure rather than bookkeeping.

### 10. WhatsApp-native booking flow
Indians book over WhatsApp. A villa card you can forward and book inside chat is a real Tier-2/3
distribution wedge. Heavy build — park it until the corridor is liquid.

---

## Recommended sequence

```
1. Availability + anti-double-booking      → unblocks everything, fixes a fabricated-looking UI
2. Celebration specs (low effort, 5× ACV)  → fastest revenue-per-villa win
3. Razorpay live + Split Pay               → the wedge, and the acquisition loop
4. Verified reviews                        → makes the brand claim true
5. Verified Reality in one corridor        → the moat, and the honest-trust story
6. Realtor commission settlement           → closes the broker loop
```

**If you build one thing, build Split Pay.** It is the only item here that simultaneously raises
conversion, de-risks the host, guarantees your own fee is collectable, and gives you a free acquisition
loop — and it's the one feature a group of eight friends would tell their friends about. Everything else
makes the product better; Split Pay makes it spread.

**But ship the availability calendar first.** Split Pay on top of a marketplace that can double-book a
villa will destroy the trust you're trying to sell.

---

## What to put in the deck

Do **not** present this as a feature list — investors discount roadmaps. Present exactly one line:

> *"A group of eight currently needs one person to front ₹42,000 and chase seven friends. We let the group
> pay by UPI, hold the funds, and release the host payout when the booking is funded. That booking brings
> seven new users into the product at the moment they're most engaged."*

That is one feature, one pain, and one acquisition channel. It's the strongest slide you have that isn't
already in the deck.
