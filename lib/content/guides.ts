/**
 * Editorial content model for guides.
 *
 * Kept as typed data rather than a database table so every guide is
 * server-rendered, statically generated and available to the sitemap without a
 * running Supabase instance. The shape is deliberately the one described in
 * the brief — `seoTitle` / `seoDescription` / `canonical` / `noindex` are
 * optional and auto-derived when absent, so an editor never has to duplicate
 * metadata by hand.
 *
 * A matching additive Postgres migration ships in
 * `supabase/migrations/20260930000000_seo_content_model.sql` for when the team
 * wants guides editable from the admin surface. The field names line up 1:1
 * with the columns, so moving is a copy, not a rewrite.
 */

import type { CategorySlug } from "@/lib/seo/taxonomy";

export type GuideStatus = "published" | "draft";

export type GuideBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "factbox"; title: string; items: Array<{ label: string; value: string }> }
  | { kind: "link"; href: string; label: string; note?: string };

export type Guide = {
  slug: string;
  title: string;
  /** The H1. Kept equal to `title` unless a page needs a tighter headline. */
  h1?: string;
  /** One-paragraph summary used for listings, meta fallbacks and related links. */
  excerpt: string;
  /** Block body. No keyword blocks; every claim traces to inventory or geography. */
  body: GuideBlock[];
  /**
   * Author attribution. `9bhk editorial` is a brand byline, not a named person —
   * swap in a real author when one exists.
   * TODO(business-data): add `authorName` / `authorUrl` once a named writer
   * with a public profile is available.
   */
  author: string;
  publishedAt: string;
  updatedAt: string;
  /** Destination slugs this guide is about — drives guide ↔ location links. */
  locations: string[];
  /** Stay-type slugs this guide covers. */
  categories: CategorySlug[];
  /** Listing ids referenced by the guide, for guide → property links. */
  relatedProperties: string[];
  /** Slugs of other guides, for guide → guide links. */
  relatedGuides: string[];
  /** Extra Q&A that cannot be derived from inventory. */
  faq: Array<{ question: string; answer: string }>;
  image: string;
  imageAlt: string;
  status: GuideStatus;
  /** Optional editor overrides; auto-derived when omitted. */
  seoTitle?: string;
  seoDescription?: string;
  canonical?: string;
  noindex?: boolean;
};

/**
 * Published guides.
 *
 * These are written to answer real planning questions using the actual 9bhk
 * catalog. There is deliberately no keyword-driven generator here — a guide
 * earns a place in this array by having something useful to say that the
 * listing data alone cannot say.
 */
export const GUIDES: Guide[] = [
  {
    slug: "ecr-weekend-stays",
    title: "Choosing a private stay on the ECR for a weekend",
    h1: "Choosing a private stay on the ECR for a weekend",
    excerpt:
      "What actually differs between the ECR houses on 9bhk — frontage, capacity, pool, garage — and how to pick the one that fits the group you are bringing.",
    author: "9bhk editorial",
    publishedAt: "2026-09-28",
    updatedAt: "2026-09-28",
    locations: ["ecr", "chennai"],
    categories: ["beach-houses", "farmhouses"],
    relatedProperties: ["bay-breakers-vault", "kovalam-dune-residence", "mahabs-dune-residence"],
    relatedGuides: ["mahabalipuram-weekend", "private-stays-near-chennai"],
    faq: [
      {
        question: "How far is the ECR from central Chennai?",
        answer:
          "The ECR is the coastal highway running south out of Chennai toward Mahabalipuram, so the drive is entirely on highway rather than through city traffic. Exact travel times are shown on each destination page once they are verified.",
      },
      {
        question: "Should I book an ECR property with beach frontage?",
        answer:
          "If the sand is the point of the trip, book on frontage. Listings that declare it show the frontage in feet, the coastal zone and the distance from the high-tide line, so you can tell direct oceanfront from a dune-edge house before you enquire.",
      },
      {
        question: "Can we drive down for a night and still have a house to ourselves?",
        answer:
          "Yes — every 9bhk listing is a whole house taken exclusively, which is the reason the category is built around three bedrooms minimum rather than individual rooms.",
      },
    ],
    body: [
      {
        kind: "p",
        text: "The East Coast Road is the one stretch where Chennai escapes turn into a beach weekend without any planning. The problem is not finding a house — it is telling two listings apart when both say \"near the beach\". This guide is about the fields that actually differ.",
      },
      { kind: "h2", text: "Frontage is the first thing to read" },
      {
        kind: "p",
        text: "9bhk only publishes a frontage figure when the host has entered one, and 9bhk records the coastal zone alongside it. A direct oceanfront house and a dune-edge sanctuary are different products at the same headline price, and the listing tells you which one it is before you make an enquiry.",
      },
      {
        kind: "factbox",
        title: "What the ECR listings on 9bhk declare",
        items: [
          { label: "Frontage", value: "Recorded in feet, per listing" },
          { label: "Coastal zone", value: "Direct oceanfront, dune edge or cove" },
          { label: "High-tide distance", value: "Recorded in metres, per listing" },
          { label: "Capacity", value: "Guests, bedrooms and bathrooms per listing" },
          { label: "Pool", value: "Only where the host lists it as an amenity" },
        ],
      },
      { kind: "h2", text: "Capacity is the second filter" },
      {
        kind: "p",
        text: "Because these are whole houses, bedrooms run from four upward on the coastal listings. Check the guest count against the number of people actually coming, not the number of beds — two families sharing a house usually care more about bathrooms and common space than about a fourth bedroom.",
      },
      { kind: "h2", text: "The houses have a second, unusual feature" },
      {
        kind: "p",
        text: "Several of the coastal 9bhk listings carry a garage spec — a sealed, climate-controlled vehicle vault or a covered port with a low-approach ramp. If you are driving down rather than flying and taking the vehicle, that is worth filtering on directly; if you are not, it is simply a detail you can skip.",
      },
      { kind: "h2", text: "How to book without wasting a weekend" },
      {
        kind: "ol",
        items: [
          "Shortlist two or three houses by frontage and capacity, not by price alone.",
          "Open each listing and read the amenity list — the pool, the kitchen and the caretaker arrangements are all there.",
          "Send the booking request with your dates. A request is not a confirmed booking until the host confirms it.",
          "Pay the UPI ID the host publishes, and keep the confirmation for the refund window.",
        ],
      },
      {
        kind: "link",
        href: "/locations/ecr",
        label: "See every ECR stay on 9bhk",
        note: "Inventory, prices and the local FAQs in one place.",
      },
    ],
    image: "/assets/prop-blue-horizon.jpg",
    imageAlt: "Open coastal view over the sea from a private stay on the East Coast Road",
    status: "published",
  },
  {
    slug: "mahabalipuram-weekend",
    title: "A weekend in Mahabalipuram: what to book and what to do",
    h1: "A weekend in Mahabalipuram: what to book and what to do",
    excerpt:
      "Mahabalipuram is the natural stop on the Chennai–Pondicherry run. Here is how 9bhk's inventory there compares, and the practical shape of a two-day trip.",
    author: "9bhk editorial",
    publishedAt: "2026-09-28",
    updatedAt: "2026-09-28",
    locations: ["mahabalipuram"],
    categories: ["beach-houses", "villas"],
    relatedProperties: ["mahabs-dune-residence", "bay-breakers-vault", "pondicherry-promenade-house"],
    relatedGuides: ["ecr-weekend-stays", "pondicherry-weekend-from-chennai"],
    faq: [
      {
        question: "Is Mahabalipuram a day trip or an overnight?",
        answer:
          "It works as an overnight if you want the town at a time when the day-trippers have gone. The 9bhk listings there sit on the coastal side of the town, close enough to reach the sand on foot.",
      },
      {
        question: "Can I combine Mahabalipuram and Pondicherry in one trip?",
        answer:
          "Yes — they sit on the same coastal run, with Mahabalipuram first and Pondicherry further south. Booking one stay at either end and driving between is the usual pattern.",
      },
    ],
    body: [
      {
        kind: "p",
        text: "Mahabalipuram is a working town first — fishing boats, a temple complex cut into the rock, a beach that fills up by mid-morning. Staying rather than day-tripping is the whole point: the hour after sunset and the hour before breakfast are the parts of Mahabalipuram that are not a day trip.",
      },
      { kind: "h2", text: "The stays 9bhk has in Mahabalipuram" },
      {
        kind: "p",
        text: "The 9bhk inventory in Mahabalipuram is small and specific. Read the frontage and the coastal zone on the listing rather than assuming a beach house here is the same as a beach house on the ECR — the coastline here is different ground, and the listings record it that way.",
      },
      {
        kind: "factbox",
        title: "Reading a Mahabalipuram listing",
        items: [
          { label: "Beach frontage", value: "Where the host has recorded it" },
          { label: "Coastal zone", value: "Direct oceanfront, dune edge or cove" },
          { label: "High-tide distance", value: "Metres, per listing" },
          { label: "Capacity", value: "Guests, bedrooms, bathrooms" },
        ],
      },
      { kind: "h2", text: "Shape of a two-day weekend" },
      {
        kind: "ol",
        items: [
          "Arrive on the first afternoon, before the day-trip traffic has fully built.",
          "Use the evening for the town itself — the rock-cut monuments and the beach are both far better once the coaches have gone.",
          "Take the long way back along the coast rather than turning inland immediately.",
          "If you are heading further south, Pondicherry is the natural next stop on the same road.",
        ],
      },
      {
        kind: "link",
        href: "/locations/mahabalipuram",
        label: "Browse Mahabalipuram stays",
      },
      {
        kind: "link",
        href: "/guides/ecr-weekend-stays",
        label: "Compare with ECR stays",
        note: "The coastline north of Mahabalipuram is a different product.",
      },
    ],
    image: "/assets/prop-sunset-fields.jpg",
    imageAlt: "Evening light over an open coastal field near Mahabalipuram",
    status: "published",
  },
  {
    slug: "pondicherry-weekend-from-chennai",
    title: "Pondicherry as a weekend from Chennai: which stay to take",
    h1: "Pondicherry as a weekend from Chennai: which stay to take",
    excerpt:
      "White Town, the Promenade, or the quieter coastline south of it? How the 9bhk Pondicherry listings split, and how to choose between them.",
    author: "9bhk editorial",
    publishedAt: "2026-09-28",
    updatedAt: "2026-09-28",
    locations: ["pondicherry"],
    categories: ["farmhouses", "beach-houses"],
    relatedProperties: ["pondicherry-promenade-house", "hosur-orchard-farmhouse"],
    relatedGuides: ["mahabalipuram-weekend", "private-stays-near-chennai"],
    faq: [
      {
        question: "How do you get from Chennai to Pondicherry?",
        answer:
          "By road on the East Coast Road, or by rail to Pondicherry station. The 9bhk listings sit on the coastal side of the territory rather than inside the town centre, so allow for the last stretch.",
      },
      {
        question: "Should I stay in White Town or on the coast?",
        answer:
          "White Town if the walkability and the restaurants are the point. The coastal listings suit a stay where the priority is the house and the grounds rather than dinner on foot.",
      },
    ],
    body: [
      {
        kind: "p",
        text: "Pondicherry is a Union Territory rather than a district of Tamil Nadu, and the difference is visible in how the coast behaves: the Promenade and White Town are one pocket, and the coastline south of them is a different, quieter stretch entirely.",
      },
      { kind: "h2", text: "What 9bhk lists in Pondicherry" },
      {
        kind: "p",
        text: "The Pondicherry inventory on 9bhk covers a seaside estate on the bluff and courtyard and farm-stay houses set back from the beach road. The practical difference is how much of the trip happens at the house.",
      },
      {
        kind: "factbox",
        title: "Two ways to spend the weekend",
        items: [
          { label: "On the bluff", value: "Coastal estate, close to the town" },
          { label: "Set back", value: "Courtyard and farm-stay houses, more ground" },
        ],
      },
      { kind: "h2", text: "Driving down and back" },
      {
        kind: "p",
        text: "Plenty of people do this as a drive. If you are booking a whole house either way, the difference that matters is the return journey on a Sunday evening, not the distance — plan the timing around the highway rather than around the map.",
      },
      {
        kind: "link",
        href: "/locations/pondicherry",
        label: "See every Pondicherry stay",
      },
    ],
    image: "/assets/prop-lakeview-courtyard.jpg",
    imageAlt: "Courtyard house opening toward the water near Pondicherry",
    status: "published",
  },
  {
    slug: "private-stays-near-chennai",
    title: "What kind of private stay are you actually looking for near Chennai?",
    h1: "What kind of private stay are you actually looking for near Chennai?",
    excerpt:
      "Coast, city or countryside — a commercial-investigation guide to the 9bhk inventory around Chennai, with the trade-offs between each setting spelled out.",
    author: "9bhk editorial",
    publishedAt: "2026-09-28",
    updatedAt: "2026-09-28",
    locations: ["chennai", "ecr"],
    categories: ["beach-houses", "villas", "farmhouses"],
    relatedProperties: [
      "bay-breakers-vault",
      "neelankarai-marine-pavilion",
      "adyar-courtyard-villa",
      "muttukadu-cove-haven",
    ],
    relatedGuides: ["ecr-weekend-stays", "pondicherry-weekend-from-chennai"],
    faq: [
      {
        question: "Should I book on the coast or inland for a family stay?",
        answer:
          "Coast if the plan is outdoor time and the sand. Inland if the plan is a quiet house with grounds and a shorter, cheaper trip — the countryside listings near Kanchipuram and Hosur sit further from the city but cost less per night.",
      },
      {
        question: "How do I know a house sleeps enough people?",
        answer:
          "Every 9bhk listing shows guests, bedrooms and bathrooms separately. Check the guest count against the number of people actually coming, and the bathroom count as well — two families sharing a house usually run out of bathrooms first.",
      },
    ],
    body: [
      {
        kind: "p",
        text: "The 9bhk catalog around Chennai splits into three settings, and they are genuinely different products rather than three price bands of the same house.",
      },
      { kind: "h2", text: "Coast — the ECR and the beach road" },
      {
        kind: "p",
        text: "Seaside listings carry frontage, coastal zone and high-tide distance where the host has recorded them, and they run to the largest capacities on 9bhk. This is the setting for a group that wants the sand as the activity.",
      },
      { kind: "h2", text: "City — Adyar and Velachery" },
      {
        kind: "p",
        text: "In-city villas trade the ocean for proximity. They suit a shorter stay, a family that wants to be inside the city in the evenings, and a group that would rather walk to dinner than drive.",
      },
      { kind: "h2", text: "Countryside — Kanchipuram and Hosur" },
      {
        kind: "p",
        text: "Orchard and farm-stay houses inland are the longest drive and the lowest nightly rate, with the most ground. They are the setting for a long weekend where the house and the grounds are the plan.",
      },
      {
        kind: "factbox",
        title: "Compare on these five fields",
        items: [
          { label: "Setting", value: "Coast, city or countryside" },
          { label: "Guests", value: "Sleeping capacity as entered" },
          { label: "Bedrooms", value: "Separate from guest count" },
          { label: "Amenities", value: "Only what the host has declared" },
          { label: "Nightly rate", value: "Per whole house, before cleaning and tax" },
        ],
      },
      {
        kind: "link",
        href: "/stays",
        label: "See the full 9bhk catalog",
        note: "Every listing, filterable by setting, destination and guest count.",
      },
    ],
    image: "/assets/prop-terracotta-courtyard.jpg",
    imageAlt: "Warm terracotta courtyard of a private stay near Chennai",
    status: "published",
  },
];

/** Published guides only — drafts must never reach metadata, links or sitemap. */
export const CONTENT = GUIDES.filter((guide) => guide.status === "published");

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

export function getPublishedGuide(slug: string): Guide | undefined {
  const guide = getGuide(slug);
  return guide && guide.status === "published" ? guide : undefined;
}

/** Guides that name this listing, falling back to location then category. */
export function guidesForListing(propertyId: string, locationSlug?: string, categorySlug?: string): Guide[] {
  const exact = CONTENT.filter((guide) => guide.relatedProperties.includes(propertyId));
  if (exact.length) return exact;
  if (locationSlug) {
    const byLocation = CONTENT.filter((guide) => guide.locations.includes(locationSlug));
    if (byLocation.length) return byLocation;
  }
  if (categorySlug) {
    return CONTENT.filter((guide) => guide.categories.includes(categorySlug as never));
  }
  return [];
}
