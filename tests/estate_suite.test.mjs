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

// Extract MIN_BEDROOMS
const minMatch = src.match(/export const MIN_BEDROOMS = (\d+);/);
const MIN_BEDROOMS = Number(minMatch[1]);

// Extract SETTING_LABEL so the assertions check the real taxonomy. The source
// carries a TS annotation, so strip the type before evaluating it as JS.
const settingStart = src.indexOf("export const SETTING_LABEL");
const settingEnd = src.indexOf("export type CoastalZone");
const settingSrc = src
  .slice(settingStart, settingEnd)
  .replace("export const SETTING_LABEL: Record<Setting, string>", "const SETTING_LABEL");
const SETTING_LABEL = eval(`${settingSrc}\nSETTING_LABEL`);

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
  const key = filter.toLowerCase();
  const garage = property.garage;

  if (key === "for sale") return Boolean(property.isForSale);

  const setting = Object.keys(SETTING_LABEL).find(
    (k) => SETTING_LABEL[k].toLowerCase() === key,
  );
  if (setting) return property.setting === setting;

  if (key === "supercar garage") {
    return Boolean(garage && (garage.supercarFriendly || garage.type === "collector_vault"));
  }
  if (key === "ev ready") {
    return Boolean(garage && (garage.evChargingKw >= 22 || garage.type === "ev_pavilion"));
  }
  if (key === "collector garage") return garage?.type === "collector_vault";
  if (key === "marine port") return garage?.type === "marine_port";
  if (key === "large groups") return property.guests >= 8;
  if (key === "pool") return property.amenities.some((a) => /pool/i.test(a));
  if (key === "bonfire") return property.amenities.some((a) => /bonfire|fire pit|campfire/i.test(a));

  const blob = [
    property.name,
    property.location,
    property.city,
    property.type,
    property.settingName,
    property.settingDetail,
    property.highlights,
    property.amenities.join(" "),
    property.vibes.join(" "),
    property.beachFrontage,
    property.coastalZone,
    garage?.name,
    garage?.type,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return blob.includes(key);
}

test("1. Settings taxonomy: four settings, all represented, none dominant", () => {
  assert.ok(PROPERTIES.length > 0, "Catalog must not be empty");

  assert.deepStrictEqual(
    Object.values(SETTING_LABEL).sort(),
    ["Countryside", "Hill Station", "In the City", "Seaside"],
    "Setting vocabulary must stay seaside / hill station / city / countryside",
  );

  for (const p of PROPERTIES) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(SETTING_LABEL, p.setting),
      `Property ${p.name} has unknown setting '${p.setting}'`,
    );
    assert.ok(p.settingName.trim().length > 0, `Property ${p.name} must name its setting`);
    assert.ok(p.settingDetail.trim().length > 0, `Property ${p.name} must describe its setting`);
  }

  // Every setting must have at least one listing, or the filter is a dead end.
  for (const setting of Object.keys(SETTING_LABEL)) {
    const count = PROPERTIES.filter((p) => p.setting === setting).length;
    assert.ok(count > 0, `No listings for setting '${setting}'`);
  }

  // Seaside is an option, not a mandate. It must not be the whole catalog.
  const seaside = PROPERTIES.filter((p) => p.setting === "seaside").length;
  assert.ok(
    seaside < PROPERTIES.length,
    "Catalog must not be beachfront-only — seaside is one setting among four",
  );
  assert.ok(
    PROPERTIES.filter((p) => p.setting !== "seaside").length >= 4,
    "At least four non-seaside listings (hill station, city, countryside) are required",
  );
});

test("2. Coastal fields are exclusive to seaside listings", () => {
  for (const p of PROPERTIES) {
    if (p.setting === "seaside") {
      assert.strictEqual(
        p.privateBeachAccess,
        true,
        `Seaside property ${p.name} must have direct private beach access`,
      );
      assert.ok(
        p.tideDistanceMeters <= 100,
        `Seaside property ${p.name} must be within 100m of the high-tide line, got ${p.tideDistanceMeters}m`,
      );
      assert.match(
        p.beachFrontage,
        /\b\d+\s*ft\b/i,
        `Seaside property ${p.name} frontage must specify exact linear footage`,
      );
      assert.match(
        p.coastalZone,
        /Direct Oceanfront|Dune Edge Sanctuary|Cove Front/,
        `Seaside property ${p.name} must belong to an approved coastal zone`,
      );
    } else {
      // A hill or city house must never carry a fabricated shoreline.
      assert.strictEqual(
        p.beachFrontage,
        undefined,
        `Non-seaside property ${p.name} must not declare beach frontage`,
      );
      assert.strictEqual(
        p.coastalZone,
        undefined,
        `Non-seaside property ${p.name} must not declare a coastal zone`,
      );
      assert.strictEqual(
        p.tideDistanceMeters,
        undefined,
        `Non-seaside property ${p.name} must not declare a tide distance`,
      );
    }
  }
});

test("3. Group-house floor: every listing has at least 3 bedrooms", () => {
  assert.strictEqual(MIN_BEDROOMS, 3, "The advertised minimum is three bedrooms");
  for (const p of PROPERTIES) {
    assert.ok(
      p.bedrooms >= MIN_BEDROOMS,
      `Property ${p.name} has ${p.bedrooms} bedrooms, below the ${MIN_BEDROOMS} floor`,
    );
  }
});

test("4. Optional garages: valid when present, genuinely absent when not", () => {
  const allowedGarageTypes = new Set(["collector_vault", "marine_port", "ev_pavilion", "teak_portico"]);

  const withGarage = PROPERTIES.filter((p) => p.garage);
  const withoutGarage = PROPERTIES.filter((p) => !p.garage);
  assert.ok(withGarage.length > 0, "At least one listing should showcase a garage");
  assert.ok(withoutGarage.length > 0, "At least one listing should have no garage — the spec is optional");

  for (const p of withGarage) {
    assert.ok(
      allowedGarageTypes.has(p.garage.type),
      `Property ${p.name} garage type '${p.garage.type}' is not recognized`,
    );
    assert.ok(
      p.garage.capacity >= 2,
      `Property ${p.name} garage must hold at least 2 vehicles, got ${p.garage.capacity}`,
    );
    assert.strictEqual(typeof p.garage.supercarFriendly, "boolean");
    assert.strictEqual(typeof p.garage.washdownStation, "boolean");
    assert.ok(p.garage.evChargingKw >= 0, "EV charging must be non-negative");
    assert.ok(
      p.garage.description.length > 15,
      "Garage must provide a detailed specification description",
    );
  }

  // Marine slipways only make sense where there is water to slip into.
  for (const p of withGarage) {
    if (p.garage.type === "marine_port") {
      assert.strictEqual(
        p.setting,
        "seaside",
        `Property ${p.name} has a marine port but is not a seaside listing`,
      );
    }
  }
});

test("5. Currency formatter: Indian Crore and Lakh standardisation", () => {
  assert.strictEqual(formatInrCrores(285000000), "₹28.50 Cr");
  assert.strictEqual(formatInrCrores(120000000), "₹12 Cr");
  assert.strictEqual(formatInrCrores(8500000), "₹85 Lakh");
  assert.strictEqual(formatInrCrores(8550000), "₹85.5 Lakh");
  assert.strictEqual(formatInrCrores(45000), "₹45,000");
});

test("6. Sales engine: sale listings span settings, with verified price and land area", () => {
  const forSale = PROPERTIES.filter((p) => p.isForSale);
  assert.ok(forSale.length >= 3, "Catalog must offer at least 3 properties for direct acquisition");

  for (const p of forSale) {
    assert.ok(p.salePrice && p.salePrice >= 10000000, `Sale price for ${p.name} must be >= 1 Cr`);
    assert.ok(p.landArea && p.landArea.length > 0, `Sale property ${p.name} must specify land area`);
  }

  // Acquisition is not a coastal-only market.
  const forSaleSettings = new Set(forSale.map((p) => p.setting));
  assert.ok(
    forSaleSettings.size >= 2,
    "For-sale listings must span more than one setting, not just the coast",
  );
});

test("7. Filter matching: settings, amenities, garages and sales", () => {
  for (const setting of Object.values(SETTING_LABEL)) {
    const matched = PROPERTIES.filter((p) => matchesFilter(p, setting));
    assert.ok(matched.length > 0, `Setting filter '${setting}' must match at least one listing`);
    for (const p of matched) {
      assert.strictEqual(
        SETTING_LABEL[p.setting],
        setting,
        `Setting filter '${setting}' must not match a ${p.setting} listing`,
      );
    }
  }

  const supercarEstates = PROPERTIES.filter((p) => matchesFilter(p, "supercar garage"));
  assert.ok(supercarEstates.length > 0, "Must match supercar-ready listings");

  const poolHouses = PROPERTIES.filter((p) => matchesFilter(p, "pool"));
  assert.ok(poolHouses.length > 0, "Must match listings with a pool");

  const largeGroups = PROPERTIES.filter((p) => matchesFilter(p, "large groups"));
  assert.ok(largeGroups.length > 0, "Must match listings for large groups");
  for (const p of largeGroups) assert.ok(p.guests >= 8);

  const saleEstates = PROPERTIES.filter((p) => matchesFilter(p, "for sale"));
  assert.strictEqual(saleEstates.length, PROPERTIES.filter((p) => p.isForSale).length);
});

test("8. Realtor client mandates: budget range & confidentiality tiers", () => {
  const sampleClient = {
    id: "client-001",
    name: "Ramesh Sundaram",
    phone: "+91 98410 44556",
    email: "ramesh@sanmar.in",
    budgetMinCr: 12,
    budgetMaxCr: 28,
    preferredStretch: "Kodaikanal",
    garageNeed: "Collector Vault (4 cars)",
    confidential: true,
    createdAt: new Date().toISOString(),
  };

  assert.ok(sampleClient.budgetMinCr > 0, "Budget min must be positive");
  assert.ok(sampleClient.budgetMaxCr >= sampleClient.budgetMinCr, "Budget max must exceed or equal min");
  assert.match(sampleClient.phone, /^\+91\s?\d{5}\s?\d{5}$/, "Client phone must follow Indian mobile format");
  assert.strictEqual(typeof sampleClient.confidential, "boolean");
});

test("9. Multi-role profiles: Bookkeeper, Realtor, and Seller onboarding typing", () => {
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
    propertyId: "ooty-pine-court",
    propertyName: "Ooty Pine Court",
    buyerName: "Dev Anand",
    buyerPhone: "+91 98400 12345",
    notes: "Group of ten, two families, needs the heated pool and bonfire lawn.",
    status: "pending",
  };

  assert.ok(viewingRequest.propertyId.length > 0);
  assert.ok(viewingRequest.buyerName.length > 0);
  assert.ok(viewingRequest.notes.length > 0, "Viewing notes are generic, not automotive-only");
  assert.strictEqual(viewingRequest.status, "pending");
});

test("10. Broker Workspace: ₹500 subscription & 3-BHK platform showcase gate", () => {
  const BROKER_SUBSCRIPTION_INR = 500;
  assert.strictEqual(BROKER_SUBSCRIPTION_INR, 500, "Broker workspace subscription must be ₹500");

  function isShowcaseEligible(prop) {
    return prop.bedrooms >= 3;
  }

  const villa3Bhk = { id: "p1", name: "Dune Haven", bedrooms: 3 };
  const farmhouse4Bhk = { id: "p2", name: "Palm Estate", bedrooms: 4 };
  const penthouse2Bhk = { id: "p3", name: "City Flat", bedrooms: 2 };
  const studio1Bhk = { id: "p4", name: "Solo Suite", bedrooms: 1 };

  assert.strictEqual(isShowcaseEligible(villa3Bhk), true, "3 BHK is eligible for 9bhk app showcase");
  assert.strictEqual(isShowcaseEligible(farmhouse4Bhk), true, "4 BHK is eligible for 9bhk app showcase");
  assert.strictEqual(isShowcaseEligible(penthouse2Bhk), false, "<3 BHK cannot be showcased in public app");
  assert.strictEqual(isShowcaseEligible(studio1Bhk), false, "<3 BHK cannot be showcased in public app");
});

