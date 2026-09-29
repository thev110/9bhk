"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { Icon } from "@/components/icon";
import { CITIES, formatBytes, inr } from "@/lib/format";
import { MIN_BEDROOMS, PROPERTIES, SETTINGS, formatInrCrores, type Setting } from "@/lib/properties";
import { emptyDraft, useStore, type ListingDraft } from "@/lib/store";
import { useCatalog } from "@/lib/catalog";
import { saveProperty, uploadPropertyPhotos } from "@/lib/supabase/properties";
import {
  DOCUMENT_ACCEPT_ATTR,
  DOCUMENT_KINDS,
  uploadPropertyDocument,
  validateDocument,
  type DocumentKind,
} from "@/lib/supabase/documents";
import { useT } from "@/lib/i18n";
import { garageLabel } from "@/lib/i18n/garage";
import { settingLabel } from "@/lib/i18n/vibes";
import { settingIcon } from "@/components/icon";
import type { DictKey } from "@/lib/i18n/en";

// Amenity and property-type values are persisted to the listing record and
// matched against the search index, so they stay as stored data — not copy.
const AMENITIES = ["Pool", "BBQ", "Bonfire", "Wi-Fi", "AC", "Parking", "Kitchen", "Pet friendly", "Indoor games", "Outdoor games", "Projector & music", "Caretaker", "Power backup"];
const TYPES = [
  "Villa",
  "Bungalow",
  "Pool House",
  "Farmhouse",
  "Countryside Estate",
  "Hill Station Villa",
  "City Villa",
  "Oceanfront Estate",
  "Cove Beachfront Villa",
];
const GARAGE_OPTIONS = [
  { id: "collector_vault", qualifier: "host.qualifierLowRamp" },
  { id: "marine_port", qualifier: "host.qualifierJetSkiSlip" },
  { id: "ev_pavilion", qualifier: "host.qualifierDcFastCharge" },
  { id: "teak_portico", qualifier: "host.qualifierPergola" },
] as const satisfies readonly { id: string; qualifier: DictKey }[];
const PHOTOS = PROPERTIES.slice(0, 6);

/**
 * Document slot -> label. Deliberately the same keys the admin console uses, so
 * the paper a host attaches and the paper a reviewer approves carry one name.
 */
const DOC_KIND_KEY: Record<DocumentKind, DictKey> = {
  ownership_proof: "admin.docOwnershipProof",
  tax_receipt: "admin.docTaxReceipt",
  host_id: "admin.docHostId",
};

const SECTIONS = [
  "host.sectionBasics",
  "host.sectionLocation",
  "host.sectionSpace",
  "celebration.wizardTitle",
  "host.sectionAmenities",
  "host.sectionPhotos",
  "host.sectionPrice",
  "host.sectionAvailability",
  "host.sectionPreview",
  "host.sectionPublish",
] as const satisfies readonly DictKey[];

const TITLES = [
  "host.titleBasics",
  "host.titleSetting",
  "host.titleSpace",
  "celebration.wizardTitle",
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
  // Documents are staged as plain Files and uploaded after the listing row
  // exists, because both the storage path and the index row are keyed by its id.
  const [docFiles, setDocFiles] = useState<Partial<Record<DocumentKind, File>>>({});

  function patch(partial: Partial<ListingDraft>) {
    setForm((f) => ({ ...f, ...partial }));
  }

  async function next() {
    if (step === 0 && form.name.trim().length < 3) {
      showToast(t("host.errNameShort"));
      return;
    }
    // 9bhk is a group-stay marketplace: below the floor the listing is not
    // bookable, so block the step rather than accepting a 1-bed room.
    if (step === 2 && form.bedrooms < MIN_BEDROOMS) {
      showToast(t("host.errMinBedrooms", { n: MIN_BEDROOMS }));
      return;
    }
    if (step === 9) {
      if (form.bedrooms < MIN_BEDROOMS) {
        showToast(t("host.errMinBedrooms", { n: MIN_BEDROOMS }));
        return;
      }
      try {
        const propertyId = await saveProperty(form);
        // Attach the paperwork to the listing that now exists. A failed upload
        // must not undo a saved listing, so it is reported rather than thrown.
        const failed = await uploadStagedDocuments(propertyId);
        setDraft(null);
        reload();
        setDone(true);
        if (failed) showToast(t("host.errDocsNotUploaded", { n: failed }));
      } catch (error) {
        showToast(error instanceof Error ? error.message : t("host.errSaveFailed"));
      }
      return;
    }
    setDraft(form);
    setStep((s) => s + 1);
  }

  /** Upload every staged document. Returns how many could not be sent. */
  async function uploadStagedDocuments(propertyId: string): Promise<number> {
    const staged = Object.entries(docFiles) as [DocumentKind, File][];
    let failed = 0;
    for (const [kind, file] of staged) {
      try {
        await uploadPropertyDocument({ propertyId, kind, file });
      } catch {
        failed += 1;
      }
    }
    return failed;
  }

  /**
   * Hold a chosen file until submit.
   *
   * The file is checked here as well as in the client library so the host gets
   * the reason immediately, instead of at the end of the wizard.
   */
  function stageDocument(kind: DocumentKind, list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    const problem = validateDocument(file);
    if (problem === "too_large") {
      showToast(t("host.errDocTooLarge"));
      return;
    }
    if (problem === "bad_type") {
      showToast(t("host.errDocType"));
      return;
    }
    setDocFiles((curr) => ({ ...curr, [kind]: file }));
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
          {t("host.sectionOf", { n: step + 1, total: 10, section: t(SECTIONS[step]) })}
        </p>
        <div className="pbar mt">
          <i style={{ width: `${((step + 1) / 10) * 100}%` }} />
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
            <p style={{ fontWeight: 800 }}>{t("host.fieldSetting")}</p>
            <div className="chips" style={{ paddingInline: 0, flexWrap: "wrap" }}>
              {SETTINGS.map((setting) => (
                <button
                  key={setting}
                  type="button"
                  className={`chip${form.setting === setting ? " is-active" : ""}`}
                  onClick={() => patch({ setting })}
                >
                  <Icon name={settingIcon(setting)} />
                  {settingLabel(t, setting)}
                </button>
              ))}
            </div>
            <span className="help">{t("host.helpSetting")}</span>
            <label className="field">
              {t("host.fieldSettingDetail")}
              <input
                className="ctrl"
                placeholder={t("host.settingDetailPlaceholder", { setting: settingLabel(t, form.setting) })}
                value={form.settingDetail}
                onChange={(e) => patch({ settingDetail: e.target.value })}
              />
            </label>
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
            <div
              className="between"
              style={{ padding: "10px 12px", borderRadius: "var(--r-md)", background: "var(--surface-2)" }}
            >
              <strong style={{ fontSize: 14 }}>{t("host.minBedroomsNote", { n: MIN_BEDROOMS })}</strong>
              <Icon name="shield" style={{ width: 16, height: 16, color: "var(--moss)" }} />
            </div>
            <Counter
              label={t("host.fieldBedrooms")}
              value={form.bedrooms}
              min={MIN_BEDROOMS}
              onChange={(bedrooms) => patch({ bedrooms })}
            />
            <Counter label={t("host.fieldBeds")} value={form.beds} min={MIN_BEDROOMS} onChange={(beds) => patch({ beds })} />
            <Counter label={t("host.fieldBathrooms")} value={form.bathrooms} onChange={(bathrooms) => patch({ bathrooms })} />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="muted">{t("celebration.wizardBody")}</p>
            <div
              className="between"
              style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}
            >
              <div>
                <strong>{t("celebration.toggle")}</strong>
                <p className="muted" style={{ fontSize: 12 }}>
                  {t("celebration.toggleHelp")}
                </p>
              </div>
              <button
                type="button"
                className="sw"
                aria-checked={Boolean(form.hostsCelebrations)}
                onClick={() => patch({ hostsCelebrations: !form.hostsCelebrations })}
              />
            </div>
            {form.hostsCelebrations ? (
              <>
                <label className="field">
                  {t("celebration.fieldCapacity")}
                  <input
                    className="ctrl"
                    inputMode="numeric"
                    value={form.maxEventGuests ?? ""}
                    onChange={(e) => patch({ maxEventGuests: Number(e.target.value) || 0 })}
                  />
                </label>
                <label className="field">
                  {t("celebration.fieldPower")}
                  <input
                    className="ctrl"
                    inputMode="numeric"
                    value={form.powerLoadKw ?? ""}
                    onChange={(e) => patch({ powerLoadKw: Number(e.target.value) || 0 })}
                  />
                </label>
                <label className="field">
                  {t("celebration.fieldCurfew")}
                  <input
                    className="ctrl"
                    inputMode="numeric"
                    value={form.soundCurfewHour ?? ""}
                    onChange={(e) =>
                      patch({ soundCurfewHour: Math.min(23, Math.max(0, Number(e.target.value) || 0)) })
                    }
                  />
                </label>
                <label className="field">
                  {t("celebration.fieldParking")}
                  <input
                    className="ctrl"
                    inputMode="numeric"
                    value={form.parkingCars ?? ""}
                    onChange={(e) => patch({ parkingCars: Number(e.target.value) || 0 })}
                  />
                </label>
                <label className="field">
                  {t("celebration.fieldGenerator")}
                  <input
                    className="ctrl"
                    inputMode="numeric"
                    value={form.generatorKw ?? ""}
                    onChange={(e) => patch({ generatorKw: Number(e.target.value) || 0 })}
                  />
                </label>
                <div
                  className="between"
                  style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}
                >
                  <strong>{t("celebration.catererYes")}</strong>
                  <button
                    type="button"
                    className="sw"
                    aria-checked={Boolean(form.catererKitchen)}
                    onClick={() => patch({ catererKitchen: !form.catererKitchen })}
                  />
                </div>
              </>
            ) : null}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <p className="muted">{t("host.stepGarage")}</p>
            {form.setting === "seaside" ? (
              <label className="field">
                <span>{t("host.fieldBeachFrontage")}</span>
                <input
                  className="ctrl"
                  placeholder={t("host.beachFrontagePlaceholder")}
                  value={form.beachFrontage || ""}
                  onChange={(e) => patch({ beachFrontage: e.target.value })}
                />
              </label>
            ) : null}
            <p style={{ fontWeight: 800, marginTop: 12 }}>{t("host.garageArchitecture")}</p>
            <div className="chips" style={{ paddingInline: 0, flexWrap: "wrap" }}>
              <button
                type="button"
                className={`chip${!form.garageType ? " is-active" : ""}`}
                onClick={() => patch({ garageType: undefined, garageCapacity: undefined })}
              >
                <Icon name="close" />
                {t("host.noGarage")}
              </button>
              {GARAGE_OPTIONS
                .filter((g) => g.id !== "marine_port" || form.setting === "seaside")
                .map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`chip${form.garageType === g.id ? " is-active" : ""}`}
                    onClick={() => patch({ garageType: g.id, garageCapacity: form.garageCapacity || 2 })}
                  >
                    <Icon name="car" />
                    {garageLabel(t, g.id)} {t(g.qualifier)}
                  </button>
                ))}
            </div>
            {form.garageType ? (
              <div className="between" style={{ marginTop: 12 }}>
                <strong>{t("host.fieldGarageCapacity")}</strong>
                <div className="stepper">
                  <button type="button" onClick={() => patch({ garageCapacity: Math.max(1, (form.garageCapacity || 2) - 1) })}>
                    <Icon name="minus" />
                  </button>
                  <span className="val num">{form.garageCapacity || 2}</span>
                  <button type="button" onClick={() => patch({ garageCapacity: (form.garageCapacity || 2) + 1 })}>
                    <Icon name="plus" />
                  </button>
                </div>
              </div>
            ) : null}
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

        {step === 5 ? (
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
                  <img key={photo} src={photo} alt="" loading="lazy" decoding="async" width={200} height={200} style={{ aspectRatio: "1", objectFit: "cover", width: "100%" }} />
                ))}
              </div>
            ) : null}
            <div className="gal" style={{ padding: 0 }}>
              {PHOTOS.map((photo) => {
                const on = form.photos.includes(photo.image);
                return (
                  <button key={photo.id} type="button" onClick={() => patch({ photos: on ? form.photos.filter((p) => p !== photo.image) : [...form.photos, photo.image] })} style={{ border: on ? "2px solid var(--primary)" : "2px solid transparent", padding: 0, background: "none" }}>
                    <img src={photo.image} alt={photo.alt} loading="lazy" decoding="async" width={200} height={200} style={{ aspectRatio: "1", objectFit: "cover", width: "100%" }} />
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

        {step === 6 ? (
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

        {step === 7 ? (
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

        {step === 8 ? (
          <article className="card">
            {form.photos[0] ? <img src={form.photos[0]} alt="" style={{ borderRadius: 16, marginBottom: 12 }} /> : null}
            <div className="row wrap" style={{ gap: 6, marginBottom: 8 }}>
              <span className="pill forest" style={{ fontSize: 11 }}>
                <Icon name={settingIcon(form.setting)} style={{ width: 12, height: 12 }} />
                {settingLabel(t, form.setting as Setting)}
              </span>
              {form.settingDetail ? <span className="pill muted" style={{ fontSize: 11 }}>{form.settingDetail}</span> : null}
            </div>
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

        {step === 9 ? (
          <div className="stack">
            <p>{t("host.stepPublish")}</p>
            <p className="sec-title" style={{ fontSize: 13 }}>{t("host.documentsTitle")}</p>
            <p className="muted">{t("host.documentsBody")}</p>
            {DOCUMENT_KINDS.map((kind) => {
              const file = docFiles[kind];
              return (
                <div className="between" key={kind} style={{ gap: 10 }}>
                  <span className="nm" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Icon name="shield" />
                    <span style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: 13.5 }}>{t(DOC_KIND_KEY[kind])}</strong>
                      <span className="tiny muted">
                        {file ? `${file.name} · ${formatBytes(file.size)}` : t("host.docNone")}
                      </span>
                    </span>
                  </span>
                  <label className="btn outline sm" style={{ flex: "none" }}>
                    {file ? t("host.docReplace") : t("host.docUpload")}
                    <input
                      type="file"
                      className="sr"
                      accept={DOCUMENT_ACCEPT_ATTR}
                      onChange={(event) => {
                        stageDocument(kind, event.target.files);
                        // Reset so re-picking the same file fires change again.
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="row">
          {step > 0 ? (
            <button className="btn outline" type="button" onClick={() => setStep((s) => s - 1)}>
              {t("action.back")}
            </button>
          ) : null}
          <button className="btn grow" type="button" onClick={next} disabled={uploading}>
            {step === 9 ? t("host.submitForReview") : t("action.continue")}
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Counter({
  label,
  value,
  min = 0,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="between">
      <strong>{label}</strong>
      <div className="stepper">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}>
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
