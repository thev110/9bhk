"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { GoogleMark, PasswordField } from "@/components/auth-fields";
import { defaultUser, useStore } from "@/lib/store";
import { signInWithGoogle } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, markIntro, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [busy, setBusy] = useState(false);

  function enter(next: { name: string; email: string; phone: string; city: string }) {
    setBusy(true);
    window.setTimeout(() => {
      signIn(next);
      markIntro();
      showToast("Signed in");
      router.push("/");
    }, 400);
  }

  function withEmail(e: FormEvent) {
    e.preventDefault();
    const badEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const badPassword = password.length < 4;
    setEmailError(badEmail ? "Enter a valid email address." : "");
    setPasswordError(badPassword ? "Enter your password to continue." : "");
    if (badEmail || badPassword) return;
    enter({ ...defaultUser, email });
  }

  return (
    <Shell>
      <PageBar title="Sign in" backHref="/splash" />
      <div className="auth">
        <div className="auth-hero mt">
          <img src="/assets/prop-guava-house.jpg" width={1080} height={720} alt="A farmhouse veranda opening onto a green garden" />
        </div>
        <div className="auth-body">
          <div className="stack sm">
            <p className="auth-eyebrow">Welcome back</p>
            <h2 className="auth-title">Welcome back</h2>
            <p className="muted">Sign in to save stays, manage trips and book farmhouses.</p>
          </div>
          <div className="stack mt-lg">
            <button
              className="btn block lg"
              type="button"
              disabled={busy}
              onClick={async () => {
                const started = await signInWithGoogle();
                if (!started) showToast("Google sign-in is not turned on yet. Add the Google client in Supabase first.");
              }}
            >
              <GoogleMark />
              Continue with Google
            </button>
            <div className="or">or sign in with email</div>
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
            <button
              className="btn block ghost"
              type="button"
              onClick={() => {
                markIntro();
                router.push("/");
              }}
            >
              Continue as guest
            </button>
          </div>
          <p className="tiny center mt-lg">
            New to 9bhk?{" "}
            <Link className="inline-link" href="/signup">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}
