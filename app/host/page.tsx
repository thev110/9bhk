"use client";

import Link from "next/link";
import { useState } from "react";
import { PageBar, Shell } from "@/components/shell";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/catalog";
import { useT } from "@/lib/i18n";

export default function HostPage() {
  const { draft, user, updateUser, showToast } = useStore();
  const { properties } = useCatalog();
  const t = useT();
  const [upi, setUpi] = useState(user?.upiId ?? "");
  return (
    <Shell>
      <PageBar
        title={t("host.hosting")}
        backHref="/profile"
        right={
          <Link className="btn sm" href="/">
            {t("host.switchToGuest")}
          </Link>
        }
      />
      <header className="page-head">
        <p className="eyebrow">{t("host.workspace")}</p>
        <h1>{t("host.overviewTitle")}</h1>
      </header>
      <div className="pad mt">
        <div className="card">
          <h3>{t("host.payoutUpi")}</h3>
          <p className="muted">{t("host.payoutUpiBody")}</p>
          <label className="field mt">
            {t("host.fieldUpiId")}
            <input className="ctrl" value={upi} placeholder="name@okhdfcbank" onChange={(e) => setUpi(e.target.value)} />
          </label>
          <button
            className="btn sm mt"
            type="button"
            onClick={() => {
              updateUser({ upiId: upi.trim() });
              showToast(t("host.toastUpiSaved"));
            }}
          >
            {t("host.saveUpi")}
          </button>
        </div>
      </div>
      <div className="stats pad mt">
        <div className="stat">
          <p className="lb">{t("host.statUpcoming")}</p>
          <p className="nb">4</p>
          <p className="sub">{t("host.statNextCheckin")}</p>
        </div>
        <div className="stat">
          <p className="lb">{t("host.statThisMonth")}</p>
          <p className="nb">₹86,400</p>
          <p className="sub">{t("host.statAcrossFarmhouses")}</p>
        </div>
        <div className="stat">
          <p className="lb">{t("host.statOccupancy")}</p>
          <p className="nb">68%</p>
          <p className="sub">{t("host.statLast30")}</p>
        </div>
        <div className="stat">
          <p className="lb">{t("host.statViews")}</p>
          <p className="nb">1,240</p>
          <p className="sub">{t("host.statViewsDelta")}</p>
        </div>
      </div>

      <div className="between pad mt">
        <h2>{t("host.yourProperties")}</h2>
        <Link className="btn sm" href="/host/new">
          {t("host.add")}
        </Link>
      </div>
      <div className="stack pad mt">
        {properties.map((item) => (
          <article className="card" key={item.id}>
            <img src={item.image} alt="" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 12 }} />
            <div className="between mt">
              <h3>{item.name}</h3>
              <span className="pill ok">{t("host.statusPublished")}</span>
            </div>
            <p className="muted">{item.location}</p>
            <p>{item.highlights}</p>
            <div className="row mt">
              <Link className="btn outline sm" href={`/property/${item.id}`}>
                {t("host.view")}
              </Link>
              <Link className="btn ghost sm" href="/host/bookings">
                {t("host.bookings")}
              </Link>
            </div>
          </article>
        ))}
        {draft ? (
          <article className="card">
            <div className="between">
              <h3>{draft.name || t("host.untitledFarmhouse")}</h3>
              <span className="pill warn">{draft.status === "pending" ? t("host.statusPendingReview") : t("host.statusDraft")}</span>
            </div>
            <p className="muted">{draft.city}</p>
            <Link className="btn outline sm mt" href="/host/new">
              {t("host.resume")}
            </Link>
          </article>
        ) : null}
        <div className="card">
          <h3>{t("host.emptyTitle")}</h3>
          <p className="muted">{t("host.emptyBody")}</p>
          <Link className="btn mt" href="/host/new">
            {t("host.listYourFarmhouse")}
          </Link>
        </div>
      </div>

      <div className="pad mt">
        <h2>{t("host.hostingTools")}</h2>
        <div className="menu mt">
          <Link className="mi" href="/host/bookings">
            <span className="lb">{t("host.bookings")}</span>
            <span className="meta">{t("profile.upcomingCount", { n: 4 })}</span>
          </Link>
          <Link className="mi" href="/host/bookings?tab=earnings">
            <span className="lb">{t("host.earnings")}</span>
            <span className="meta">₹86,400</span>
          </Link>
        </div>
      </div>
    </Shell>
  );
}
