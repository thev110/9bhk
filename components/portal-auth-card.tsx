"use client";

import React, { useState } from "react";
import { Icon } from "./icon";
import { OtpField } from "./otp-field";
import { useStore } from "@/lib/store";
import { requireSupabase, signInWithGoogle, browserSupabase } from "@/lib/supabase/browser";
import type { SpecializedPortalId } from "./portal-shell";

function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
}

const PORTAL_AUTH_COPY: Record<
  SpecializedPortalId,
  {
    badge: string;
    heading: string;
    sub: string;
    allowRegister: boolean;
    registerLabel: string;
    googleLabel: string;
    roleHint: string;
  }
> = {
  realtor: {
    badge: "realtor.9bhk.app · RERA Broker Auth",
    heading: "Sign in or Register Your Brokerage",
    sub: "Access verified 3+ BHK sale & stay mandates, client requirement pipelines, and Realtor-to-Realtor co-broking splits (bps).",
    allowRegister: true,
    registerLabel: "New RERA Realtor",
    googleLabel: "Continue with Google Workspace",
    roleHint: "Separate Realtor Account · Requires RERA & PAN KYC before unlocking commission splits.",
  },
  owners: {
    badge: "owners.9bhk.app · Estate Owner Auth",
    heading: "Sign in or Register as Property Owner",
    sub: "List your 3+ BHK villa, farmhouse, or coastal estate for stays or sale, manage your watermarked legal vault, and review offers.",
    allowRegister: true,
    registerLabel: "Register Estate Owner",
    googleLabel: "Continue with Google",
    roleHint: "Separate Property Owner Account · Requires Title Deed / EC & PAN KYC before publishing.",
  },
  admin: {
    badge: "admin.9bhk.app · Internal Staff Gate",
    heading: "Staff Command Center Sign-In",
    sub: "Restricted to allowlisted @9bhk.app operations and compliance engineers. All sessions are verified on the server.",
    allowRegister: false,
    registerLabel: "Staff Only",
    googleLabel: "Sign in with @9bhk.app Google",
    roleHint: "Zero-trust server boundary · Public sign-up is disabled on admin.9bhk.app.",
  },
};

export function PortalAuthCard({
  portal,
  defaultNext,
  onAuthenticated,
}: {
  portal: SpecializedPortalId;
  defaultNext: string;
  onAuthenticated?: () => void;
}) {
  const copy = PORTAL_AUTH_COPY[portal];
  const { reloadAccount, showToast } = useStore();
  const configured = Boolean(browserSupabase());

  const [mode, setMode] = useState<"signin" | "register" | "otp">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [reraNumber, setReraNumber] = useState("");

  // OTP state
  const [otpPhone, setOtpPhone] = useState("");
  const [otpTarget, setOtpTarget] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleGoogle() {
    setErr(null);
    setInfo(null);
    if (!configured) {
      setErr("Authentication service is not configured.");
      return;
    }
    setBusy(true);
    try {
      await signInWithGoogle(defaultNext);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not start Google sign-in.");
      setBusy(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    if (!configured) {
      setErr("Authentication service is not configured.");
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErr("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      const sb = requireSupabase();
      if (mode === "signin" || !copy.allowRegister) {
        const { error } = await sb.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        await reloadAccount();
        showToast("Signed in to " + copy.badge.split("·")[0].trim());
        onAuthenticated?.();
      } else {
        if (!fullName.trim()) {
          throw new Error("Enter your full legal name.");
        }
        if (portal === "realtor" && !agencyName.trim()) {
          throw new Error("Enter your brokerage or agency name.");
        }
        const redirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(defaultNext)}`
            : undefined;

        const { data, error } = await sb.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: fullName.trim(),
              phone: phone.trim() || undefined,
              portal_origin: portal,
              agency_name: portal === "realtor" ? agencyName.trim() : undefined,
              rera_number: portal === "realtor" ? reraNumber.trim() : undefined,
            },
          },
        });
        if (error) throw error;

        if (data.session) {
          await reloadAccount();
          showToast("Portal account created and signed in.");
          onAuthenticated?.();
        } else {
          setInfo(
            `Verification link sent to ${cleanEmail}. Confirm your email to activate your ${portal}.9bhk.app account.`
          );
        }
      }
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    const normalized = normalizeIndianPhone(otpPhone);
    if (!normalized) {
      setErr("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await requireSupabase().auth.signInWithOtp({ phone: normalized });
      if (error) throw error;
      setOtpTarget(normalized);
      showToast(`6-digit OTP sent to ${normalized}`);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not send SMS OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpTarget) return;
    setErr(null);
    const token = otpCode.replace(/\D/g, "");
    if (token.length < 6) {
      setErr("Enter the 6-digit verification code.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await requireSupabase().auth.verifyOtp({
        phone: otpTarget,
        token,
        type: "sms",
      });
      if (error) throw error;
      await reloadAccount();
      showToast("Phone verified and signed in.");
      onAuthenticated?.();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Invalid or expired OTP.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="info-card"
      aria-label={copy.heading}
      style={{
        padding: 22,
        border: "1.5px solid var(--border-strong)",
        boxShadow: "var(--shadow-md)",
        background: "var(--surface)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span className="badge badge-Verify">{copy.badge}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Supabase Auth + KYC Gate</span>
      </div>

      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 22,
          fontWeight: 600,
          margin: "10px 0 4px",
          letterSpacing: "-.02em",
        }}
      >
        {copy.heading}
      </h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{copy.sub}</p>

      {/* Google OAuth Primary Action */}
      <button
        type="button"
        className="btn btn-outline btn-block"
        onClick={handleGoogle}
        disabled={busy}
        style={{
          justifyContent: "center",
          gap: 10,
          padding: "13px 16px",
          fontWeight: 700,
          background: "#fff",
        }}
      >
        <Icon name="google" />
        <span>{copy.googleLabel}</span>
      </button>

      {/* Mode Switcher Tabs */}
      <div className="seg" role="tablist" aria-label="Authentication method" style={{ marginTop: 14, marginBottom: 14 }}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={mode === "signin" ? "is-on" : ""}
          onClick={() => {
            setMode("signin");
            setErr(null);
            setInfo(null);
          }}
        >
          Email Sign In
        </button>
        {copy.allowRegister && (
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={mode === "register" ? "is-on" : ""}
            onClick={() => {
              setMode("register");
              setErr(null);
              setInfo(null);
            }}
          >
            {copy.registerLabel}
          </button>
        )}
        <button
          type="button"
          role="tab"
          aria-selected={mode === "otp"}
          className={mode === "otp" ? "is-on" : ""}
          onClick={() => {
            setMode("otp");
            setErr(null);
            setInfo(null);
          }}
        >
          Mobile OTP
        </button>
      </div>

      {err && (
        <div
          role="alert"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: "#fbeae5",
            color: "var(--danger)",
            fontSize: 12.5,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          {err}
        </div>
      )}

      {info && (
        <div
          role="status"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: "#e3f2e8",
            color: "var(--ok)",
            fontSize: 12.5,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          {info}
        </div>
      )}

      {mode !== "otp" ? (
        <form onSubmit={handleEmailSubmit} noValidate>
          {mode === "register" && copy.allowRegister && (
            <>
              <div className="field">
                <label className="label" htmlFor={`portal-name-${portal}`}>
                  Full Legal Name (as on PAN)
                </label>
                <input
                  id={`portal-name-${portal}`}
                  className="input"
                  type="text"
                  required
                  placeholder={portal === "realtor" ? "e.g.,Vikramaditya Sundaram" : "e.g., Ananya Rajagopalan"}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="label" htmlFor={`portal-phone-${portal}`}>
                  Mobile Number (WhatsApp / Direct)
                </label>
                <input
                  id={`portal-phone-${portal}`}
                  className="input"
                  type="tel"
                  placeholder="+91 98400 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {portal === "realtor" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="field">
                    <label className="label" htmlFor="portal-agency-realtor">
                      Brokerage / Agency Name
                    </label>
                    <input
                      id="portal-agency-realtor"
                      className="input"
                      type="text"
                      required
                      placeholder="Coromandel Luxury Estates"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="portal-rera-realtor">
                      State RERA ID (or Pending)
                    </label>
                    <input
                      id="portal-rera-realtor"
                      className="input"
                      type="text"
                      placeholder="TN/Agent/0412/2026"
                      value={reraNumber}
                      onChange={(e) => setReraNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="field">
            <label className="label" htmlFor={`portal-email-${portal}`}>
              Work or Personal Email
            </label>
            <input
              id={`portal-email-${portal}`}
              className="input"
              type="email"
              autoComplete="email"
              required
              placeholder={
                portal === "admin"
                  ? "ops@9bhk.app"
                  : portal === "realtor"
                  ? "partner@brokerage.in"
                  : "owner@estate.in"
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor={`portal-password-${portal}`}>
              Password
            </label>
            <input
              id={`portal-password-${portal}`}
              className="input"
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={busy} style={{ marginTop: 6 }}>
            {busy
              ? "Authenticating…"
              : mode === "register" && copy.allowRegister
              ? `Create ${portal === "realtor" ? "Realtor" : "Property Owner"} Account`
              : `Sign In to ${portal}.9bhk.app`}
          </button>
        </form>
      ) : !otpTarget ? (
        <form onSubmit={handleSendOtp} noValidate>
          <div className="field">
            <label className="label" htmlFor={`portal-otp-phone-${portal}`}>
              10-Digit Indian Mobile Number
            </label>
            <div className="phone-field">
              <span className="phone-prefix">+91</span>
              <input
                id={`portal-otp-phone-${portal}`}
                type="tel"
                inputMode="numeric"
                placeholder="98400 12345"
                value={otpPhone}
                onChange={(e) => setOtpPhone(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Sending SMS OTP…" : "Send 6-Digit SMS OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} noValidate>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10, textAlign: "center" }}>
            Enter the 6-digit code sent to <strong>{otpTarget}</strong>
          </div>
          <div style={{ marginBottom: 14 }}>
            <OtpField value={otpCode} onChange={setOtpCode} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Verifying OTP…" : "Verify & Enter Workspace"}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-block"
            style={{ marginTop: 8 }}
            onClick={() => {
              setOtpTarget(null);
              setOtpCode("");
            }}
          >
            Change mobile number
          </button>
        </form>
      )}

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid var(--border)",
          fontSize: 11.5,
          color: "var(--muted)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Icon name="shield" style={{ width: 15, height: 15, color: "var(--primary)", flexShrink: 0 }} />
        <span>{copy.roleHint}</span>
      </div>
    </section>
  );
}
