# 9bhk.app — Investor Pack

> **Read this line first.** Everything in this document is sourced from the codebase as of 2026-09-29.
> Numbers marked `⚠️ FILL` are **unknown** and must be replaced with real, defensible figures before this
> document leaves your machine. Do not send a deck containing an invented metric.

---

## 0. Honest positioning statement

**What 9bhk is today:** a working, pre-launch product prototype. 25 routes, 16 passing tests, a full
schema, a trilingual UI, and a seed catalog. It has processed **₹0** in transactions and has no users.

**Current revenue:** ₹0. **ARR:** ₹0. **MRR:** ₹0.
These are true and they are the *correct* answer at this stage — say them plainly and move the
conversation to what the model becomes. Never inflate them.

**Age of the build:** first commit 2026-09-27, last 2026-09-28. This is a ~2-day build.
Lead with this as **execution velocity**, and be equally upfront that it means **zero validation**.

---

## 1. What the product actually is

A marketplace for **whole group houses** — villas, bungalows and pool houses — in **India (Tamil Nadu
focus)**, with three revenue surfaces in one product:

| Surface | What it does | Route |
|---|---|---|
| **Stays** | Discovery → search → wishlist → booking → trips → reviews | `/`, `/search`, `/saved`, `/book/[slug]`, `/trips` |
| **Buy** | Property *sales* marketplace: crore-denominated asking price, land area, title status, private viewing + acquisition LOI | `/buy`, `/property/[slug]` |
| **Realtor** | Broker portal: client roster, confidential mandates, Client Presentation Mode, co-broking commission locking | `/realtor` |

Plus host supply tooling (`/host/new`, `/host/bookings`), an admin console (`/admin`), notifications,
profile, onboarding, and a PWA shell.

### The four non-negotiable product rules (from `lib/properties.ts`, `.planning/REQUIREMENTS.md`)

1. **Three-bedroom floor.** `MIN_BEDROOMS = 3`. No hotel rooms, no serviced apartments, no studio
   rentals. Enforced in the wizard, not just the copy.
2. **Four settings, not one.** `seaside | hill_station | city | countryside`. Beachfront is a *filter*,
   never a mandate. A hill house is not a second-class listing.
3. **Honest data.** Coastal fields (`beachFrontage`, `coastalZone`, `tideDistanceMeters`) are nullable
   and **exclusive to `seaside`**. A garage is *optional* — a house without one renders a plain "no
   garage" note rather than a fabricated spec (`lib/catalog.tsx`).
4. **Confidentiality as a feature.** Realtor mandates and buyer contact details are hidden behind
   Presentation Mode; inquiries stay tagged to the sponsoring agent.

**The honest one-liner:** *"The inventory is group houses, the categorisation is honest, and the
broker's deal is protected."*

---

## 2. What genuinely differentiates this

Ordered by how defensible I judge each to be. Be honest about which tier each sits in.

### Tier 1 — structurally hard to copy (the real story)

**a) The 3-bedroom floor is a positioning moat, not a filter.**
Airbnb, Booking.com and MMT must list hotel rooms and single-room rentals — it's where their volume is.
They physically cannot adopt "whole houses only, minimum three bedrooms" without cannibalising supply.
9bhk's entire catalog *is* the thing Airbnb treats as a long-tail edge case. This is the strongest
single line in the deck.

**b) The broker portal with commission locking.**
`bhk_realtor_clients` + `commission_rate` (default `2.0`) + lead-tagging means 9bhk is the only party in
the transaction that can *prove* which agent sourced the buyer. In Indian real estate, commission
disputes are endemic and enforcement is informal. Owning the attribution rail is the closest thing here
to a defensible technical asset. It also makes realtors a **distribution channel**, not a competing
channel — every agent who onboards their book brings buyers 9bhk didn't have to acquire.

**c) Two-sided liquidity across a single supply base.**
The same villa can rent for a weekend *and* sit on the Buy tab. A stay guest becomes a sale lead, and a
stay review becomes evidence for the sale. Most marketplaces must acquire supply twice; this acquires
it once. This is a real structural advantage *if* both surfaces are live.

### Tier 2 — differentiators only if executed

**d) Trilingual by default.** 844/844 keys translated in **English, Tamil and Telugu**. Every global
OTA is English-first with translation bolted on. In the Tier-2/3 Indian villa market, that matters, and
it's genuinely rare at this stage.

**e) Deliberately restrained UI.** Vanilla CSS design system, spring-based tactile hover, zero
generic-template look. Real but cosmetic — investors will file it under "founder has taste", not "moat".

### Tier 3 — treat as a gap, not a feature

**f) The garage taxonomy.** Four types (`collector_vault`, `marine_port`, `ev_pavilion`,
`teak_portico`) with clearance and EV kW specs. It is a genuine differentiator for the
**supercar/EV-owning buyer segment**, which is exactly the segment that pays for ₹5–20 Cr estates. But
it is a *segment* play, not a platform-wide moat. Present it as such, or a sharp investor will hear
"the founder likes cars" and discount your judgement.

> **Do not claim** "we have no competitors" or "Airbnb for villas". Both are false and both cost you
> the room. The accurate claim: *"Airbnb cannot serve this segment without breaking its own supply
> model, and the specialists serving it don't protect the broker."*

---

## 3. Revenue model — the bottom-up version you can defend

The code already encodes your model. Read the constants directly from the product:

| Lever | Value | Source of truth in code |
|---|---|---|
| Stay platform fee | **8%** of stay value | `lib/i18n/keys/host.ts:209` — `"Platform fees (8%)"` |
| Realtor co-broking fee | **2.0** default rate | `supabase/migrations/20260928010000_...sql:9` — `commission_rate numeric default 2.0` |
| Seed nightly band | **₹9,500 – ₹38,000** | `lib/properties.ts` (13 distinct price points) |
| Mid nightly rate | **≈ ₹21,000** | mean of the 13 seed price points |
| Seed listings | **15** (11 seeded to Supabase) | `lib/properties.ts:89`, `_bhk_properties.sql` |
| For-sale listings | **8** | `isForSale: true` count |

### The formula

```
Net revenue per stay booking = nightly_rate × nights × 8%
Annual stay revenue        = bookings_per_year × net_revenue_per_booking
```

### Worked example — label this clearly as an ASSUMPTION, not a result

Using the seed mid-rate and a 2-night group stay:

```
₹21,000 × 2 nights = ₹42,000 GMV  →  8%  =  ₹3,360 net revenue per booking
```

**Two corrections before you present this.** (1) Your commission carries **18% GST** — so ₹3,360 gross is
~₹2,847 net of tax, and every ARR figure below is **gross commission, not take-home**. Say so out loud;
founders who understand their own tax position look competent. (2) Confirm the current accommodation GST
slab with your CA — it was revised in 2025 and depends on tariff.

Now the number that actually matters. Occupancy assumption: **40%** (⚠️ verify — replace with your real
figure the moment you have one). At 40% occupancy a villa sells 146 nights/year, and at a 2-night average
stay that is **73 bookings per villa per year**:

| To reach | Bookings/year | Bookings/day | **Villas needed** |
|---|---|---|---|
| ₹25 L ARR | ~744 | ~2.0 | **~10** |
| ₹50 L ARR | ~1,488 | ~4.1 | **~20** |
| **₹1 Cr ARR** | **~2,976** | **~8.2** | **~41** |
| ₹5 Cr ARR | ~14,880 | ~40.8 | **~204** |

**That last column is the most persuasive thing in this deck.** Forty-one villas produce ₹1 Cr ARR. You are
not asking an investor to believe in a national land-grab — you are asking whether forty-one villas in one
Tamil Nadu corridor can be signed. That is a concrete, checkable question, and it is answerable with a
supply plan rather than a hope.

**Use this framing in the room:** *"Eight bookings a day across Tamil Nadu produces ₹1 Cr ARR at an 8%
take rate. We are not asking you to believe in a new behaviour — we are asking whether eight group
bookings a day is reachable in this market."* That is a question an investor can reason about, and it
makes you look like you understand your own unit economics.

Add the sales side separately and model it at deal revenue, **not** take rate, until you have real
numbers:

```
Sale-side revenue = closed_transactions × average_commission_per_transaction
```

### ⚠️ FILL before sending

- [ ] Signed hosts on the platform (real, not seed data)
- [ ] Live listings (real, not seed data)
- [ ] Registered users / MAU
- [ ] Bookings completed, and GMV processed
- [ ] Current take rate actually collected (is the 8% real, or aspirational?)
- [ ] Realtors onboarded and clients on their rosters
- [ ] CAC by channel, and host acquisition cost
- [ ] Repeat-book rate
- [ ] Market size with a **source** (never quote a TAM you can't attribute)

---

## 4. The gaps an investor will find — fix or disclose these

These are the questions that will come, in roughly this order. Right now **every one is unanswerable
from the product.** Knowing them in advance is the difference between "early" and "not thought through".

1. **How do you actually collect the 8%?** This is the biggest one. Bookings run on **host-confirmed
   UPI with no payment gateway in the code** (`host.payoutUpiBody`). If money moves guest→host directly,
   9bhk's fee is an honour-system invoice with no enforcement. Investors will read this as *"we have no
   revenue capture"*. See **§6** for the recommended provider and integration plan.
2. **Traction.** Six commits and a seed catalog. There is no funnel, no analytics, no event tracking
   anywhere in the repo. Install product analytics **and set up the funnel before you pitch** — a
   week of real numbers beats a year of projections.
3. **Market size.** I found no sourced TAM/SAM/SOM. Get one with a citable basis.
4. **Unit economics.** CAC, host supply cost, gross margin per booking, payback period — none exist yet.
5. **Regulation.** RERA verification is in the spec but not enforced by any code path. For property
   *sales* with LOIs, expect hard questions on RERA, escrow, title verification liability, and whether
   you are a marketplace or an intermediary.
6. **Liquidity, not software.** A two-sided marketplace's risk is never the UI. It is whether supply and
   demand show up. You have 15 listings. Expect *"why will the 200th host join?"* — have a concrete
   supply-acquisition plan for a **single geography** (I'd argue ECR + Mahabalipuram only, until it
   works) before expanding to Ooty, Kodaikanal, Coimbatore et al.
7. **Team and cap table.** Nothing in the repo addresses this. Investors fund people.
8. **Data integrity check.** `MIN_BEDROOMS = 3` is a headline rule, but historical seed rows for
   `mango-orchard`, `coconut-grove` and `guava-house` carried `bedrooms: 2`
   (`20260927120000_bhk_properties.sql`). `lib/properties.ts` is now clean. Make sure every surface
   and any live DB rows enforce the floor, or an investor who pokes at the product will find a
   2-bedroom listing on a "3-bedroom minimum" platform.

---

## 5. Deck outline (14 slides)

Slide-by-slide, with what to actually say. Keep each slide to one idea.

1. **Title** — 9bhk. *Group houses, honestly categorised.* Name, contact, date.
2. **The problem** — Group travel breaks in hotel inventory: you need 3+ bedrooms, one kitchen, one
   living room, and one bill. OTAs sell you four rooms and a corridor.
3. **Why now** — Post-2021 group/pod travel, UPI ubiquity removing payment friction, and Tier-2
   domestic leisure growing faster than metro. ⚠️ FILL with sourced data.
4. **The product** — 3 screenshots: search rails + setting badge, the Buy tab, Realtor Presentation
   Mode. Show the real thing; it's the strongest asset you have.
5. **The rules** — 3-bedroom floor. Four settings. Honest data. One slide, these become the brand.
6. **Differentiation** — the Tier 1 arguments from §2. One line each.
7. **The broker rail** — commission locking as attribution infrastructure. Your most defensible slide.
8. **Business model** — the 8% + 2% slide from §3, with the formula visible.
9. **Unit economics** — revenue per booking, and the bookings/day table from §3.
10. **Traction** — you have **users but no completed bookings.** Do not hide this and do not dress it up.
    The honest slide is: *"X registered users, Y% of whom reached a property page, Z% started a booking,
    0 completed"* — and then name the reason in the same breath (no payment gateway). Framed that way,
    a 0% completion rate is **evidence of a known, funded fix**, not a demand failure. That is a much
    stronger position than a vague chart, and it reframes slide 14's use of funds as the answer to the
    problem you just admitted.
    - ⚠️ FILL: registered users, activation rate, property-page → booking-intent rate, repeat visits,
      top geography, and **how you acquired them** (this is the one investors actually grade you on).
    - Also show **build velocity** (`25 routes · 16 tests passing · 844×3 translation keys`) as a
      competence signal, but never as a substitute for users.
    - **Never fake a curve.** A visible lie in a deck is unrecoverable.
11. **Market** — TAM/SAM/SOM with sources. See **§7**.
12. **Roadmap** — payments/escrow first (see gap #1), then one geography to liquidity, then the
    sales engine, then expansion.
13. **Team** — ⚠️ FILL. Why *you* win this. Include the i18n/local-market depth as evidence.
14. **The ask** — ⚠️ FILL. Amount, runway in months, and the **3 milestones that money buys**
    (e.g. "gateway live + 50 hosts + 200 completed bookings in 9 months"). Milestones beat promises.

### Ask framing

Do not invent a valuation. Work backwards instead: *"We're raising ⚠️ to reach ⚠️ in ⚠️ months, which
gets us to the bookings volume where the 8% take produces a defensible ARR."* Tie the raise to the
₹1 Cr = ~8 bookings/day arithmetic in §3 and the ask becomes a plan, not a wish.

---

## 6. Payments — closing the revenue-capture gap

### Recommendation: **Razorpay**

The Gravity Index catalog contains **no India-native marketplace payment provider**. A targeted search for
"UPI collection + marketplace split payments + INR payouts" returned **no recommendation**, and the
reasoning is sound: Stripe, Adyen and the merchant-of-record options cannot cleanly do Indian marketplace
splits with local bank payouts. **Razorpay** is in the catalog under `Payments` and is the correct choice —
UPI/card/netbanking collection, **Route** for split settlements to host sub-accounts, and **RazorpayX** for
payouts to Indian bank accounts.

> Verify current capabilities and pricing directly with Razorpay before committing — Route eligibility,
> fees and onboarding requirements change, and this recommendation is based on the catalog listing plus
> general India-market knowledge, **not** a live integration test.

### Target architecture

```
Guest → Razorpay Checkout (Order in INR; 8% commission retained)
      → webhook payment.captured → Supabase (service role, signature-verified)
      → Razorpay Route transfer → host linked account (92%)
      → RazorpayX payout → host bank account after check-in
      → 8% settles to the platform account
```

### What this actually changes in your code

- **`payments` was never built.** `farmhouse-marketplace/DATABASE_PLAN.md` lists it, but no migration
  creates it. Add a `payments` table with a real state machine:
  `pending → authorized → captured → settled → refunded`.
- Add `host.linked_account_id` (Route sub-account) and a `payouts` table (RazorpayX transfers).
- **Booking confirmation flips from "the host confirmed UPI arrived" to "the webhook confirmed capture."**
  This is the single highest-value change available to the product: it converts an honour-system fee into
  revenue you actually collect.
- **Keep UPI as the payment method.** Guests still pay by UPI — it simply routes through the gateway.
  Hosts lose nothing operationally, and you gain enforcement. Lead with that framing; hosts resist
  "online payments" but not "same UPI, settled to your bank after check-in."

### Steps

1. Create the Razorpay account and get **test-mode** keys. Start KYC now — live-mode activation needs
   business documents and takes time. Do not let this sit on the critical path.
2. Implement Orders + Checkout + **webhook signature verification** with idempotency keys (a replayed
   webhook must never double-credit a booking).
3. Add Route linked-account onboarding for hosts.
4. Gate payout release behind check-in confirmation.
5. Test end to end in Razorpay test mode, then go live on **one** corridor.

### Non-negotiables to confirm with a CA/lawyer before you take live money

Investors ask these, and "our engineer will figure it out" is a bad answer:

- **RBI PA/PG and escrow/nodal-account rules.** Whether a marketplace may hold guest funds even briefly is
  a **regulatory** question, not an engineering one. Indian marketplace models have been shut down over
  exactly this. Confirm your structure before writing code that assumes you hold funds.
- **Who is the merchant of record** — you, or each host? This determines your GST position and your liability.
- **18% GST on your commission**, plus TDS/TCS obligations on marketplace transactions.
- **Host KYC/PAN and bank verification** for Route onboarding.
- **RERA** on the sales side once money touches a property transaction.

### Deck line (only once it is genuinely live)

*"Guests pay by UPI. Hosts are paid after check-in. We collect 8% automatically."*

---

## 7. Market sizing (sourced)

Every figure below is either **cited** or explicitly marked **⚠️ ASSUMPTION**. Never blur the two in front of
an investor — one is a fact about the world, the other is your belief, and conflating them is how founders
lose credibility in a single slide.

### TAM — India homestay / villa market

**Anchor (cite this):** NITI Aayog, *Rethinking Homestays: Navigating Policy Pathways* (Aug 2025) — India's
homestay market was **₹4,722 crore in 2024, projected 11% CAGR (2024–2031)**.

- 2026 at 11% CAGR: ₹4,722 Cr × 1.11² ≈ **₹5,800 Cr (~USD 660M)**
- ⚠️ I was blocked (HTTP 403) fetching the NITI PDF directly. **Open the source PDF yourself and quote it
  from the document** — do not repeat this number on my authority alone.

### Serviceable TAM — group-capable whole houses only

Not every homestay is a 3+ bedroom whole house, and your 3-bedroom floor is precisely what carves this out.

- **⚠️ ASSUMPTION:** 25–40% of homestay value sits in whole-house, group-capable inventory.
- Midpoint 30% of ₹5,800 Cr ≈ **₹1,745 Cr**.

### SAM — the corridor you can actually reach

Give two independent estimates. When a top-down and a bottom-up agree, investors believe both.

**Top-down:** Tamil Nadu is India's **#1 domestic destination (~140.65M domestic visits)**. At ~10% of
national homestay value → **≈ ₹175 Cr**.

**Bottom-up (lead with this one — you control every input):**

| Input | Value | Source |
|---|---|---|
| Target villas: ECR + Mahabalipuram + Pondicherry + nearby hill stations | **~1,500** | ⚠️ VERIFY — count from Airbnb/Booking listings |
| Avg nightly rate | **₹21,000** | your seed band; corroborated below |
| Occupancy | **40%** | ⚠️ ASSUMPTION |
| Nights/villa/year | 146 | 365 × 40% |
| **GMV per villa/year** | **₹30.7 L** | 146 × ₹21,000 |
| **Corridor GMV** | **≈ ₹460 Cr** | 1,500 × ₹30.7 L |
| **Platform revenue pool at 8%** | **≈ ₹37 Cr/year** | 8% of corridor GMV |

**Your seed price band is corroborated by real live listings** — use these as comparable-rate evidence:

- 2BR beach-view villa on ECR: **₹12,999 + 18% GST** / night
- Nemmeli private farmhouse: **₹9,900 weekday · ₹13,500 Friday · ₹18,200 weekend**
- Marriott Homes & Villas, Mahabalipuram 4BR: **₹40,000 Sun–Thu · ₹48,000 Fri–Sat**

Note what the last one implies: **your luxury ceiling is materially higher than your seed catalog suggests.**
The Marriott comparable is ~2× your top seed rate. That is an argument for premium positioning, and it is a
better use of the garage/EV/collector-vault taxonomy than presenting it as a platform-wide feature.

### SOM — Year 3

250 active villas (**~17% of corridor supply**) × ₹30.7 L = **₹76.7 Cr GMV** → **₹6.1 Cr platform revenue**.

Cross-check against §3: 250 villas × 73 bookings/year ≈ 18,250 bookings — which is ~6× the ₹1 Cr ARR
threshold, consistent with ₹6.1 Cr. The two sections agree, which is the point.

### Market-slide one-liner

> *"₹5,800 Cr national homestay market. ₹460 Cr of reachable GMV in one Tamil Nadu corridor, worth ₹37 Cr a
> year in platform revenue at our 8% take. **Forty-one villas gets us to ₹1 Cr ARR.**"*

### On the sales side

Keep this as a **separate** pool and do not stack it onto the stays TAM — stacking TAMs is a classic way to
get a deck dismissed. India proptech was **USD 1.31–1.72 bn (2025)** → USD 3.82–5.98 bn by 2032–34, with
broker-tech specifically at **USD 820M (2025) → USD 2,258M (2032)**. ⚠️ These analyst figures disagree with
each other by multiples. **Pick one publisher, name it, cite it, and move on.**

---

## 8. Pre-send checklist

- [ ] No invented metric anywhere in the deck
- [ ] Every number traced to a dashboard, a bank statement, or a cited source
- [ ] ARR/MRR stated as ₹0 if that is the truth, with the *model* on the next slide
- [ ] Payment capture question has a real answer (gap #1 / §6) — this is the one that kills the deal
- [ ] Every market figure is either cited (§7) or visibly labelled ⚠️ ASSUMPTION
- [ ] NITI Aayog homestay figure verified against the source PDF yourself
- [ ] GST, TDS/TCS and RBI escrow position confirmed with a CA/lawyer
- [ ] Analytics installed so next month's deck has a real funnel
- [ ] Team + cap table slides written
- [ ] One geography chosen and defended
- [ ] Deck numbers match the live product if they log in
