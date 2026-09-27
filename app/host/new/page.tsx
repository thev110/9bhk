"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { CITIES, inr } from "@/lib/format";
import { PROPERTIES } from "@/lib/properties";
import { emptyDraft, useStore, type ListingDraft } from "@/lib/store";
import { useCatalog } from "@/lib/catalog";
import { saveProperty, uploadPropertyPhotos } from "@/lib/supabase/properties";

const AMENITIES = ["Pool", "BBQ", "Bonfire", "Wi-Fi", "AC", "Parking", "Kitchen", "Pet friendly", "Indoor games", "Outdoor games", "Projector & music", "Caretaker", "Power backup"];
const TYPES = ["Private farmhouse", "Farm stay", "Orchard retreat", "Pool villa"];
const PHOTOS = PROPERTIES.slice(0, 6);

const TITLES = [
  "Tell us about your farmhouse",
  "Where is your farmhouse?",
  "How much space?",
  "What's on the property?",
  "Add photos",
  "Set your nightly price",
  "Choose when guests can stay",
  "Preview your listing",
  "Ready to publish?",
];

export default function ListingWizard() {
  const router = useRouter();
  const { draft, setDraft, showToast } = useStore();
  const { reload } = useCatalog();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ListingDraft>(draft ?? emptyDraft());
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);

  function patch(partial: Partial<ListingDraft>) {
    setForm((f) => ({ ...f, ...partial }));
  }

  async function next() {
    if (step === 0 && form.name.trim().length < 3) {
      showToast("Add a property name guests will recognise.");
      return;
    }
    if (step === 8) {
      try {
        await saveProperty(form);
        setDraft(null);
        reload();
        setDone(true);
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Could not save the listing");
      }
      return;
    }
    setDraft(form);
    setStep((s) => s + 1);
  }

  async function addPhotos(list: FileList | null) {
    const files = [...(list ?? [])].filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await uploadPropertyPhotos(files);
      patch({ photos: [...form.photos, ...urls] });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Photo upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (done) {
    return (
      <Shell>
        <PageBar title="New listing" backHref="/host" />
        <div className="pad mt stack">
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36 }}>Submitted for review</h1>
          <p>{form.name || "Your farmhouse"} is saved, including its photos. Guests can see it on Explore.</p>
          <button className="btn block" type="button" onClick={() => router.push("/host")}>
            Back to hosting
          </button>
        </div>
      </Shell>
    );
  }

  const guestPays = form.price * 2 + form.cleaning;

  return (
    <Shell>
      <PageBar title="New listing" backHref="/host" />
      <div className="pad mt">
        <p className="muted">
          Step {step + 1} of 9 · {["Basics", "Location", "Space", "Amenities", "Photos", "Price", "Availability", "Preview", "Publish"][step]}
        </p>
        <div className="pbar mt">
          <i style={{ width: `${((step + 1) / 9) * 100}%` }} />
        </div>
        <h1 className="mt" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32 }}>
          {TITLES[step]}
        </h1>
      </div>

      <div className="pad mt stack">
        {step === 0 ? (
          <>
            <p className="muted">The name and short description guests see first.</p>
            <label className="field">
              Property name
              <input className="ctrl" value={form.name} onChange={(e) => patch({ name: e.target.value })} />
            </label>
            <label className="field">
              Short description
              <textarea className="ctrl" rows={3} value={form.description} onChange={(e) => patch({ description: e.target.value })} />
              <span className="help">One or two lines. You can expand this later.</span>
            </label>
            <p>Property type</p>
            <div className="chips" style={{ paddingInline: 0 }}>
              {TYPES.map((type) => (
                <button key={type} className={`chip${form.type === type ? " is-active" : ""}`} type="button" onClick={() => patch({ type })}>
                  {type}
                </button>
              ))}
            </div>
            <div className="between">
              <div>
                <strong>Maximum guests</strong>
                <p className="muted">Any age counts here</p>
              </div>
              <div className="stepper">
                <button type="button" onClick={() => patch({ guests: Math.max(1, form.guests - 1) })}>
                  <Icon name="minus" />
                </button>
                <span className="val num">{form.guests}</span>
                <button type="button" onClick={() => patch({ guests: form.guests + 1 })}>
                  <Icon name="plus" />
                </button>
              </div>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <p className="muted">Guests only see the exact pin after booking.</p>
            <label className="field">
              City or region
              <select className="ctrl" value={form.city} onChange={(e) => patch({ city: e.target.value })}>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Area or landmark
              <input className="ctrl" value={form.area} onChange={(e) => patch({ area: e.target.value })} />
            </label>
            <label className="field">
              Street address
              <input className="ctrl" value={form.address} onChange={(e) => patch({ address: e.target.value })} />
              <span className="help">Kept private until a booking is confirmed.</span>
            </label>
            <div className="card" style={{ minHeight: 120, background: "var(--surface-2)" }}>
              Drag the pin to your gate
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="muted">Bedrooms, beds and bathrooms help guests plan the group.</p>
            <Counter label="Bedrooms" value={form.bedrooms} onChange={(bedrooms) => patch({ bedrooms })} />
            <Counter label="Beds" value={form.beds} onChange={(beds) => patch({ beds })} />
            <Counter label="Bathrooms" value={form.bathrooms} onChange={(bathrooms) => patch({ bathrooms })} />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="muted">Pick everything guests can expect to find.</p>
            <div className="chips" style={{ paddingInline: 0, flexWrap: "wrap" }}>
              {AMENITIES.map((item) => {
                const on = form.amenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    className={`chip${on ? " is-active" : ""}`}
                    onClick={() => patch({ amenities: on ? form.amenities.filter((a) => a !== item) : [...form.amenities, item] })}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <p className="muted">Upload photos from your phone. They are stored with the listing.</p>
            <label className="btn block">
              {uploading ? "Uploading…" : "Upload photos"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                disabled={uploading}
                onChange={(event) => {
                  void addPhotos(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
            {form.photos.length ? (
              <div className="gal" style={{ padding: 0 }}>
                {form.photos.map((photo) => (
                  <img key={photo} src={photo} alt="" style={{ aspectRatio: "1", objectFit: "cover", width: "100%" }} />
                ))}
              </div>
            ) : null}
            <div className="gal" style={{ padding: 0 }}>
              {PHOTOS.map((photo) => {
                const on = form.photos.includes(photo.image);
                return (
                  <button key={photo.id} type="button" onClick={() => patch({ photos: on ? form.photos.filter((p) => p !== photo.image) : [...form.photos, photo.image] })} style={{ border: on ? "2px solid var(--primary)" : "2px solid transparent", padding: 0, background: "none" }}>
                    <img src={photo.image} alt={photo.alt} style={{ aspectRatio: "1", objectFit: "cover", width: "100%" }} />
                  </button>
                );
              })}
            </div>
            <p className="muted">{form.photos.length} photos added{form.photos.length ? " · cover set to the first shot." : "."}</p>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <p className="muted">You can change this any time from the listing.</p>
            <label className="field">
              Base nightly price (₹)
              <input className="ctrl" inputMode="numeric" value={form.price} onChange={(e) => patch({ price: Number(e.target.value) || 0 })} />
            </label>
            <label className="field">
              Cleaning fee (₹)
              <input className="ctrl" inputMode="numeric" value={form.cleaning} onChange={(e) => patch({ cleaning: Number(e.target.value) || 0 })} />
              <span className="help">Charged once per stay.</span>
            </label>
            <label className="field">
              Security deposit (₹) — optional
              <input className="ctrl" inputMode="numeric" value={form.deposit} onChange={(e) => patch({ deposit: Number(e.target.value) || 0 })} />
            </label>
            <p className="muted">Seasonal and holiday price overrides are supported later through pricing rules.</p>
            <div className="card">
              <div className="sumline">
                <span className="k">Guest pays for 2 nights</span>
                <span className="num">{inr(form.price * 2)}</span>
              </div>
              <div className="sumline">
                <span className="k">Cleaning fee</span>
                <span className="num">{inr(form.cleaning)}</span>
              </div>
              <div className="sumline total">
                <span className="k">Before taxes</span>
                <span className="num">{inr(guestPays)}</span>
              </div>
            </div>
          </>
        ) : null}

        {step === 6 ? (
          <>
            <p className="muted">Block dates when the farmhouse is unavailable.</p>
            <div className="legend">
              <span>Open</span>
              <span>Blocked</span>
            </div>
            <label className="field">
              Minimum stay (nights)
              <select className="ctrl" value={form.minStay} onChange={(e) => patch({ minStay: Number(e.target.value) })}>
                {[1, 2, 3, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} night{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {step === 7 ? (
          <article className="card">
            {form.photos[0] ? <img src={form.photos[0]} alt="" style={{ borderRadius: 16, marginBottom: 12 }} /> : null}
            <h3>{form.name || "Untitled farmhouse"}</h3>
            <p className="muted">
              {form.city}
              {form.area ? ` · ${form.area}` : ""}
            </p>
            <p>{form.description || "A short description will appear here."}</p>
            <p className="muted">
              {form.guests} guests · {form.bedrooms} bedrooms · {form.beds} beds · {form.bathrooms} bathrooms
            </p>
            <p className="p-price num">
              {inr(form.price)} <span className="per">/ night</span>
            </p>
          </article>
        ) : null}

        {step === 8 ? (
          <p>Publishing sends this listing to review. You can still edit details after it is approved.</p>
        ) : null}

        <div className="row">
          {step > 0 ? (
            <button className="btn outline" type="button" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          ) : null}
          <button className="btn grow" type="button" onClick={next}>
            {step === 8 ? "Submit for review" : "Continue"}
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="between">
      <strong>{label}</strong>
      <div className="stepper">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))}>
          <Icon name="minus" />
        </button>
        <span className="val num">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}>
          <Icon name="plus" />
        </button>
      </div>
    </div>
  );
}
