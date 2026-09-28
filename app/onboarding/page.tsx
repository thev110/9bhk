"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { defaultUser, useStore, type UserRole } from "@/lib/store";
import { Icon } from "@/components/icon";

export default function OnboardingPage() {
  const router = useRouter();
  const { signIn, showToast } = useStore();

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
      showToast("Please enter your name");
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
        showToast("Realtor Workspace activated. RERA credentials recorded.");
        router.push("/realtor");
      } else if (role === "seller") {
        showToast("Welcome owner. Proceeding to estate listing.");
        router.push("/host/new");
      } else {
        showToast("Welcome to 9bhk Coastal.");
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
            Explore as Guest
          </button>
        </div>

        {step === "role" && (
          <div className="stack mt" style={{ marginTop: 24 }}>
            <span className="pill forest" style={{ alignSelf: "flex-start" }}>
              Direct Beachfront & Automotive Marketplace
            </span>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36, lineHeight: 1.1 }}>
              How will you experience the coast?
            </h1>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              Select your mandate to personalize your listings, client management, and architectural tools.
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
                      <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>Buyer or Coastal Guest</h3>
                      <p className="muted" style={{ fontSize: 12.5, margin: "2px 0 0" }}>
                        Acquire or reserve verified direct oceanfront beach houses & collector vaults.
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="userRole"
                    checked={role === "buyer"}
                    onChange={() => setRole("buyer")}
                    aria-label="Buyer or Coastal Guest"
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
                      <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>Licensed Realtor / Broker</h3>
                      <p className="muted" style={{ fontSize: 12.5, margin: "2px 0 0" }}>
                        Unbranded presentation mode, private client roster, and 1.5%–2% co-broking lock.
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="userRole"
                    checked={role === "realtor"}
                    onChange={() => setRole("realtor")}
                    aria-label="Licensed Realtor / Broker"
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
                      <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>Estate Owner or Seller</h3>
                      <p className="muted" style={{ fontSize: 12.5, margin: "2px 0 0" }}>
                        List genuine oceanfront land & villas for crore-denominated sale or curated stays.
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="userRole"
                    checked={role === "seller"}
                    onChange={() => setRole("seller")}
                    aria-label="Estate Owner or Seller"
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
              Continue as {role === "realtor" ? "Realtor" : role === "seller" ? "Estate Owner" : "Buyer"}
            </button>
          </div>
        )}

        {step === "details" && (
          <div className="stack mt" style={{ marginTop: 24 }}>
            <span className="pill forest" style={{ alignSelf: "flex-start" }}>
              Profile & Mandate Credentials
            </span>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 32 }}>
              {role === "realtor"
                ? "Agent & Agency Registration"
                : role === "seller"
                ? "Estate Verification Details"
                : "Personalize Your Search"}
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
                <span>{role === "realtor" ? "Principal Agent Name" : "Full Name"}</span>
                <input
                  className="ctrl"
                  type="text"
                  placeholder="e.g. Vikramaditya Chandran"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Direct Contact Phone</span>
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
                    <span>Agency / Firm Name</span>
                    <input
                      className="ctrl"
                      type="text"
                      placeholder="e.g. Bayview Private Advisory"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>RERA License ID / Certificate</span>
                    <input
                      className="ctrl"
                      type="text"
                      placeholder="e.g. TN/AGENT/0491/2023"
                      value={reraNumber}
                      onChange={(e) => setReraNumber(e.target.value)}
                    />
                    <span className="help" style={{ fontSize: 11, color: "var(--muted)" }}>
                      Enables co-broking attribution and verified agent checkmark.
                    </span>
                  </label>

                  <label className="field">
                    <span>Typical Client Acquisition Range</span>
                    <select
                      className="ctrl"
                      value={budgetBracket}
                      onChange={(e) => setBudgetBracket(e.target.value)}
                    >
                      <option value="₹5 Cr – ₹15 Cr">₹5 Cr – ₹15 Cr (Boutique Dune Stretches)</option>
                      <option value="₹15 Cr – ₹35 Cr">₹15 Cr – ₹35 Cr (Supercar Vault Estates)</option>
                      <option value="₹35 Cr – ₹100+ Cr">₹35 Cr – ₹100+ Cr (Signature Bay Frontages)</option>
                    </select>
                  </label>
                </>
              )}

              {role === "buyer" && (
                <>
                  <label className="field">
                    <span>Primary Coastal Interest</span>
                    <select
                      className="ctrl"
                      value={buyerIntent}
                      onChange={(e) => setBuyerIntent(e.target.value as any)}
                    >
                      <option value="both">Both Buying & Private Stays</option>
                      <option value="buy">Direct Property Acquisition (For Sale)</option>
                      <option value="rent">Private Beachfront Stays Only</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Automotive Accommodations</span>
                    <select
                      className="ctrl"
                      value={garageNeed}
                      onChange={(e) => setGarageNeed(e.target.value)}
                    >
                      <option value="collector_vault">Subterranean Collector&apos;s Vault (&lt;7° ramp)</option>
                      <option value="marine_port">Beach & Marine Port (Boat Trailer Slipway)</option>
                      <option value="ev_pavilion">High-Output EV Pavilion (22kW+ DC)</option>
                      <option value="teak_portico">Coastal Teak Open Portico</option>
                    </select>
                  </label>
                </>
              )}

              {role === "seller" && (
                <label className="field">
                  <span>Ocean Frontage Linear Feet</span>
                  <input
                    className="ctrl"
                    type="text"
                    placeholder="e.g. 150 ft uninterrupted beach"
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
                  Back
                </button>
                <button
                  type="submit"
                  className="btn block"
                  disabled={busy}
                >
                  {busy ? "Activating Profile…" : "Complete Onboarding"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Shell>
  );
}
