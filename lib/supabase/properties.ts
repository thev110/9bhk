import { emptyDraft, type ListingDraft } from "@/lib/store";
import { browserSupabase } from "@/lib/supabase/browser";
import { validateListingDraft } from "@/lib/operations";

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
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      throw new Error("Photos must be JPG, PNG or WebP and no larger than 10 MB.");
    }
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
  validateListingDraft(form);
  const id = form.propertyId || slug(form.name);
  const seaside = form.setting === "seaside";
  const values = {
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
    status: "draft",
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
  };
  const result = form.propertyId
    ? await supabase.from("bhk_properties").update(values).eq("id", id).eq("host_id", data.user.id).in("status", ["draft", "rejected"]).select("id").single()
    : await supabase.from("bhk_properties").insert(values).select("id").single();
  const { error } = result;
  if (error) throw error;
  return id;
}

export async function submitPropertyForReview(id: string): Promise<void> {
  const supabase = browserSupabase();
  if (!supabase) throw new Error("Online services are not configured.");
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sign in to continue.");
  const documents = await supabase.from("bhk_property_documents").select("kind,status").eq("property_id", id);
  if (documents.error) throw documents.error;
  if (!["ownership_proof", "tax_receipt", "host_id"].every(kind => documents.data.some(doc => doc.kind === kind && doc.status !== "rejected"))) {
    throw new Error("Upload ownership proof, tax receipt and host ID before submitting.");
  }
  const result = await supabase.from("bhk_properties").update({ status: "pending", submitted_at: new Date().toISOString() })
    .eq("id", id).eq("host_id", data.user.id).eq("status", "draft").select("id").single();
  if (result.error) throw result.error;
}

export type HostProperty = { id: string; name: string; location: string; status: string; image_urls: string[] | null; min_stay: number; price: number; weekend_price: number | null };
export async function loadHostProperties(): Promise<HostProperty[]> {
  const supabase = browserSupabase();
  if (!supabase) throw new Error("Online services are not configured.");
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sign in to continue.");
  const result = await supabase.from("bhk_properties").select("id,name,location,status,image_urls,min_stay,price,weekend_price")
    .eq("host_id", data.user.id).order("created_at", { ascending: false });
  if (result.error) throw result.error;
  return result.data ?? [];
}

export async function loadListingDraft(id: string): Promise<ListingDraft> {
  const supabase = browserSupabase();
  if (!supabase) throw new Error("Online services are not configured.");
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sign in to continue.");
  const result = await supabase.from("bhk_properties").select("*").eq("id", id).eq("host_id", data.user.id)
    .in("status", ["draft", "rejected"]).single();
  if (result.error) throw result.error;
  const row = result.data;
  return { ...emptyDraft(), propertyId: row.id, status: "draft", name: row.name, description: row.description || "", type: row.type,
    guests: row.guests, city: row.city, area: row.area || "", address: row.address || "", setting: row.setting || "countryside",
    settingDetail: row.setting_detail || "", bedrooms: row.bedrooms, beds: row.beds, bathrooms: row.bathrooms,
    amenities: row.amenities || [], photos: row.image_urls || [], price: row.price, cleaning: row.cleaning || 0,
    deposit: row.deposit || 0, minStay: row.min_stay || 1, isForSale: row.is_for_sale, salePrice: row.sale_price,
    beachFrontage: row.beach_frontage || undefined, garageType: row.garage_type || undefined, garageCapacity: row.garage_capacity,
    landArea: row.land_area || undefined, hostsCelebrations: row.hosts_celebrations, maxEventGuests: row.max_event_guests,
    powerLoadKw: row.power_load_kw, soundCurfewHour: row.sound_curfew_hour, parkingCars: row.parking_cars,
    generatorKw: row.generator_kw, catererKitchen: row.caterer_kitchen };
}

export async function loadHostBookings() {
  const supabase = browserSupabase();
  if (!supabase) throw new Error("Online services are not configured.");
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sign in to continue.");
  const result = await supabase.from("bhk_bookings").select("*").eq("host_id", data.user.id).order("check_in");
  if (result.error) throw result.error;
  return result.data ?? [];
}

export async function saveHostRules(id: string, minimumStay: number, weekendPrice: number | null): Promise<void> {
  if (!Number.isInteger(minimumStay) || minimumStay < 1 || minimumStay > 90 ||
    (weekendPrice !== null && (!Number.isInteger(weekendPrice) || weekendPrice <= 0))) throw new Error("Enter a valid minimum stay and weekend price.");
  const supabase = browserSupabase();
  if (!supabase) throw new Error("Online services are not configured.");
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sign in to continue.");
  const result = await supabase.from("bhk_properties").update({ min_stay: minimumStay, weekend_price: weekendPrice })
    .eq("id", id).eq("host_id", data.user.id).select("id").single();
  if (result.error) throw result.error;
}
