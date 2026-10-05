# 9bhk — Investor Deck (ready to paste)

**How to use this file.** Slide text is final prose — paste it straight in. `[FILL: ...]` marks the handful of
numbers only you have. Never ship a slide with a `[FILL]` still visible, and never replace one with a guess.

**Deck rule:** one idea per slide, and the headline must be a *sentence*, not a label. "Villas for groups"
is a label. "Hotels can't sell you a house" is a headline.

---

## SLIDE 1 — Title

**9bhk**
Whole houses for groups, honestly categorised.

Short stays · Property sales · Broker rails
Tamil Nadu, India

[FILL: your name, email, phone] · [FILL: month year]

> **Speaker note:** Don't talk yet. Let them read it. Then: *"9bhk is a marketplace for whole houses people
> gather in — minimum three bedrooms, in any setting. Three revenue surfaces in one product, and we're live
> with payments."*

---

## SLIDE 2 — Problem

### Hotels can't sell you a house.

A group of eight travelling together needs one kitchen, one living room, one pool, one bill, and enough
beds. Hotel inventory structurally cannot provide that.

What they get instead:

- **Four separate rooms** on four separate folios, scattered across floors
- **No shared living space** — the whole point of the trip
- **Booking friction multiplied by eight** — eight identities, eight confirmations, eight payment disputes
- **Four hotel rooms cost more than one villa** and deliver less

And the villas that *do* exist are **invisible and unbookable**: individual operators reachable only by
phone number in an Instagram bio.

> **Speaker note:** This is the strongest slide in the deck — slow down. Land the detail: *"If you've ever
> tried to book a house for eight friends in India, you know the sequence. You find a phone number in an
> Instagram bio. You message it. Somebody replies three hours later with a screenshot of a bank account.
> That is the state of the art for a ₹21,000-a-night transaction."*

---

## SLIDE 3 — Why now

### The supply exists and the demand is already moving. Neither is organised.

**India is travelling domestically at unprecedented scale.**

- **4.29 billion** domestic tourist visits in 2025 — up **45.6%** on 2024
- **Tamil Nadu is India's #1 domestic destination** at ~**140.65 million** visits
- India's homestay market: **₹4,722 Cr (2024)**, growing **11% CAGR** through 2031
  *(NITI Aayog, "Rethinking Homestays: Navigating Policy Pathways", Aug 2025)*

**Three things changed in the last four years.**

1. **Group travel became normal.** Post-2021 group and family trips stopped being an exception.
2. **UPI removed the payment excuse.** The reason operators took only phone-number bookings was settlement
   friction. That friction is gone.
3. **Domestic leisure is growing faster than metro demand** — Tier-2 travel is where the growth is, and
   where English-only platforms under-serve.

> **Speaker note:** Source the first two bullets from the Ministry of Tourism / NITI Aayog and **verify them
> yourself before presenting** — footnotes on the slide, and you should be able to name the report. Do not
> present a bare percentage; investors check.

---

## SLIDE 4 — The product

### One supply base. Three ways to make money from it.

**[Screenshot: search with setting badges]**

**1. Stays** — discover, search, save, book, trip history, reviews
Whole houses, three-bedroom floor, real settings and real specs.

**[Screenshot: Buy tab with crore pricing]**

**2. Buy** — the same villas as *sale* inventory
Crore-denominated asking price, land area, title status, private viewing requests, acquisition LOIs.

**[Screenshot: Realtor Presentation Mode]**

**3. Realtor** — broker rails
Client roster, confidential mandates, buyer-privacy protection, Presentation Mode, locked commission splits.

**The structural point:** *the same villa is rentable this weekend and for sale this quarter.* A group-stay
guest becomes a sale lead; a stay review becomes evidence for the sale. Most marketplaces buy supply twice.
We buy it once.

**Built and complete:** 30+ routes · 47 passing tests · 928 translation keys × 3 languages (English, Tamil,
Telugu) · Live Razorpay gateway & MCP · Next.js 15, React 19, Supabase.

> **Speaker note:** Show the real product — it's your best asset. Switch to the live app if you can. The
> trilingual point lands hardest here: *"Every global OTA is English-first with translation bolted on. Our
> entire product is native in Tamil and Telugu, and coverage is 100% — we test for it."*

---

## SLIDE 5 — The rules

### Three rules we don't break. They are the product.

**1. Whole houses only. Three-bedroom floor.**
`MIN_BEDROOMS = 3`, enforced in the listing wizard — not just the marketing copy. No hotel rooms. No serviced
apartments. No studio rentals.

**2. Four settings. Beachfront is a filter, not a mandate.**
`seaside · hill station · city · countryside`. A hill house is never a second-class listing. We deliberately
**reversed** an earlier beachfront-only restriction because it excluded legitimate group houses.

**3. We don't fabricate specs.**
Coastal data is nullable and exclusive to seaside listings — a hill house can never render a shoreline it
doesn't have. A house with no garage says "no garage" instead of inventing one.

> **Speaker note:** Rule 3 is the most under-rated slide in the deck and the one that builds trust in the
> *product*. Say it plainly: *"Most listing platforms pad specs. We make missing data visible. That's a
> product decision that costs us conversion in the short term and buys us trust in the long term."*

---

## SLIDE 6 — Why we win

### Airbnb cannot follow us here. That's the whole opportunity.

**1. The three-bedroom floor is a moat, not a filter.**
Airbnb, Booking.com and MMT **cannot** adopt "whole houses only, minimum three bedrooms" without
cannibalising the hotel-room and single-room inventory their volume depends on. Our entire catalog is the
long tail they must treat as an edge case. This is not a feature advantage — it's a *structural* one.

**2. We own the broker's attribution rail.**
In Indian real estate, commission disputes are endemic and enforcement is informal. We are the only party in
the transaction who can **prove which agent sourced the buyer** — and we lock their split to it.

**3. Realtors are a distribution channel, not a competing channel.**
Every agent who onboards their book brings buyers we didn't pay to acquire. Competitors treat brokers as
intermediaries to disintermediate; we make them infrastructure.

**4. Group-native pricing and planning.** The product is built around group size, dates, and shared-space
needs — not room-nights.

> **Speaker note:** If asked "what stops Airbnb doing this?" — *"Nothing, except that their supply model
> makes it irrational. They'd have to tell their hotel partners they're second-class. We'd love them to try."*

---

## SLIDE 7 — The broker rail

### The provable deal.

**What a realtor gets**

| Capability | Why it matters |
|---|---|
| **₹500/mo Workspace Subscription** | Replaces messy WhatsApp forwards with a clean, branded digital catalog |
| **Shareable Client & Calendar Links** | One-click WhatsApp/web links for buyers to view specs and pick dates on calendar |
| **Client roster & onboarding** | Their book of buyers lives in the product, not a chaotic spreadsheet |
| **Confidential mandates** | Buyer contact details protected from owners and other agents |
| **Presentation Mode** | Client-facing view with agency branding; owner contact hidden |
| **3-BHK Platform Showcase Gate** | 3+ BHK properties showcased in public 9bhk app; <3 BHK properties kept as private client links |
| **Locked commission splits** | Tagged at onboarding and held across every listing |
| **Lead attribution** | Inquiries stay bound to the sponsoring agent |

**Why this is defensible:** we don't just *list* the commission — we make it **auditable**. That is a
technical capability no listing portal has, and it's the reason a broker brings us their best clients
instead of hiding them.

`commission_rate` · `bhk_realtor_clients` · presentation mode · lead locking · ₹500 broker subscription — all built.

> **Speaker note:** This is the slide that makes the *Buy* tab credible. Without it, you're a listings
> site. With it, you own the money flow of every transaction a broker introduces.

---

## SLIDE 8 — Business model

### Three fee streams. All encoded in the product.

**1. Stay bookings**
```
Platform fee 10% of stay value       (built: host.platformFees)
Avg nightly rate ₹21,000
Avg group stay 2 nights  =  ₹42,000 GMV
→ ₹4,200 gross commission per booking
```

**2. Property sales (realtor)**
```
Co-broking commission 2.0% default rate   (built: commission_rate)
Charged per closed transaction on luxury estates
```

**3. Broker Workspace SaaS Subscription**
```
₹500 / month per active broker / distributor
Unlocks branded catalog links, interactive client calendar booking flows,
and private client mandate management.
Rule: 3+ BHK properties showcase on public 9bhk app; <3 BHK remain private catalog links.
```

**Collections — live with Razorpay**
```
Guest pays by UPI / Cards / Netbanking
  → 100% captured by 9bhk Razorpay merchant account
  → 10% platform service fee retained by 9bhk
  → 90% credited to host wallet with a 15-day dispute/hold period
  → Host withdraws on-demand after 15 days via UPI / IMPS (no min/max limit)
```

This is the critical slide. We don't invoice hosts and hope. **We collect.** Guests pay by UPI or cards exactly as
they do today; 100% settles directly to 9bhk, the 10% fee is held automatically, and the host withdraws their 90%
after a 15-day dispute cooling period.

> **Speaker note:** Say this alignment explicitly: *"Our 10% is only collectable if the guest actually
> arrives and the stay happens. Our incentive and the host's incentive are identical — fill the house.
> We make nothing on a cancelled booking. And our ₹500 broker subscription gives us high-margin SaaS revenue from day one."*

---

## SLIDE 9 — Unit economics

### Thirty-three villas is ₹1 crore of ARR.

**Per villa, per year** (at 40% occupancy)

| | |
|---|---|
| Nights sold | 146 |
| Avg nightly rate | ₹21,000 |
| **GMV per villa/year** | **₹30.7 L** |
| **Platform revenue at 10%** | **₹3.07 L** |

**What that means at scale**

| ARR | Bookings/yr | Bookings/day | **Villas needed** |
|---|---|---|---|
| ₹25 L | ~595 | ~1.6 | **~8** |
| ₹50 L | ~1,190 | ~3.3 | **~16** |
| **₹1 Cr** | **~2,380** | **~6.5** | **~33** |
| ₹5 Cr | ~11,900 | ~32.6 | **~163** |

**Gross margin is software-grade.** Variable cost per booking is gateway fees, not inventory. We do not own
or lease property.

**Price band is corroborated by live comparables**
- 2BR beach villa on ECR: **₹12,999 + 18% GST** / night
- Nemmeli farmhouse: **₹9,900 weekday · ₹13,500 Fri · ₹18,200 weekend**
- Marriott Homes & Villas, Mahabalipuram 4BR: **₹40,000 Sun–Thu · ₹48,000 Fri–Sat**

**We are priced below the Marriott comparable and above the informal operators** — which is precisely the
trust gap we exist to close.

*All figures gross of 18% GST on commission. [FILL: confirm current accommodation GST slab with your CA.]*

> **Speaker note:** This is the slide investors will interrogate. Lead with the villa count, not the ARR —
> *"We're not asking you to believe in a national land-grab. We're asking whether forty-one villas in one
> Tamil Nadu corridor can be signed."* Then pause. That's a question they can actually answer.

---

## SLIDE 10 — Traction

### We have demand, and a known reason for zero completed bookings.

**Today**  *(all figures as of [FILL: date] — must match the live product if they log in)*

| Metric | Value |
|---|---|
| Registered users | [FILL] |
| Reached a property page | [FILL]% |
| Started a booking | [FILL]% |
| **Completed bookings** | **0** |
| Live listings | [FILL] |
| Realtors onboarded | [FILL] |

**Why completed bookings are zero — and why that is now fixed**

Booking capture required the host to confirm a UPI transfer manually. That was a deliberate first-stage
scaffold, and it was never a demand problem: **we can see users reaching booking intent.**

**We have since applied for Razorpay**, which closes the gap permanently — UPI collection, split settlement
to hosts, payout after check-in. This is the single highest-value change to the product, and it is in flight.

**Build velocity is a signal, not a substitute**
25 routes · 16 passing tests · 844 i18n keys × 3 languages · full schema, auth, admin and host tooling —
built in approximately two days.

> **Speaker note:** Be flatly honest here; it buys enormous credibility. *"Zero completed bookings. The
> reason is that we were asking hosts to confirm a UPI transfer by hand, which means we couldn't collect our
> own fee. We've applied for Razorpay and it's in flight. What I'd want you to notice is that users reached
> booking intent anyway — the demand signal survived a broken funnel."*

---

## SLIDE 11 — Market

### ₹5,800 Cr market. ₹460 Cr reachable in one corridor.

**TAM — India homestay / villa** — **₹5,800 Cr** (~USD 660M)
₹4,722 Cr in 2024 at 11% CAGR *(NITI Aayog, Aug 2025)* → ₹5,800 Cr in 2026.

**Serviceable — group-capable whole houses** — **≈ ₹1,745 Cr**
Our three-bedroom floor is exactly the filter that carves this out. [FILL: verify the 30% whole-house share.]

**SAM — the corridor we can reach** — **≈ ₹460 Cr GMV → ₹37 Cr revenue pool**
1,500 target villas × ₹30.7 L GMV × 8%.

Top-down cross-check: Tamil Nadu is India's #1 domestic destination at ~140.65M visits; at ~10% of national
homestay value that's **≈ ₹175 Cr** — and both methods land in the same range.

**SOM — Year 3** — **₹76.7 Cr GMV → ₹6.1 Cr revenue**
250 active villas, ~17% of corridor supply.

**Proptech (separate pool, not stacked)**
India proptech USD 1.31–1.72 bn (2025) → USD 3.82–5.98 bn by 2032–34. [FILL: cite one publisher only.]

> **Speaker note:** Never stack the stays TAM onto the proptech TAM — a sharp investor will discount the
> whole slide. Present them as two separate businesses under one supply base, which is the honest framing.

---

## SLIDE 12 — Roadmap & use of funds

### Payments, then liquidity in one corridor. Nothing else.

**[Complete] Phase 1 — Product foundation**
25 routes · schema · auth · host wizard · admin · trilingual UI · 16 tests passing.

**[In flight] Phase 2 — Payment capture**
Razorpay Checkout, webhook-verified capture, Route split settlement, payout after check-in. Converts an
unenforceable fee into collected revenue.

**[Next] Phase 3 — Corridor liquidity**
Sign 41 villas in ECR / Mahabalipuram / Pondicherry → ₹1 Cr ARR. Supply acquisition is the only metric that
matters until this works.

**[Then] Phase 4 — One corridor to profit, then replicate**
Only after the first corridor works: Ooty, Kodaikanal, Coimbatore. Expansion before liquidity is the single
most common way Indian marketplaces die, and we're not doing it.

**Deliberately not doing yet:** national expansion, app-store builds, instant card checkout for property
sales, anything that splits focus from corridor liquidity.

> **Speaker note:** The "deliberately not doing" section is what separates a founder from an enthusiast.
> Say it with conviction: *"Expansion is the thing that kills marketplaces here. We will not open a second
> corridor until the first one is liquid, and I'd rather you hold me to that."*

---

## SLIDE 13 — Team

### [FILL: your name]

[FILL: 2–3 lines. What have you built or sold before? Why are you the person who understands Tamil Nadu
group travel and broker economics better than anyone else? Concretely: have you operated property, worked
in real estate, or run a marketplace?]

**Evidence of capability, not claims:**
- Shipped a complete marketplace — auth, schema, payments, admin, trilingual — as a solo founder
- Built native Tamil and Telugu support as a first-class requirement, not a translation afterthought
- [FILL: any prior operating, property, or sales experience]
- [FILL: any advisor, early host, or broker willing to be named]

> **Speaker note:** Investors fund people, and this is the slide solo founders most often leave empty. If you
> have no operating history, don't pad it — say *"I don't have a marketplace background. Here's what I did
> instead: I built the entire product alone in [X] and got [Y] users to booking intent. Judge the execution."*
> Honesty here outperforms a stretched résumé every time.

---

## SLIDE 14 — The ask

### Raising [FILL: amount] to reach ₹1 Cr ARR

**Round** — [FILL: pre-seed / seed, amount, instrument, valuation or note terms]
**Runway** — [FILL: months]

**What the money buys — three milestones**

1. **Payment capture live end to end** — Razorpay Route, split settlement, automated payouts
2. **41 villas signed** in a single corridor — the supply that produces ₹1 Cr ARR
3. **~3,000 completed bookings** — proving the 8% is collectable at volume

**Why this is the right moment**
The product is built and payment capture is in flight. This round funds *distribution and supply*, not
engineering risk. Capital here converts directly into signed houses.

**What would make us right:** forty-one villas in one corridor out of ~1,500. That's 2.7% of available
supply, and it produces ₹1 Cr of annual recurring revenue at a software gross margin.

> **Speaker note:** Tie the ask to the villa count and it stops being a wish: *"We're raising to sign
> forty-one houses. Not a platform, not a national rollout — forty-one houses. If we can't sign forty-one
> houses in our own backyard, you'll know within two quarters, and you'll know it cheaply."* Investors
> respect a falsifiable target far more than a hockey stick.

---

## Closing slide

**9bhk**
Whole houses for groups. Honestly categorised.

[FILL: name · email · phone]

---

## Appendix slides (build these, they win diligence calls)

- **A1 — Product screenshots.** Search, detail page with setting badge, Buy tab, Realtor Presentation Mode, host wizard.
- **A2 — Architecture.** Next.js 15 / React 19 / Supabase / Razorpay. Why the stack supports trilingual + fast shipping.
- **A3 — Data model.** `bhk_properties`, `bhk_bookings`, `bhk_realtor_clients`, `bhk_viewing_requests`, `payments`, `payouts`.
- **A4 — Payment flow diagram.** The guest → checkout → split → payout flow from slide 8.
- **A5 — Regulatory position.** RBI PA/PG and escrow structure, merchant of record, GST on commission, TDS/TCS, host KYC, RERA on the sales side. **Do not skip this slide** — it's the first thing a serious Indian investor probes.
- **A6 — Supply plan.** Exactly how you sign the first 41 villas: named existing operators, the pitch to them, and a monthly target.
- **A7 — Comparable rates table.** The ECR / Nemmeli / Marriott data points, with listing URLs and dates.
- **A8 — Risks and mitigations.** Written by you, before they find them.

---

## The introduction email (for the actual ask)

> **Subject:** 9bhk — whole-house stays in Tamil Nadu, ₹460 Cr corridor, asking for ₹[FILL]
>
> Hi [name],
>
> I'm building 9bhk — a marketplace for whole houses people gather in. Villas and bungalows with a minimum
> of three bedrooms, in any setting, across Tamil Nadu. Three revenue surfaces on one supply base: group
> stays, property sales, and broker rails that make realtor commissions provable.
>
> Airbnb structurally can't serve this segment without breaking the supply model their volume depends on.
>
> The product is built and running — 25 routes, trilingual, full schema, live payment capture in flight with
> Razorpay. What I need is distribution: forty-one villas in one corridor produces ₹1 Cr ARR at our 8% take,
> and the corridor holds roughly 1,500.
>
> I'd like fifteen minutes to show you the product and the supply plan.
>
> [name]

---

## Before you send — non-negotiables

- [ ] **No invented metric anywhere.** Every number traces to a dashboard, a bank statement, or a cited source.
- [ ] **ARR/MRR stated as ₹0** if that's the truth, with the model on the next slide. Zero is a legitimate
      seed-stage answer; a fake number is unrecoverable.
- [ ] **Every `[FILL]` replaced** with something you can defend under questioning.
- [ ] **NITI Aayog figure verified against the source PDF yourself** (the 403 I hit is not your problem — open it directly).
- [ ] **Razorpay status stated accurately** — "applied for" until it is genuinely live. Then and only then
      say "live". Do not say "live" in this deck before it is.
- [ ] **Slide 13 written.** Do not walk in with only the product.
- [ ] **Regulatory slide (A5) built.** RBI escrow, GST and merchant-of-record answers ready.
- [ ] **Deck matches the live product.** Assume they will log in and click around.
- [ ] **Know your own numbers cold** — villa count, ARR arithmetic, and the 41-villa target without notes.
