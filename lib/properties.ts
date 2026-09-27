export type Property = {
  id: string;
  name: string;
  location: string;
  city: string;
  rating: number;
  reviews: number;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  price: number;
  cleaning: number;
  highlights: string;
  searchLine: string;
  amenities: string[];
  vibes: string[];
  image: string;
  alt: string;
  blurb: string;
  type: string;
  guestFavourite?: boolean;
  group: "featured" | "nearby" | "popular";
};

export const PROPERTIES: Property[] = [
  {
    id: "palm-grove",
    name: "Palm Grove Private Farmhouse",
    location: "ECR · Near Mahabalipuram",
    city: "ECR",
    rating: 4.9,
    reviews: 128,
    guests: 8,
    bedrooms: 3,
    beds: 4,
    bathrooms: 3,
    price: 8500,
    cleaning: 1200,
    highlights: "8 guests · Pool · Bonfire",
    searchLine: "8 guests · Pool · Bonfire · BBQ",
    amenities: ["Private pool", "Bonfire pit", "BBQ grill", "Air conditioning", "Wi-Fi", "Free parking", "Equipped kitchen", "Pet friendly", "Power backup", "Projector & music"],
    vibes: ["Pool", "Bonfire", "Groups", "Pet friendly"],
    image: "/assets/prop-palm-grove.jpg",
    alt: "A curved swimming pool ringed with palms and tropical planting at Palm Grove Private Farmhouse",
    blurb: "A quiet private escape surrounded by palms, open lawns and a pool — made for slow mornings and long evenings.",
    type: "Private farmhouse",
    guestFavourite: true,
    group: "featured",
  },
  {
    id: "mango-orchard",
    name: "Mango Orchard Retreat",
    location: "Chengalpattu",
    city: "Chengalpattu",
    rating: 4.8,
    reviews: 94,
    guests: 6,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    price: 6200,
    cleaning: 900,
    highlights: "6 guests · Orchard · BBQ",
    searchLine: "6 guests · Orchard · BBQ",
    amenities: ["BBQ grill", "Wi-Fi", "Free parking", "Equipped kitchen", "Pet friendly", "Air conditioning"],
    vibes: ["Countryside", "Family", "Pet friendly"],
    image: "/assets/prop-mango-orchard.jpg",
    alt: "A stone cottage with a sage-green door and wildflowers at Mango Orchard Retreat",
    blurb: "A cottage set inside a working mango orchard, with a long verandah and a grill for unhurried evenings.",
    type: "Orchard retreat",
    group: "featured",
  },
  {
    id: "sunset-fields",
    name: "Sunset Fields Farmhouse",
    location: "Kanchipuram",
    city: "Kanchipuram",
    rating: 4.9,
    reviews: 76,
    guests: 10,
    bedrooms: 4,
    beds: 5,
    bathrooms: 3,
    price: 7400,
    cleaning: 1100,
    highlights: "10 guests · Pool · Fields",
    searchLine: "10 guests · Pool · Fields",
    amenities: ["Private pool", "Bonfire pit", "Air conditioning", "Wi-Fi", "Free parking", "Equipped kitchen", "Power backup"],
    vibes: ["Pool", "Countryside", "Groups"],
    image: "/assets/prop-sunset-fields.jpg",
    alt: "Open fields at golden hour beside Sunset Fields Farmhouse",
    blurb: "Wide fields, a still pool and room for a big group — the kind of place where the day slows down on its own.",
    type: "Private farmhouse",
    group: "featured",
  },
  {
    id: "lakeview",
    name: "Lakeview Courtyard",
    location: "Pondicherry",
    city: "Pondicherry",
    rating: 4.8,
    reviews: 63,
    guests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 2,
    price: 6900,
    cleaning: 1000,
    highlights: "6 guests · Pool · Lake view",
    searchLine: "6 guests · Pool · Lake view",
    amenities: ["Private pool", "BBQ grill", "Bonfire pit", "Wi-Fi", "Air conditioning", "Free parking"],
    vibes: ["Pool", "Romantic", "Countryside"],
    image: "/assets/prop-lakeview-courtyard.jpg",
    alt: "A courtyard opening toward the water at Lakeview Courtyard",
    blurb: "A courtyard house a short walk from the water, with a pool that catches the late light.",
    type: "Farm stay",
    group: "nearby",
  },
  {
    id: "coconut-grove",
    name: "Coconut Grove Escape",
    location: "ECR · Mahabalipuram",
    city: "ECR",
    rating: 4.8,
    reviews: 210,
    guests: 6,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    price: 5800,
    cleaning: 800,
    highlights: "6 guests · Pool · Near beach",
    searchLine: "6 guests · Pool · Near beach",
    amenities: ["Private pool", "Wi-Fi", "Free parking", "Equipped kitchen", "Air conditioning"],
    vibes: ["Pool", "Family", "Romantic"],
    image: "/assets/prop-coconut-grove.jpg",
    alt: "Palms shading the lawn at Coconut Grove Escape",
    blurb: "Palms, a small pool and the sea a short drive away — an easy weekend without the rush.",
    type: "Private farmhouse",
    group: "nearby",
  },
  {
    id: "blue-horizon",
    name: "Blue Horizon Farm Stay",
    location: "Mahabalipuram",
    city: "Mahabalipuram",
    rating: 4.7,
    reviews: 52,
    guests: 12,
    bedrooms: 4,
    beds: 6,
    bathrooms: 4,
    price: 9100,
    cleaning: 1500,
    highlights: "12 guests · Pool · Sea view",
    searchLine: "12 guests · Pool · Sea view",
    amenities: ["Private pool", "Wi-Fi", "Air conditioning", "Free parking", "Equipped kitchen", "Power backup", "Projector & music"],
    vibes: ["Pool", "Groups", "Family"],
    image: "/assets/prop-blue-horizon.jpg",
    alt: "A blue-toned farm stay with an open view at Blue Horizon",
    blurb: "A larger stay with a pool and a long view toward the coast, built for groups who want space.",
    type: "Pool villa",
    group: "nearby",
  },
  {
    id: "guava-house",
    name: "The Guava House",
    location: "Chennai",
    city: "Chennai",
    rating: 4.9,
    reviews: 312,
    guests: 6,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    price: 5400,
    cleaning: 700,
    highlights: "6 guests · Garden · Pet friendly",
    searchLine: "6 guests · Garden · Pet friendly",
    amenities: ["Pet friendly", "Wi-Fi", "Air conditioning", "Free parking", "Equipped kitchen", "Power backup"],
    vibes: ["Pet friendly", "Family", "Countryside"],
    image: "/assets/prop-guava-house.jpg",
    alt: "A garden house with fruit trees at The Guava House",
    blurb: "A garden house on the edge of the city, with fruit trees and room for a dog on the lawn.",
    type: "Farm stay",
    group: "popular",
  },
  {
    id: "verde-meadow",
    name: "Verde Meadow Farmhouse",
    location: "Kanchipuram",
    city: "Kanchipuram",
    rating: 4.6,
    reviews: 88,
    guests: 10,
    bedrooms: 3,
    beds: 4,
    bathrooms: 2,
    price: 4900,
    cleaning: 800,
    highlights: "10 guests · Meadow · Bonfire",
    searchLine: "10 guests · Meadow · Bonfire",
    amenities: ["Bonfire pit", "Wi-Fi", "Free parking", "Equipped kitchen", "Air conditioning", "Pet friendly"],
    vibes: ["Bonfire", "Countryside", "Groups", "Pet friendly"],
    image: "/assets/prop-verde-meadow.jpg",
    alt: "A meadow stretching behind Verde Meadow Farmhouse",
    blurb: "An open meadow, a bonfire ring and enough beds for a long weekend with friends.",
    type: "Private farmhouse",
    group: "popular",
  },
  {
    id: "terracotta",
    name: "Terracotta Courtyard Stay",
    location: "Pondicherry",
    city: "Pondicherry",
    rating: 4.8,
    reviews: 145,
    guests: 8,
    bedrooms: 3,
    beds: 4,
    bathrooms: 3,
    price: 7800,
    cleaning: 1100,
    highlights: "8 guests · Courtyard · Bonfire",
    searchLine: "8 guests · Courtyard · Bonfire",
    amenities: ["Bonfire pit", "BBQ grill", "Wi-Fi", "Air conditioning", "Free parking", "Equipped kitchen"],
    vibes: ["Bonfire", "Romantic", "Family"],
    image: "/assets/prop-terracotta-courtyard.jpg",
    alt: "A terracotta courtyard with planted edges",
    blurb: "A warm courtyard house with a bonfire and evenings that stay outdoors.",
    type: "Farm stay",
    group: "popular",
  },
];

export const VIBES = ["Pool", "Bonfire", "Countryside", "Groups", "Romantic", "Family", "Pet friendly"] as const;

export const FILTERS = ["Pool", "Bonfire", "BBQ", "Pet friendly", "AC", "Wi-Fi", "Parking"] as const;

export function getProperty(id: string): Property | undefined {
  return PROPERTIES.find((p) => p.id === id);
}

export function matchesFilter(property: Property, filter: string): boolean {
  const blob = `${property.amenities.join(" ")} ${property.vibes.join(" ")} ${property.highlights}`.toLowerCase();
  const key = filter.toLowerCase();
  if (key === "ac") return blob.includes("air conditioning") || blob.includes("ac");
  if (key === "bbq") return blob.includes("bbq");
  if (key === "parking") return blob.includes("parking");
  if (key === "wi-fi") return blob.includes("wi-fi");
  return blob.includes(key);
}
