import type { ListingDraft } from "@/lib/store";
import { browserSupabase } from "@/lib/supabase/browser";

function slug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "stay"}-${Date.now().toString(36)}`;
}

export async function uploadPropertyPhotos(files: File[]): Promise<string[]> {
  const supabase = browserSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sign in with Google before uploading photos");
  const urls: string[] = [];
  for (const file of files) {
    const path = `${data.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]+/g, "-")}`;
    const { error } = await supabase.storage.from("property-images").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    urls.push(supabase.storage.from("property-images").getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

export async function saveProperty(form: ListingDraft): Promise<string> {
  const supabase = browserSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sign in with Google before publishing");
  const id = slug(form.name);
  const seaside = form.setting === "seaside";
  const { error } = await supabase.from("bhk_properties").insert({
    id,
    host_id: data.user.id,
    name: form.name,
    description: form.description,
    type: form.type,
    location: [form.area, form.city].filter(Boolean).join(" · "),
    city: form.city,
    area: form.area,
    address: form.address,
    guests: form.guests,
    bedrooms: form.bedrooms,
    beds: form.beds,
    bathrooms: form.bathrooms,
    price: form.price,
    cleaning: form.cleaning,
    deposit: form.deposit,
    min_stay: form.minStay,
    amenities: form.amenities,
    image_urls: form.photos,
    highlights: `${form.guests} guests · ${form.type}`,
    blurb: form.description,
    alt: form.name,
    // The wizard's last button says "Submit for review", so that is what this
    // has to do. Going straight to 'published' meant the review queue could
    // never contain anything, and staff had nothing to approve.
    status: "pending",
    submitted_at: new Date().toISOString(),
    setting: form.setting,
    setting_name: [form.area, form.city].filter(Boolean).join(" · "),
    setting_detail: form.settingDetail,
    // Coastal columns are written only for beachfront listings; everything
    // else must land as NULL so the detail page never renders a shoreline
    // spec for a hill or city house.
    beach_frontage: seaside ? form.beachFrontage || null : null,
    is_for_sale: Boolean(form.isForSale),
    sale_price: form.salePrice || null,
    // Garage is optional — no garage_type means no garage section.
    garage_type: form.garageType || null,
    garage_capacity: form.garageType ? form.garageCapacity || 2 : null,
    land_area: form.landArea || null,
    // Celebration columns are written only when the host has actually turned
    // events on, so a house that cannot host a function lands as NULL across
    // the board instead of rendering a half-filled capacity block.
    hosts_celebrations: Boolean(form.hostsCelebrations),
    max_event_guests: form.hostsCelebrations ? form.maxEventGuests ?? null : null,
    power_load_kw: form.hostsCelebrations ? form.powerLoadKw ?? null : null,
    sound_curfew_hour: form.hostsCelebrations ? form.soundCurfewHour ?? null : null,
    parking_cars: form.hostsCelebrations ? form.parkingCars ?? null : null,
    generator_kw: form.hostsCelebrations ? form.generatorKw ?? null : null,
    caterer_kitchen: form.hostsCelebrations ? Boolean(form.catererKitchen) : null,
  });
  if (error) throw error;
  return id;
}
