/**
 * AEO — question/answer generation.
 *
 * Every question is emitted only when the catalog can answer it truthfully. A
 * listing with no declared event capacity never gets an "can it host a party"
 * question; a listing with no pool never gets one about swimming. This is the
 * mechanism that lets the FAQ sections be a real answer surface for
 * AI/answer engines instead of a keyword wrapper.
 */

import type { Property } from "@/lib/properties";
import { hasBonfire, hasPetFriendly, hasPool, inr, isBeachfront, joinList, plural, priceBand, capacityBand } from "@/lib/seo/copy";
import { locationFor, type LocationEntry } from "@/lib/seo/locations";
import { SITE } from "@/lib/seo/site";
import { distinctTypes, type StayCategory } from "@/lib/seo/taxonomy";

export type QA = {
  question: string;
  answer: string;
};

export type FAQSection = {
  /** Visible heading, e.g. "About this property". */
  heading: string;
  items: QA[];
};

/** Per-property Q&A. Ordered by how the questions actually get asked. */
export function propertyFaq(property: Property): QA[] {
  const location = locationFor(property);
  const where = location?.name ?? property.city ?? property.location;
  const items: QA[] = [];

  items.push({
    question: "What is this property?",
    answer: `${property.name} is a ${property.type.toLowerCase()} listed on ${propertyBlurb(property)}.`,
  });

  if (property.city || property.settingName) {
    items.push({
      question: "Where is it located?",
      answer: `It is in ${where}${
        property.location && property.location !== where ? `, on the ${property.location} stretch` : ""
      }.${property.settingDetail ? ` The listing describes the site as: ${property.settingDetail}.` : ""}`,
    });
  }

  const capacity: string[] = [];
  if (property.guests > 0) capacity.push(`sleeps up to ${plural(property.guests, "guest", "guests")}`);
  if (property.bedrooms > 0) capacity.push(plural(property.bedrooms, "bedroom"));
  if (property.bathrooms > 0) capacity.push(plural(property.bathrooms, "bathroom"));
  if (capacity.length) {
    items.push({
      question: "How many guests can stay, and how many bedrooms are there?",
      answer: `${joinList(capacity)}.`,
    });
  }

  if (property.amenities?.length) {
    items.push({
      question: "What amenities are available?",
      answer: `The host lists ${joinList(property.amenities.slice(0, 6))}${
        property.amenities.length > 6 ? `, and ${property.amenities.length - 6} more on the full listing` : ""
      }.`,
    });
  }

  if (hasPool(property)) {
    items.push({
      question: "Does it have a private pool?",
      answer: `Yes — a pool is listed among the amenities for ${property.name}, and it is not a shared or community pool.`,
    });
  } else {
    items.push({
      question: "Does it have a private pool?",
      answer: `No pool is listed among the amenities for ${property.name}. The listing only carries amenities the host has declared.`,
    });
  }

  /*
   * One beach question per listing, never two. The frontage branch and the
   * seaside-setting branch used to be two independent `if`s, so a beachfront
   * property rendered the same question twice with different answers.
   */
  if (isBeachfront(property) || property.setting === "seaside") {
    const detail: string[] = [];
    if (property.beachFrontage) detail.push(property.beachFrontage);
    if (property.coastalZone) detail.push(`coastal zone ${property.coastalZone}`);
    if (property.tideDistanceMeters) {
      detail.push(`${property.tideDistanceMeters} m from the high-tide line`);
    }
    items.push({
      question: "Is it near the beach?",
      answer: `Yes — this is a seaside listing in ${where}${
        detail.length ? `, with ${joinList(detail)}` : ""
      }.`,
    });
  }

  if (property.garage) {
    items.push({
      question: "Is there parking or a garage on site?",
      answer: `Yes. The listing carries a ${property.garage.name} for ${plural(property.garage.capacity, "vehicle")}${
        property.garage.supercarFriendly ? ", with a low-approach ramp for low-clearance cars" : ""
      }.`,
    });
  }

  if (property.celebration) {
    items.push({
      question: "Is it suitable for groups and events?",
      answer: `Yes. The host has declared an event capacity of ${plural(property.celebration.maxEventGuests, "guest", "guests")}, with ${property.celebration.powerLoadKw} kW of sanctioned power, a ${property.celebration.soundCurfewHour}:00 sound curfew and space for ${plural(property.celebration.parkingCars, "car")} on the grounds.`,
    });
    if (hasBonfire(property)) {
      items.push({
        question: "Can we light a bonfire?",
        answer: `A bonfire or barbecue amenity is listed for ${property.name}. Confirm fire rules with the host before the stay.`,
      });
    }
  } else {
    items.push({
      question: "Is it suitable for a large group?",
      answer: `${property.name} sleeps ${plural(property.guests, "guest", "guests")}. The host has not declared an event capacity for this listing, so it is a stay house rather than a sanctioned function venue.`,
    });
  }

  if (property.guests >= 6) {
    items.push({
      question: "Is it suitable for a family or group stay?",
      answer: `Yes — it is a whole house with ${plural(property.bedrooms, "bedroom")} and space for ${plural(property.guests, "guest", "guests")}, booked exclusively.`,
    });
  }

  if (hasPetFriendly(property)) {
    items.push({
      question: "Can we bring a pet?",
      answer: `Pet-friendly is listed among the amenities. Confirm the house rules with the host before you travel.`,
    });
  }

  items.push({
    question: "What does it cost?",
    answer: `The listed nightly rate is ${inr(property.price)} before the cleaning fee and tax.${
      property.isForSale && property.salePrice ? ` The house is also on the market at ${inr(property.salePrice)}.` : ""
    }`,
  });

  items.push({
    question: "How do I book it?",
    answer: `Open the listing and choose Reserve. A booking is a request until the host confirms it. Once confirmed, payment is completed securely through Razorpay escrow, holding the funds until check-in.`,
  });

  return items;
}

function propertyBlurb(property: Property): string {
  return property.blurb?.trim() || property.highlights?.trim() || `${whereOf(property)}`;
}

function whereOf(property: Property): string {
  return locationFor(property)?.name ?? property.city ?? property.location;
}

/** Q&A for a category hub. Inventory-shaped, never templated filler. */
export function categoryFaq(
  category: StayCategory,
  properties: Property[],
  locations: LocationEntry[],
): QA[] {
  const items: QA[] = [];
  const capacity = capacityBand(properties);
  const band = priceBand(properties);
  const types = distinctTypes(properties);
  const poolCount = properties.filter(hasPool).length;
  const eventCount = properties.filter((property) => property.celebration).length;
  const beachCount = properties.filter(isBeachfront).length;
  const guestMin = Math.min(...properties.map((property) => property.guests));

  items.push({
    question: `What are the ${category.plural.toLowerCase()} available on 9bhk?`,
    answer: `9bhk lists ${properties.length} ${category.plural.toLowerCase()} in total${
      types.length ? `, across ${joinList(types)}` : ""
    }. Every one is a whole house rented exclusively, not a room in a hotel.`,
  });

  if (locations.length) {
    items.push({
      question: `Where can I find ${category.plural.toLowerCase()} near Chennai?`,
      answer: `The destinations with 9bhk inventory in this category are ${joinList(
        locations.map((location) => location.name),
      )}.`,
    });
  }

  if (capacity) {
    items.push({
      question: "How many guests can a stay in this category hold?",
      answer: `Listings in this category sleep from ${plural(guestMin, "guest", "guests")} upward${
        band ? `, with nightly rates from ${band}` : ""
      }.`,
    });
  }

  if (poolCount > 0) {
    items.push({
      question: `Which ${category.plural.toLowerCase()} have a private pool?`,
      answer: `${poolCount} of the ${properties.length} listings${
        poolCount === 1 ? " carries" : " carry"
      } a pool among the declared amenities. Filter the list to see them together.`,
    });
  }

  if (beachCount > 0) {
    items.push({
      question: "Which of these are beachfront?",
      answer: `${beachCount} ${
        beachCount === 1 ? "listing sits" : "listings sit"
      } on the coast with declared beach access or frontage.`,
    });
  }

  if (eventCount > 0) {
    items.push({
      question: "Can any of these host a party or a corporate retreat?",
      answer: `Yes — ${eventCount} ${
        eventCount === 1 ? "listing has" : "listings have"
      } a declared event capacity, which is what 9bhk uses to distinguish a house that can actually run a function from one that only has bedrooms.`,
    });
  }

  items.push({
    question: `How do I book a ${category.singular.toLowerCase()} on 9bhk?`,
    answer:
      "Open a listing and choose Reserve. You pick your dates, the host confirms the request, and payment is processed securely via Razorpay escrow with complete guest protection until check-in.",
  });

  return items;
}

/** Q&A for a destination page. */
export function locationFaq(
  location: LocationEntry,
  properties: Property[],
  categories: StayCategory[],
): QA[] {
  const items: QA[] = [];
  const capacity = capacityBand(properties);
  const band = priceBand(properties);
  const types = distinctTypes(properties);
  const nearest = properties.reduce<Property | null>((best, property) => {
    if (!best) return property;
    return property.price < best.price ? property : best;
  }, null);

  items.push({
    question: `What private stays are available in ${location.name}?`,
    answer: `9bhk lists ${properties.length} ${
      properties.length === 1 ? "stay" : "stays"
    } in ${location.name}${types.length ? ` — ${joinList(types)}` : ""}.`,
  });

  items.push({
    question: `How do you get to ${location.name}?`,
    answer: location.reach,
  });

  if (capacity || band) {
    items.push({
      question: `What does a stay in ${location.name} cost?`,
      answer: `Across the 9bhk listings here, capacity runs ${capacity ?? "per listing"}${
        band ? ` and nightly rates run ${band}` : ""
      }. Prices are per whole house, per night, before cleaning and tax.`,
    });
  }

  if (categories.length) {
    items.push({
      question: `What kinds of properties are in ${location.name}?`,
      answer: `The inventory here covers ${joinList(
        categories.map((category) => category.plural.toLowerCase()),
      )}.`,
    });
  }

  if (nearest) {
    items.push({
      question: `What is the lowest-priced stay in ${location.name}?`,
      answer: `At ${inr(nearest.price)} a night, ${nearest.name} is the lowest listed nightly rate in this destination${
        nearest.bedrooms ? `, sleeping ${plural(nearest.bedrooms, "bedroom")}` : ""
      }.`,
    });
  }

  if (location.driveTimeFromChennai) {
    items.push({
      question: `How far is ${location.name} from Chennai?`,
      answer: `About ${location.driveTimeFromChennai} from Chennai by road.`,
    });
  }

  return items;
}

/** Platform-level Q&A for /faq. Facts only. */
export function platformFaq(): QA[] {
  return [
    {
      question: "What is 9bhk (9bhk.app)?",
      answer:
        "9bhk (9bhk.app) is an online marketplace for verified whole-property private farmhouses, beach houses, and luxury villas in Chennai, ECR (East Coast Road), Mahabalipuram, and Pondicherry. Rather than renting single hotel rooms, 9bhk provides exclusive whole-estate reservations with private pools and lawns for group stays, family reunions, creator shoots, and private celebrations.",
    },
    {
      question: "What does 9BHK mean, and is 9bhk.app just a 9-bedroom house?",
      answer:
        "In Indian residential real estate, 'BHK' stands for Bedroom, Hall, and Kitchen. While a literal 9BHK property denotes a large 9-bedroom mansion, 9bhk.app is the dedicated digital platform named in honor of grand gathering estates. All properties listed on 9bhk feature a minimum of 3 BHK up to 9+ BHK private compounds, ensuring every reservation is an expansive, whole-house private estate with no shared strangers.",
    },
    {
      question: "What problem does 9bhk solve for group travel?",
      answer:
        "Booking a private farmhouse or villa in South India has traditionally been an unverified, high-risk process dominated by informal brokers, fake photos, and unbacked deposits. Groups often arrive to find under-maintained pools, inadequate electrical loads that trip under sound systems, or surprise caretaker charges. 9bhk solves this by verifying property specs directly from owners, enforcing transparent pricing, and protecting every booking with Razorpay escrow.",
    },
    {
      question: "How is 9bhk different from Airbnb, MakeMyTrip, or local brokers?",
      answer:
        "Unlike mass OTAs and informal brokers, 9bhk enforces three clear standards: (1) Strictly whole properties with a 3-bedroom floor — zero shared spaces or individual room bookings. (2) Verified functional specs — we declare actual electrical kW, generator capacity, sound curfews, and beach frontage. (3) Transparent escrow protection — a flat 10% platform fee with zero surprise checkout markups, holding funds safely until check-in with a 15-day host settlement clearance.",
    },
    {
      question: "Who is 9bhk built for, and why does it focus on whole-house gathering?",
      answer:
        "9bhk is built for groups who need private space to be together: extended families celebrating reunions, founders hosting leadership offsites, creative teams filming campaigns, and close friend groups. Modern travel isolates groups into separate hotel rooms; 9bhk provides a communal living room, private pool, dining area, and grounds exclusively for your circle.",
    },
    {
      question: "What impact is 9bhk creating in the estate rental economy?",
      answer:
        "9bhk brings institutional transparency and contract predictability to the luxury private estate ecosystem. We help property owners monetize multi-crore private farmhouses and beach villas safely with vetted guests, while giving families and groups guaranteed booking security and scam-free hospitality.",
    },
    {
      question: "Where does 9bhk have properties?",
      answer:
        "The 9bhk catalog covers the Chennai coast — ECR, Mahabalipuram, the northern beach road and city neighbourhoods — plus Pondicherry, the Kanchipuram and Chengalpattu countryside, and the Tamil Nadu hill stations.",
    },
    {
      question: "Do I book a room or the whole house?",
      answer:
        "Always the whole house. Every listing on 9bhk is a private estate reserved exclusively for your dates, which is why bedrooms start at three and pricing is per house rather than per person.",
    },
    {
      question: "How does booking and payment work?",
      answer:
        "You select your dates and submit a booking request. Once the host confirms, you pay securely through Razorpay using UPI, cards, or netbanking. Your payment is held in escrow until check-in. The total price comprises the nightly rate, cleaning fee, and 10% platform service fee, all itemized upfront with zero hidden charges.",
    },
    {
      question: "How do cancellations and refunds work?",
      answer:
        "Our standard policy provides a full refund up to 7 days before check-in, 50% refund up to 48 hours before check-in, and non-refundable within 48 hours. Refunds are processed automatically through the original payment method.",
    },
    {
      question: "Can I list my farmhouse or villa on 9bhk?",
      answer:
        "Yes. Owners of private whole-house properties can apply to list. Our team verifies the property's specifications, electrical load, amenities, and ownership before publishing.",
    },
    {
      question: "Is 9bhk also a property sales marketplace?",
      answer:
        "Yes. Select private estates are also available for outright acquisition, displaying verified land area, title disclosures, and asking prices directly on the listing.",
    },
    {
      question: "What specifications are verified on a listing?",
      answer:
        "We verify bedroom and bathroom counts, sleeping capacity, swimming pool filtration, electrical load in kW, backup generator capacity, sound curfew hours, vehicle parking slots, and exact high-tide coastal distance for beachfront properties.",
    },
  ];
}
