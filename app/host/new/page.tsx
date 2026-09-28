"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { CITIES, inr } from "@/lib/format";
import { PROPERTIES, formatInrCrores } from "@/lib/properties";
import { emptyDraft, useStore, type ListingDraft } from "@/lib/store";
import { useCatalog } from "@/lib/catalog";
import { saveProperty, uploadPropertyPhotos } from "@/lib/supabase/properties";
import { useT } from "@/lib/i18n";
import { garageLabel } from "@/lib/i18n/garage";
import type { DictKey } from "@/lib/i18n/en";

// Amenity and property-type values are persisted to the listing record and
// matched against the search index, so they stay as stored data — not copy.
const AMENITIES = ["Pool", "BBQ", "Bonfire", "Wi-Fi", "AC", "Parking", "Kitchen", "Pet friendly", "Indoor games", "Outdoor games", "Projector & music", "Caretaker", "Power backup"];
const TYPES = [
  "Oceanfront Estate",
  "Marine Beachfront Villa",
  "Dune Edge Sanctuary",
  "Cove Beachfront Villa",
];
const GARAGE_OPTIONS = [
  { id: "collector_vault", qualifier: "host.qualifierLowRamp" },
  { id: "marine_port", qualifier: "host.qualifierJetSkiSlip" },
  { id: "ev_pavilion", qualifier: "host.qualifierDcFastCharge" },
  { id: "teak_portico", qualifier: "host.qualifierPergola" },
] as const satisfies readonly { id: string; qualifier: DictKey }[];
const PHOTOS = PROPERTIES.slice(0, 6);

const SECTIONS = [
  "host.sectionBasics",
  "host.sectionLocation",
  "host.sectionSpace",
  "host.sectionAmenities",
  "host.sectionPhotos",
  "host.sectionPrice",
  "host.sectionAvailability",
  "host.sectionPreview",
  "host.sectionPublish",
] as const satisfies readonly DictKey[];

const TITLES = [
  "host.titleBasics",
  "host.titleShoreline",
  "host.titleSpace",
  "host.titleGarage",
  "host.titlePhotos",
  "host.titlePricing",
  "host.titleAvailability",
  "host.titlePreview",
  "host.titlePublish",
] as const satisfies readonly DictKey[];

export default function ListingWizard() {
  const router = useRouter();
  const { draft, setDraft, showToast } = useStore();
  const { reload } = useCatalog();
  const t = useT();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ListingDraft>(draft ?? emptyDraft());
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);

  function patch(partial: Partial<ListingDraft>) {
    setForm((f) => ({ ...f, ...partial }));
  }

  async function next() {
    if (step === 0 && form.name.trim().length < 3) {
      showToast(t("host.errNameShort"));
      return;
    }
    if (step === 8) {
      try {
        await saveProperty(form);
        setDraft(null);
        reload();
        setDone(true);
      } catch (error) {
        showToast(error instanceof Error ? error.message : t("host.errSaveFailed"));
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
      showToast(error instanceof Error ? error.message : t("host.errPhotoUpload"));
    } finally {
      setUploading(false);
    }
  }

  if (done) {
    return (
      <Shell>
        <PageBar title={t("host.newListing")} backHref="/host" />
        <div className="pad mt stack">
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36 }}>{t("host.submittedTitle")}</h1>
          <p>{t("host.savedBody", { name: form.name || t("host.untitledFarmhouse") })}</p>
          <button className="btn block" type="button" onClick={() => router.push("/host")}>
            {t("host.backToHosting")}
          </button>
        </div>
      </Shell>
    );
  }

  const guestPays = form.price * 2 + form.cleaning;

  return (
    <Shell>
      <PageBar title={t("host.newListing")} backHref="/host" />
      <div className="pad mt">
        <p className="muted">
          {t("host.sectionOf", { n: step + 1, total: 9, section: t(SECTIONS[step]) })}
        </p>
        <div className="pbar mt">
          <i style={{ width: `${((step + 1) / 9) * 100}%` }} />
        </div>
        <h1 className="mt" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32 }}>
          {t(TITLES[step])}
        </h1>
      </div>

      <div className="pad mt stack">
        {step === 0 ? (
          <>
            <p className="muted">{t("host.stepBasics")}</p>
            <label className="field">
              {t("host.fieldPropertyName")}
              <input className="ctrl" value={form.name} onChange={(e) => patch({ name: e.target.value })} />
            </label>
            <label className="field">
              {t("host.fieldShortDescription")}
              <textarea className="ctrl" rows={3} value={form.description} onChange={(e) => patch({ description: e.target.value })} />
              <span className="help">{t("host.helpShortDescription")}</span>
            </label>
            <p>{t("host.fieldPropertyType")}</p>
            <div className="chips" style={{ paddingInline: 0 }}>
              {TYPES.map((type) => (
                <button key={type} className={`chip${form.type === type ? " is-active" : ""}`} type="button" onClick={() => patch({ type })}>
                  {type}
                </button>
              ))}
            </div>
            <div className="between">
              <div>
                <strong>{t("host.maximumGuests")}</strong>
                <p className="muted">{t("home.anyAgeCounts")}</p>
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
            <div className="between" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div>
                <strong>{t("host.listForSaleAcquisition")}</strong>
                <p className="muted" style={{ fontSize: 12 }}>{t("host.listForSaleHelp")}</p>
              </div>
              <button
                type="button"
                className="sw"
                aria-checked={Boolean(form.isForSale)}
                onClick={() => patch({ isForSale: !form.isForSale })}
              />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <p className="muted">{t("host.stepLocation")}</p>
            <label className="field">
              {t("host.fieldCityOrRegion")}
              <select className="ctrl" value={form.city} onChange={(e) => patch({ city: e.target.value })}>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              {t("host.fieldArea")}
              <input className="ctrl" value={form.area} onChange={(e) => patch({ area: e.target.value })} />
            </label>
            <label className="field">
              {t("host.fieldStreetAddress")}
              <input className="ctrl" value={form.address} onChange={(e) => patch({ address: e.target.value })} />
              <span className="help">{t("host.helpAddress")}</span>
            </label>
            <div className="card" style={{ minHeight: 120, background: "var(--surface-2)" }}>
              {t("host.dragPin")}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="muted">{t("host.stepSpace")}</p>
            <Counter label={t("host.fieldBedrooms")} value={form.bedrooms} onChange={(bedrooms) => patch({ bedrooms })} />
            <Counter label={t("host.fieldBeds")} value={form.beds} onChange={(beds) => patch({ beds })} />
            <Counter label={t("host.fieldBathrooms")} value={form.bathrooms} onChange={(bathrooms) => patch({ bathrooms })} />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="muted">{t("host.stepGarage")}</p>
            <label className="field">
              <span>{t("host.fieldBeachFrontage")}</span>
              <input
                className="ctrl"
                placeholder={t("host.beachFrontagePlaceholder")}
                value={form.beachFrontage || ""}
                onChange={(e) => patch({ beachFrontage: e.target.value })}
              />
            </label>
            <p style={{ fontWeight: 800, marginTop: 12 }}>{t("host.garageArchitecture")}</p>
            <div className="chips" style={{ paddingInline: 0, flexWrap: "wrap" }}>
              {GARAGE_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`chip${(form.garageType || "collector_vault") === g.id ? " is-active" : ""}`}
                  onClick={() => patch({ garageType: g.id })}
                >
                  <Icon name="car" />
                  {garageLabel(t, g.id)} {t(g.qualifier)}
                </button>
              ))}
            </div>
            <p style={{ fontWeight: 800, marginTop: 16 }}>{t("host.curatedAmenities")}</p>
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
            <p className="muted">{t("host.stepPhotos")}</p>
            <label className="btn block">
              {uploading ? t("host.uploading") : t("host.uploadPhotos")}
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
            <p className="muted">
              {t("host.photosAdded", { n: form.photos.length })}
              {form.photos.length ? ` · ${t("host.coverFirstShot")}` : "."}
            </p>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <p className="muted">{t("host.stepPricing")}</p>
            {form.isForSale ? (
              <div className="card" style={{ background: "color-mix(in oklch, var(--accent) 8%, var(--surface))", border: "1.5px solid var(--accent)", marginBottom: 14 }}>
                <p className="eyebrow" style={{ color: "var(--accent)" }}>{t("host.acquisitionTerms")}</p>
                <label className="field mt">
                  <span>{t("host.fieldAskingSalePrice")}</span>
                  <input
                    className="ctrl"
                    inputMode="numeric"
                    placeholder={t("host.askingPricePlaceholder")}
                    value={form.salePrice || ""}
                    onChange={(e) => patch({ salePrice: Number(e.target.value) || 0 })}
                  />
                  <span className="help" style={{ color: "var(--forest)", fontWeight: 700 }}>
                    {form.salePrice ? t("host.acquisitionAsking", { price: formatInrCrores(form.salePrice) }) : t("host.helpEnterAskingPrice")}
                  </span>
                </label>
                <label className="field mt">
                  <span>{t("host.fieldLandArea")}</span>
                  <input
                    className="ctrl"
                    placeholder={t("host.landAreaPlaceholder")}
                    value={form.landArea || ""}
                    onChange={(e) => patch({ landArea: e.target.value })}
                  />
                </label>
              </div>
            ) : null}
            <label className="field">
              {t("host.fieldBaseNightlyPrice")}
              <input className="ctrl" inputMode="numeric" value={form.price} onChange={(e) => patch({ price: Number(e.target.value) || 0 })} />
            </label>
            <label className="field">
              {t("host.fieldCleaningFee")}
              <input className="ctrl" inputMode="numeric" value={form.cleaning} onChange={(e) => patch({ cleaning: Number(e.target.value) || 0 })} />
              <span className="help">{t("host.helpChargedOnce")}</span>
            </label>
            <label className="field">
              {t("host.fieldSecurityDeposit")}
              <input className="ctrl" inputMode="numeric" value={form.deposit} onChange={(e) => patch({ deposit: Number(e.target.value) || 0 })} />
            </label>
            <p className="muted">{t("host.pricingRulesNote")}</p>
            <div className="card">
              <div className="sumline">
                <span className="k">{t("host.guestPaysTwoNights")}</span>
                <span className="num">{inr(form.price * 2)}</span>
              </div>
              <div className="sumline">
                <span className="k">{t("host.cleaningFeeLabel")}</span>
                <span className="num">{inr(form.cleaning)}</span>
              </div>
              <div className="sumline total">
                <span className="k">{t("host.beforeTaxes")}</span>
                <span className="num">{inr(guestPays)}</span>
              </div>
            </div>
          </>
        ) : null}

        {step === 6 ? (
          <>
            <p className="muted">{t("host.blockDatesBody")}</p>
            <div className="legend">
              <span>{t("host.calendarOpen")}</span>
              <span>{t("host.calendarBlocked")}</span>
            </div>
            <label className="field">
              {t("host.fieldMinStay")}
              <select className="ctrl" value={form.minStay} onChange={(e) => patch({ minStay: Number(e.target.value) })}>
                {[1, 2, 3, 5].map((n) => (
                  <option key={n} value={n}>
                    {n > 1 ? t("host.nightMany", { n }) : t("host.nightOne", { n })}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {step === 7 ? (
          <article className="card">
            {form.photos[0] ? <img src={form.photos[0]} alt="" style={{ borderRadius: 16, marginBottom: 12 }} /> : null}
            <h3>{form.name || t("host.untitledFarmhouse")}</h3>
            <p className="muted">
              {form.city}
              {form.area ? ` · ${form.area}` : ""}
            </p>
            <p>{form.description || t("host.previewDescriptionEmpty")}</p>
            <p className="muted">
              {t("host.previewGuests", { n: form.guests })} · {t("host.previewBedrooms", { n: form.bedrooms })} · {t("host.previewBeds", { n: form.beds })} · {t("host.previewBathrooms", { n: form.bathrooms })}
            </p>
            <p className="p-price num">
              {inr(form.price)} <span className="per">{t("property.perNight")}</span>
            </p>
          </article>
        ) : null}

        {step === 8 ? (
          <p>{t("host.stepPublish")}</p>
        ) : null}

        <div className="row">
          {step > 0 ? (
            <button className="btn outline" type="button" onClick={() => setStep((s) => s - 1)}>
              {t("action.back")}
            </button>
          ) : null}
          <button className="btn grow" type="button" onClick={next}>
            {step === 8 ? t("host.submitForReview") : t("action.continue")}
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
