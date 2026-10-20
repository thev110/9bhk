"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { GoogleMark, PasswordField } from "@/components/auth-fields";
import { OtpField } from "@/components/otp-field";
import { useStore } from "@/lib/store";
import { safeNextPath } from "@/lib/account";
import { requireSupabase, signInWithGoogle } from "@/lib/supabase/browser";
import { useT } from "@/lib/i18n";

function afterAuth(): string {
  const next = new URLSearchParams(window.location.search).get("next") || "/";
  return safeNextPath(next);
}

export default function LoginPage() {
  const router = useRouter();
  const { reloadAccount, showToast } = useStore();
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
  const [recovering, setRecovering] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    setAuthSearch(window.location.search);
    const params = new URLSearchParams(window.location.search);
    setRecovering(params.get("recovery") === "1");
    setAuthError(params.get("error") || "");
  }, []);

  function normalizedPhone() {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 10 ? `+91${digits}` : `+${digits}`;
  }
  async function runAuth(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setAuthError("");
    try { await task(); }
    catch (e) { setAuthError(e instanceof Error ? e.message : "Authentication failed. Please try again."); }
    finally { setBusy(false); }
  }
  async function finish() {
    await reloadAccount(); showToast(t("toast.signedIn")); router.push(afterAuth());
  }
  async function sendOtp() {
    if (phone.replace(/\D/g, "").length < 10) { setPhoneError(t("auth.errPhone")); return; }
    setPhoneError("");
    await runAuth(async () => {
      const { error } = await requireSupabase().auth.signInWithOtp({ phone: normalizedPhone() });
      if (error) throw error;
      setOtpSent(true); showToast(t("auth.otpSent"));
    });
  }
  async function verifyOtp(code = otp) {
    if (!/^\d{6}$/.test(code)) { setAuthError(t("auth.errOtpShort")); return; }
    await runAuth(async () => {
      const { error } = await requireSupabase().auth.verifyOtp({ phone: normalizedPhone(), token: code, type: "sms" });
      if (error) throw error;
      await finish();
    });
  }
  async function resetPassword() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError(t("auth.errEmail")); return; }
    await runAuth(async () => {
      const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/login?recovery=1")}`,
      });
      if (error) throw error;
      showToast(t("auth.resetSent"));
    });
  }
  async function withEmail(e: FormEvent) {
    e.preventDefault();
    const badEmail = !recovering && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const badPassword = password.length < (recovering ? 8 : 1);
    setEmailError(badEmail ? t("auth.errEmail") : "");
    setPasswordError(badPassword ? "Please enter a valid password (at least 8 characters for a new password)." : "");
    if (badEmail || badPassword) return;
    await runAuth(async () => {
      const auth = requireSupabase().auth;
      const result = recovering ? await auth.updateUser({ password }) : await auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      await finish();
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
          {authError ? <p role="alert" className="help">{authError}</p> : null}
          {recovering ? <p className="help">Enter your new password to finish account recovery.</p> : null}
          <div className="stack mt-lg">
            <button
              className="btn block lg"
              type="button"
              disabled={busy}
              onClick={async () => {
                await runAuth(async () => { await signInWithGoogle(afterAuth()); });
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
                  <button className="lnk" type="button" onClick={resetPassword}>
                    {t("auth.forgotPassword")}
                  </button>
                </div>
                <button className="btn block lg outline" type="submit" disabled={busy}>
                  {busy ? t("auth.signingIn") : recovering ? "Save new password" : t("auth.signInEmail")}
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
                      <OtpField value={otp} onChange={setOtp} onComplete={(code) => void verifyOtp(code)} />
                    </div>
                    <button className="btn block lg" type="button" onClick={() => void verifyOtp()} disabled={busy || otp.length < 6}>
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
