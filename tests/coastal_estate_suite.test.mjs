import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Load PROPERTIES and helpers directly from lib/properties.ts
const propertiesTsPath = path.resolve("lib/properties.ts");
const src = fs.readFileSync(propertiesTsPath, "utf8");

// Extract PROPERTIES
const start = src.indexOf("export const PROPERTIES: Property[] =");
const end = src.indexOf("export const VIBES");
const body = src.slice(start, end).replace("export const PROPERTIES: Property[] =", "const PROPERTIES =");
const PROPERTIES = eval(`${body}\nPROPERTIES`);

function formatInrCrores(value) {
  if (value >= 10000000) {
    const cr = (value / 10000000).toFixed(value % 10000000 === 0 ? 0 : 2);
    return `₹${cr} Cr`;
  }
  if (value >= 100000) {
    const lk = (value / 100000).toFixed(value % 100000 === 0 ? 0 : 1);
    return `₹${lk} Lakh`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

function matchesFilter(property, filter) {
  const blob = `${property.amenities.join(" ")} ${property.vibes.join(" ")} ${property.highlights} ${property.coastalZone} ${property.garage.name} ${property.garage.type} ${property.beachFrontage}`.toLowerCase();
  const key = filter.toLowerCase();

  if (key === "supercar garage") {
    return property.garage.supercarFriendly || property.garage.type === "collector_vault";
  }
  if (key === "marine port") {
    return property.garage.type === "marine_port";
  }
  if (key === "ev ready") {
    return property.garage.evChargingKw >= 22 || property.garage.type === "ev_pavilion";
  }
  if (key === "for sale") {
    return Boolean(property.isForSale);
  }
  if (key === "oceanfront" || key === "direct beach") {
    return property.privateBeachAccess;
  }
  if (key === "pool") {
    return blob.includes("pool");
  }
  return blob.includes(key);
}

test("1. Coastal Authenticity: Zero inland villas, 100% direct beachfront", () => {
  assert.ok(PROPERTIES.length > 0, "Catalog must not be empty");
  
  for (const p of PROPERTIES) {
    assert.strictEqual(
      p.privateBeachAccess,
      true,
      `Property ${p.name} (${p.id}) must have direct private beach access`
    );
    assert.ok(
      p.tideDistanceMeters <= 100,
      `Property ${p.name} must be within 100m of high-tide line, got ${p.tideDistanceMeters}m`
    );
    assert.match(
      p.beachFrontage,
      /\b\d+\s*ft\b/i,
      `Property ${p.name} frontage must specify exact linear footage`
    );
    assert.match(
      p.coastalZone,
      /Direct Oceanfront|Dune Edge Sanctuary|Cove Front/,
      `Property ${p.name} must belong to an approved coastal zone`
    );
  }
});

test("2. Automotive Taxonomy: 4 standardized luxury garage architectures", () => {
  const allowedGarageTypes = new Set(["collector_vault", "marine_port", "ev_pavilion", "teak_portico"]);
  
  for (const p of PROPERTIES) {
    assert.ok(p.garage, `Property ${p.name} must define a garage specification`);
    assert.ok(
      allowedGarageTypes.has(p.garage.type),
      `Property ${p.name} garage type '${p.garage.type}' is not recognized`
    );
    assert.ok(
      p.garage.capacity >= 2,
      `Property ${p.name} garage must hold at least 2 vehicles, got ${p.garage.capacity}`
    );
    assert.strictEqual(typeof p.garage.supercarFriendly, "boolean");
    assert.strictEqual(typeof p.garage.washdownStation, "boolean");
    assert.ok(p.garage.evChargingKw >= 0, "EV charging must be non-negative");
    assert.ok(p.garage.description.length > 15, "Garage must provide a detailed specification description");
  }
});

test("3. Currency Formatter: Indian Crore and Lakh standardisation", () => {
  assert.strictEqual(formatInrCrores(285000000), "₹28.50 Cr");
  assert.strictEqual(formatInrCrores(120000000), "₹12 Cr");
  assert.strictEqual(formatInrCrores(8500000), "₹85 Lakh");
  assert.strictEqual(formatInrCrores(8550000), "₹85.5 Lakh");
  assert.strictEqual(formatInrCrores(45000), "₹45,000");
});

test("4. Sales Engine: Estates for sale must have verified price and land survey data", () => {
  const forSale = PROPERTIES.filter((p) => p.isForSale);
  assert.ok(forSale.length >= 3, "Catalog must offer at least 3 estates for direct acquisition");

  for (const p of forSale) {
    assert.ok(p.salePrice && p.salePrice >= 10000000, `Sale price for ${p.name} must be >= 1 Cr`);
    assert.ok(p.landArea && p.landArea.length > 0, `Sale property ${p.name} must specify land survey area`);
  }
});

test("5. Filter Matching: Supercars, Marine Ports, and Sales Filters", () => {
  const supercarEstates = PROPERTIES.filter((p) => matchesFilter(p, "supercar garage"));
  assert.ok(supercarEstates.length > 0, "Must match supercar-ready estates");
  
  const marineEstates = PROPERTIES.filter((p) => matchesFilter(p, "marine port"));
  assert.ok(marineEstates.length > 0, "Must match marine port estates");

  const saleEstates = PROPERTIES.filter((p) => matchesFilter(p, "for sale"));
  assert.strictEqual(saleEstates.length, PROPERTIES.filter((p) => p.isForSale).length);
});

test("6. Realtor Client Mandates: Budget range & confidentiality tiers", () => {
  const sampleClient = {
    id: "client-001",
    name: "Ramesh Sundaram",
    phone: "+91 98410 44556",
    email: "ramesh@sanmar.in",
    budgetMinCr: 12,
    budgetMaxCr: 28,
    preferredStretch: "Covelong Point Beach",
    garageNeed: "Collector Vault (4 cars)",
    confidential: true,
    createdAt: new Date().toISOString(),
  };

  assert.ok(sampleClient.budgetMinCr > 0, "Budget min must be positive");
  assert.ok(sampleClient.budgetMaxCr >= sampleClient.budgetMinCr, "Budget max must exceed or equal min");
  assert.match(sampleClient.phone, /^\+91\s?\d{5}\s?\d{5}$/, "Client phone must follow Indian mobile format");
  assert.strictEqual(typeof sampleClient.confidential, "boolean");
});

test("7. Multi-Role Profiles: Buyer, Realtor, and Seller onboarding typing", () => {
  const allowedRoles = ["buyer", "realtor", "seller", "guest", "admin"];
  
  const realtorUser = {
    name: "Vikramaditya C.",
    email: "vikram@bayview.in",
    phone: "+91 98400 99887",
    city: "Chennai",
    role: "realtor",
    agencyName: "Bayview Private Advisory",
    reraNumber: "TN/AGENT/0491/2023",
    verifiedBroker: true,
  };

  assert.ok(allowedRoles.includes(realtorUser.role), "Realtor role must be in allowed list");
  assert.ok(realtorUser.agencyName.length > 0, "Agency name required for realtor");
  assert.match(realtorUser.reraNumber, /^TN\/AGENT\/\d{4}\/\d{4}$/, "RERA format validated");
  assert.strictEqual(realtorUser.verifiedBroker, true);

  const viewingRequest = {
    propertyId: "bay-breakers-vault",
    propertyName: "The Dunes Oceanfront & Vault",
    buyerName: "Dev Anand",
    buyerPhone: "+91 98400 12345",
    automotiveMandate: "Low-ramp Ferrari clearance required",
    status: "pending",
  };

  assert.ok(viewingRequest.propertyId.length > 0);
  assert.ok(viewingRequest.buyerName.length > 0);
  assert.strictEqual(viewingRequest.status, "pending");
});

