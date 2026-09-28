"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { GoogleMark, PasswordField } from "@/components/auth-fields";
import { OtpField } from "@/components/otp-field";
import { defaultUser, useStore } from "@/lib/store";
import { signInWithGoogle } from "@/lib/supabase/browser";
import { useT } from "@/lib/i18n";

function afterAuth(): string {
  const next = new URLSearchParams(window.location.search).get("next") || "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn, markIntro, showToast } = useStore();
  const t = useT();
  const [authMode, setAuthMode] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [busy, setBusy] = useState(false);
  const [authSearch, setAuthSearch] = useState("");

  useEffect(() => {
    setAuthSearch(window.location.search);
  }, []);

  function enter(next: { name: string; email: string; phone: string; city: string }) {
    setBusy(true);
    window.setTimeout(() => {
      signIn(next);
      markIntro();
      showToast(t("toast.signedIn"));
      router.push(afterAuth());
    }, 400);
  }

  function sendOtp() {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setPhoneError(t("auth.errPhone"));
      return;
    }
    setPhoneError("");
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setOtpSent(true);
      showToast(t("auth.otpSent"));
    }, 600);
  }

  function verifyOtp() {
    if (otp.length < 6) {
      showToast(t("auth.errOtpShort"));
      return;
    }
    const cleanPhone = phone.trim();
    enter({
      name: `Guest ${cleanPhone.slice(-4)}`,
      email: `${cleanPhone.replace(/\D/g, "")}@phone.9bhk.app`,
      phone: cleanPhone,
      city: "Chennai",
    });
  }

  function withEmail(e: FormEvent) {
    e.preventDefault();
    const badEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const badPassword = password.length < 4;
    setEmailError(badEmail ? t("auth.errEmail") : "");
    setPasswordError(badPassword ? t("auth.errPassword") : "");
    if (badEmail || badPassword) return;
    const derivedName = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    enter({
      name: derivedName,
      email: email.trim().toLowerCase(),
      phone: "",
      city: "Chennai",
    });
  }

  return (
    <Shell>
      <PageBar title={t("auth.signIn")} backHref="/" />
      <div className="auth auth-compact">
        <div className="auth-hero auth-hero-compact mt">
          <img src="/assets/prop-guava-house.jpg" width={1080} height={720} alt={t("auth.heroAltLogin")} />
        </div>
        <div className="auth-body">
          <div className="stack sm">
            <p className="auth-eyebrow">{t("auth.welcome")}</p>
            <h2 className="auth-title">{t("auth.signInToApp")}</h2>
            <p className="muted">{t("auth.tagline")}</p>
          </div>
          <div className="stack mt-lg">
            <button
              className="btn block lg"
              type="button"
              disabled={busy}
              onClick={async () => {
                const started = await signInWithGoogle(afterAuth());
                if (!started) showToast(t("auth.googleDisabled"));
              }}
            >
              <GoogleMark />
              {t("auth.continueGoogle")}
            </button>
            <div className="seg" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "email"}
                onClick={() => setAuthMode("email")}
              >
                {t("auth.signInEmail")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "otp"}
                onClick={() => setAuthMode("otp")}
              >
                {t("auth.signInOtp")}
              </button>
            </div>

            {authMode === "email" ? (
              <form className="stack" noValidate onSubmit={withEmail}>
                <div className="field">
                  <label htmlFor="loginEmail">{t("auth.fieldEmail")}</label>
                  <input
                    className="ctrl"
                    id="loginEmail"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                  />
                  {emailError ? <p className="help">{emailError}</p> : null}
                </div>
                <PasswordField
                  id="loginPw"
                  label={t("auth.fieldPassword")}
                  value={password}
                  onChange={setPassword}
                  placeholder={t("auth.passwordPlaceholder")}
                  autoComplete="current-password"
                  error={passwordError}
                />
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="lnk" type="button" onClick={() => showToast(t("auth.resetSent"))}>
                    {t("auth.forgotPassword")}
                  </button>
                </div>
                <button className="btn block lg outline" type="submit" disabled={busy}>
                  {busy ? t("auth.signingIn") : t("auth.signInEmail")}
                </button>
              </form>
            ) : (
              <div className="stack">
                <div className="field">
                  <label htmlFor="loginPhone">{t("auth.fieldMobile")}</label>
                  <input
                    className="ctrl"
                    id="loginPhone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="98400 12021"
                    value={phone}
                    onChange={(ev) => setPhone(ev.target.value)}
                  />
                  {phoneError ? <p className="help">{phoneError}</p> : null}
                </div>

                {!otpSent ? (
                  <button className="btn block lg" type="button" onClick={sendOtp} disabled={busy}>
                    {busy ? t("auth.sendingCode") : t("auth.getOtp")}
                  </button>
                ) : (
                  <div className="stack" style={{ alignItems: "center", textAlign: "center" }}>
                    <p className="tiny muted">{t("auth.otpPrompt", { phone })}</p>
                    <div className="pad">
                      <OtpField value={otp} onChange={setOtp} onComplete={verifyOtp} />
                    </div>
                    <button className="btn block lg" type="button" onClick={verifyOtp} disabled={busy || otp.length < 6}>
                      {busy ? t("auth.verifying") : t("auth.verifyAndSignIn")}
                    </button>
                    <button className="lnk" type="button" onClick={sendOtp} disabled={busy}>
                      {t("auth.resendOtp")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="tiny center mt-lg">
            {t("auth.newToApp")} {" "}
            <Link className="inline-link" href={`/signup${authSearch}`}>
              {t("auth.createAccount")}
            </Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}
