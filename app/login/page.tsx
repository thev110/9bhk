"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { GoogleMark, PasswordField } from "@/components/auth-fields";
import { OtpField } from "@/components/otp-field";
import { defaultUser, useStore } from "@/lib/store";
import { signInWithGoogle } from "@/lib/supabase/browser";

function afterAuth(): string {
  const next = new URLSearchParams(window.location.search).get("next") || "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function LoginPage() {
  const router = useRouter();
  const { signIn, markIntro, showToast } = useStore();
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
      showToast("Signed in successfully");
      router.push(afterAuth());
    }, 400);
  }

  function sendOtp() {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setPhoneError("Enter a valid 10-digit mobile number.");
      return;
    }
    setPhoneError("");
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setOtpSent(true);
      showToast("OTP sent! (Use demo code: 492018)");
    }, 600);
  }

  function verifyOtp() {
    if (otp.length < 6) {
      showToast("Enter the full 6-digit OTP code.");
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
    setEmailError(badEmail ? "Enter a valid email address." : "");
    setPasswordError(badPassword ? "Enter your password to continue." : "");
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
      <PageBar title="Sign in" backHref="/" />
      <div className="auth auth-compact">
        <div className="auth-hero auth-hero-compact mt">
          <img src="/assets/prop-guava-house.jpg" width={1080} height={720} alt="A farmhouse veranda opening onto a green garden" />
        </div>
        <div className="auth-body">
          <div className="stack sm">
            <p className="auth-eyebrow">Welcome</p>
            <h2 className="auth-title">Sign in to 9bhk</h2>
            <p className="muted">Book farmhouses, view trips and save escapes.</p>
          </div>
          <div className="stack mt-lg">
            <button
              className="btn block lg"
              type="button"
              disabled={busy}
              onClick={async () => {
                const started = await signInWithGoogle(afterAuth());
                if (!started) showToast("Google sign-in is not turned on yet. Add the Google client in Supabase first.");
              }}
            >
              <GoogleMark />
              Continue with Google
            </button>
            <div className="seg" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "email"}
                onClick={() => setAuthMode("email")}
              >
                Sign in with email
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "otp"}
                onClick={() => setAuthMode("otp")}
              >
                Sign in with OTP
              </button>
            </div>

            {authMode === "email" ? (
              <form className="stack" noValidate onSubmit={withEmail}>
                <div className="field">
                  <label htmlFor="loginEmail">Email</label>
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
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Your password"
                  autoComplete="current-password"
                  error={passwordError}
                />
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button className="lnk" type="button" onClick={() => showToast("Password reset link sent to your email")}>
                    Forgot password?
                  </button>
                </div>
                <button className="btn block lg outline" type="submit" disabled={busy}>
                  {busy ? "Signing you in…" : "Sign in with email"}
                </button>
              </form>
            ) : (
              <div className="stack">
                <div className="field">
                  <label htmlFor="loginPhone">Mobile Number</label>
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
                    {busy ? "Sending code…" : "Get 6-digit OTP"}
                  </button>
                ) : (
                  <div className="stack" style={{ alignItems: "center", textAlign: "center" }}>
                    <p className="tiny muted">Enter the 6-digit verification code sent to {phone}:</p>
                    <div className="pad">
                      <OtpField value={otp} onChange={setOtp} onComplete={verifyOtp} />
                    </div>
                    <button className="btn block lg" type="button" onClick={verifyOtp} disabled={busy || otp.length < 6}>
                      {busy ? "Verifying…" : "Verify and sign in"}
                    </button>
                    <button className="lnk" type="button" onClick={sendOtp} disabled={busy}>
                      Resend OTP
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="tiny center mt-lg">
            New to 9bhk?{" "}
            <Link className="inline-link" href={`/signup${authSearch}`}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}
