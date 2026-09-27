const fs = require("fs");
const src = fs.readFileSync("lib/properties.ts", "utf8");
const start = src.indexOf("export const PROPERTIES");
const end = src.indexOf("export const VIBES");
const body = src.slice(start, end).replace("export const PROPERTIES: Property[] =", "const PROPERTIES =");
const PROPERTIES = eval(`${body}\nPROPERTIES`);
const q = (value) => String(value).replace(/'/g, "''");
const arr = (items) => `array[${items.map((item) => `'${q(item)}'`).join(",")}]`;
const sql = PROPERTIES.map(
  (property) =>
    `insert into public.bhk_properties (id, name, description, type, location, city, guests, bedrooms, beds, bathrooms, price, cleaning, amenities, vibes, image_urls, rating, reviews, highlights, blurb, alt, guest_favourite, group_name, status) values ('${q(property.id)}', '${q(property.name)}', '${q(property.blurb)}', '${q(property.type)}', '${q(property.location)}', '${q(property.city)}', ${property.guests}, ${property.bedrooms}, ${property.beds}, ${property.bathrooms}, ${property.price}, ${property.cleaning}, ${arr(property.amenities)}, ${arr(property.vibes)}, array['${q(property.image)}'], ${property.rating}, ${property.reviews}, '${q(property.highlights)}', '${q(property.blurb)}', '${q(property.alt)}', ${property.guestFavourite ? "true" : "false"}, '${property.group}', 'published') on conflict (id) do update set name = excluded.name, image_urls = excluded.image_urls, blurb = excluded.blurb, price = excluded.price;`,
).join("\n");
fs.appendFileSync("supabase/migrations/20260927120000_bhk_properties.sql", `\n${sql}\n`);
console.log(PROPERTIES.length);
