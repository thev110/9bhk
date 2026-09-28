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
    status: "published",
    beach_frontage: form.beachFrontage || "120 ft direct beachfront",
    is_for_sale: Boolean(form.isForSale),
    sale_price: form.salePrice || null,
    garage_type: form.garageType || "collector_vault",
    garage_capacity: form.garageCapacity || 2,
    land_area: form.landArea || null,
  });
  if (error) throw error;
  return id;
}
