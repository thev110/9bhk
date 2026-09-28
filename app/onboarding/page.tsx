"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { defaultUser, useStore, type UserRole } from "@/lib/store";
import { Icon } from "@/components/icon";
import { useT } from "@/lib/i18n";

export default function OnboardingPage() {
  const router = useRouter();
  const { signIn, showToast } = useStore();
  const t = useT();

  const [step, setStep] = useState<"role" | "details" | "complete">("role");
  const [role, setRole] = useState<UserRole>("buyer");
  
  // Common details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Chennai");

  // Realtor specific
  const [agencyName, setAgencyName] = useState("");
  const [reraNumber, setReraNumber] = useState("");
  const [budgetBracket, setBudgetBracket] = useState("₹10 Cr – ₹35 Cr");

  // Buyer specific
  const [buyerIntent, setBuyerIntent] = useState<"buy" | "rent" | "both">("both");
  const [garageNeed, setGarageNeed] = useState<string>("collector_vault");

  // Seller specific
  const [beachFrontage, setBeachFrontage] = useState("150 ft");

  const [busy, setBusy] = useState(false);

  function handleComplete() {
    if (!name.trim()) {
      showToast(t("onboarding.toastNeedName"));
      return;
    }
    setBusy(true);

    const newUser = {
      ...defaultUser,
      name: name.trim(),
      phone: phone.trim() || "+91 98400 00000",
      city: city || "Chennai",
      role,
      agencyName: role === "realtor" ? agencyName.trim() : undefined,
      reraNumber: role === "realtor" ? reraNumber.trim() : undefined,
      verifiedBroker: role === "realtor",
    };

    signIn(newUser);

    setTimeout(() => {
      setBusy(false);
      if (role === "realtor") {
        showToast(t("onboarding.toastRealtorActivated"));
        router.push("/realtor");
      } else if (role === "seller") {
        showToast(t("onboarding.toastSellerWelcome"));
        router.push("/host/new");
      } else {
        showToast(t("onboarding.toastBuyerWelcome"));
        router.push(buyerIntent === "buy" ? "/buy" : "/");
      }
    }, 600);
  }

  return (
    <Shell>
      <div className="pad stack" style={{ minHeight: "100vh", paddingTop: 40, paddingBottom: 48 }}>
        <div className="between" style={{ alignItems: "center" }}>
          <span className="brand-name" style={{ fontSize: 18 }}>9bhk.app</span>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => router.push("/")}
            style={{ fontSize: 12 }}
          >
            {t("onboarding.exploreAsGuest")}
          </button>
        </div>

        {step === "role" && (
          <div className="stack mt" style={{ marginTop: 24 }}>
            <span className="pill forest" style={{ alignSelf: "flex-start" }}>
              {t("onboarding.marketplacePill")}
            </span>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36, lineHeight: 1.1 }}>
              {t("onboarding.heroTitle")}
            </h1>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              {t("onboarding.heroBody")}
            </p>

            <div className="stack" style={{ gap: 12, marginTop: 16 }}>
              {/* Option 1: Buyer / Investor */}
              <div
                className={`card ${role === "buyer" ? "active-role" : ""}`}
                onClick={() => setRole("buyer")}
                style={{
                  cursor: "pointer",
                  border: role === "buyer" ? "2px solid var(--forest)" : "1px solid var(--border)",
                  background: role === "buyer" ? "var(--surface)" : "var(--surface-2)",
                  padding: "16px",
                  borderRadius: "var(--r-md)",
                  transition: "all .18s ease",
                }}
              >
                <div className="between" style={{ alignItems: "center" }}>
                  <div className="row" style={{ gap: 10, alignItems: "center" }}>
                    <div style={{ padding: 8, borderRadius: "50%", background: "var(--surface-3)" }}>
                      <Icon name="compass" style={{ width: 18, height: 18, color: "var(--forest)" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>{t("onboarding.roleBuyer")}</h3>
                      <p className="muted" style={{ fontSize: 12.5, margin: "2px 0 0" }}>
                        {t("onboarding.roleBuyerBody")}
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="userRole"
                    checked={role === "buyer"}
                    onChange={() => setRole("buyer")}
                    aria-label={t("onboarding.roleBuyer")}
                  />
                </div>
              </div>

              {/* Option 2: Licensed Realtor / Broker */}
              <div
                className={`card ${role === "realtor" ? "active-role" : ""}`}
                onClick={() => setRole("realtor")}
                style={{
                  cursor: "pointer",
                  border: role === "realtor" ? "2px solid var(--forest)" : "1px solid var(--border)",
                  background: role === "realtor" ? "var(--surface)" : "var(--surface-2)",
                  padding: "16px",
                  borderRadius: "var(--r-md)",
                  transition: "all .18s ease",
                }}
              >
                <div className="between" style={{ alignItems: "center" }}>
                  <div className="row" style={{ gap: 10, alignItems: "center" }}>
                    <div style={{ padding: 8, borderRadius: "50%", background: "var(--surface-3)" }}>
                      <Icon name="key" style={{ width: 18, height: 18, color: "var(--forest)" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>{t("onboarding.roleRealtor")}</h3>
                      <p className="muted" style={{ fontSize: 12.5, margin: "2px 0 0" }}>
                        {t("onboarding.roleRealtorBody")}
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="userRole"
                    checked={role === "realtor"}
                    onChange={() => setRole("realtor")}
                    aria-label={t("onboarding.roleRealtor")}
                  />
                </div>
              </div>

              {/* Option 3: Beachfront Estate Owner / Seller */}
              <div
                className={`card ${role === "seller" ? "active-role" : ""}`}
                onClick={() => setRole("seller")}
                style={{
                  cursor: "pointer",
                  border: role === "seller" ? "2px solid var(--forest)" : "1px solid var(--border)",
                  background: role === "seller" ? "var(--surface)" : "var(--surface-2)",
                  padding: "16px",
                  borderRadius: "var(--r-md)",
                  transition: "all .18s ease",
                }}
              >
                <div className="between" style={{ alignItems: "center" }}>
                  <div className="row" style={{ gap: 10, alignItems: "center" }}>
                    <div style={{ padding: 8, borderRadius: "50%", background: "var(--surface-3)" }}>
                      <Icon name="home" style={{ width: 18, height: 18, color: "var(--forest)" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>{t("onboarding.roleSeller")}</h3>
                      <p className="muted" style={{ fontSize: 12.5, margin: "2px 0 0" }}>
                        {t("onboarding.roleSellerBody")}
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="userRole"
                    checked={role === "seller"}
                    onChange={() => setRole("seller")}
                    aria-label={t("onboarding.roleSeller")}
                  />
                </div>
              </div>
            </div>

            <button
              className="btn block mt"
              type="button"
              style={{ marginTop: 24 }}
              onClick={() => setStep("details")}
            >
              {t("onboarding.continueAs", {
                role: role === "realtor"
                  ? t("onboarding.roleRealtorShort")
                  : role === "seller"
                  ? t("onboarding.roleSellerShort")
                  : t("onboarding.roleBuyerShort"),
              })}
            </button>
          </div>
        )}

        {step === "details" && (
          <div className="stack mt" style={{ marginTop: 24 }}>
            <span className="pill forest" style={{ alignSelf: "flex-start" }}>
              {t("onboarding.credentialsPill")}
            </span>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32 }}>
              {role === "realtor"
                ? t("onboarding.titleRealtor")
                : role === "seller"
                ? t("onboarding.titleSeller")
                : t("onboarding.titleBuyer")}
            </h2>

            <form
              className="stack"
              style={{ gap: 14, marginTop: 12 }}
              onSubmit={(e) => {
                e.preventDefault();
                handleComplete();
              }}
            >
              <label className="field">
                <span>{role === "realtor" ? t("onboarding.fieldPrincipalAgent") : t("onboarding.fieldFullName")}</span>
                <input
                  className="ctrl"
                  type="text"
                  placeholder={t("onboarding.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>{t("onboarding.fieldPhone")}</span>
                <input
                  className="ctrl"
                  type="tel"
                  placeholder="+91 98400 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>

              {role === "realtor" && (
                <>
                  <label className="field">
                    <span>{t("onboarding.fieldAgency")}</span>
                    <input
                      className="ctrl"
                      type="text"
                      placeholder={t("onboarding.agencyPlaceholder")}
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>{t("onboarding.fieldRera")}</span>
                    <input
                      className="ctrl"
                      type="text"
                      placeholder="e.g. TN/AGENT/0491/2023"
                      value={reraNumber}
                      onChange={(e) => setReraNumber(e.target.value)}
                    />
                    <span className="help" style={{ fontSize: 11, color: "var(--muted)" }}>
                      {t("onboarding.reraHelp")}
                    </span>
                  </label>

                  <label className="field">
                    <span>{t("onboarding.fieldAcquisitionRange")}</span>
                    <select
                      className="ctrl"
                      value={budgetBracket}
                      onChange={(e) => setBudgetBracket(e.target.value)}
                    >
                      <option value="₹5 Cr – ₹15 Cr">{t("onboarding.budgetBoutique")}</option>
                      <option value="₹15 Cr – ₹35 Cr">{t("onboarding.budgetSupercar")}</option>
                      <option value="₹35 Cr – ₹100+ Cr">{t("onboarding.budgetSignature")}</option>
                    </select>
                  </label>
                </>
              )}

              {role === "buyer" && (
                <>
                  <label className="field">
                    <span>{t("onboarding.fieldCoastalInterest")}</span>
                    <select
                      className="ctrl"
                      value={buyerIntent}
                      onChange={(e) => setBuyerIntent(e.target.value as any)}
                    >
                      <option value="both">{t("onboarding.intentBoth")}</option>
                      <option value="buy">{t("onboarding.intentBuy")}</option>
                      <option value="rent">{t("onboarding.intentRent")}</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>{t("onboarding.fieldAutomotive")}</span>
                    <select
                      className="ctrl"
                      value={garageNeed}
                      onChange={(e) => setGarageNeed(e.target.value)}
                    >
                      <option value="collector_vault">{t("onboarding.optionCollectorVault")}</option>
                      <option value="marine_port">{t("onboarding.optionMarinePort")}</option>
                      <option value="ev_pavilion">{t("onboarding.optionEvPavilion")}</option>
                      <option value="teak_portico">{t("onboarding.optionTeakPortico")}</option>
                    </select>
                  </label>
                </>
              )}

              {role === "seller" && (
                <label className="field">
                  <span>{t("onboarding.fieldFrontage")}</span>
                  <input
                    className="ctrl"
                    type="text"
                    placeholder={t("onboarding.frontagePlaceholder")}
                    value={beachFrontage}
                    onChange={(e) => setBeachFrontage(e.target.value)}
                  />
                </label>
              )}

              <div className="row mt" style={{ marginTop: 20, gap: 10 }}>
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setStep("role")}
                  disabled={busy}
                >
                  {t("onboarding.back")}
                </button>
                <button
                  type="submit"
                  className="btn block"
                  disabled={busy}
                >
                  {busy ? t("onboarding.activating") : t("onboarding.complete")}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Shell>
  );
}
