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
    answer: `Open the listing and choose Reserve. Review the server quote and create a short-lived date hold before checkout. Confirmation follows reconciliation of a captured Razorpay payment.`,
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
      "Open a listing and choose Reserve. Pick available dates, review the itemized server quote, and pay through Razorpay. Confirmation follows captured-payment reconciliation.",
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
    { question: "What is 9bhk (9bhk.app)?", answer: "9bhk is a marketplace for whole-property farmhouses, beach houses, and villas for private group stays. Public listings require at least three bedrooms." },
    { question: "Do I book a room or the whole house?", answer: "Listings are for the whole property, with capacity, amenities, and house rules declared by the host." },
    { question: "How does booking and payment work?", answer: "Sign in, choose an available date range, and review the itemized reservation quote. A short-lived hold reserves the dates before Razorpay checkout. A booking is confirmed only after the server reconciles a captured payment." },
    { question: "What is included in the quote?", answer: "The quote itemizes the nightly stay, cleaning, configured taxes and service fees, and any refundable security deposit. The final server quote is shown before payment." },
    { question: "How do cancellations and refunds work?", answer: "Cancellation eligibility depends on the reservation dates and recorded policy. A refund request is tracked separately from cancellation; requested does not mean the gateway has refunded the payment. Check the trip status or contact support." },
    { question: "Who supplies the listing details?", answer: "Specifications are host-provided. A listing is marked Verified only when a staff review of its evidence is recorded. Published reviews must be tied to a completed stay." },
    { question: "Can I list my farmhouse or villa?", answer: "Owners can save a draft and submit supporting documents for review. Publication and the Verified label are controlled by staff review." },
    { question: "Can groups split the payment?", answer: "A reservation can be funded by separate group shares before it is paid in full. Share status comes from captured gateway payments. A fully paid reservation cannot be charged again through Split Pay." },
    { question: "Is 9bhk also a property sales marketplace?", answer: "Some listings include an asking price and a viewing-request option. A listing or document review is not a guarantee of clear legal title." },
  ];
}
