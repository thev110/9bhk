"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { GoogleMark, PasswordField } from "@/components/auth-fields";
import { useStore } from "@/lib/store";
import { signInWithGoogle } from "@/lib/supabase/browser";

export default function SignupPage() {
  const router = useRouter();
  const { signIn, markIntro, showToast } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function create(nextName: string, nextEmail: string, nextPhone: string) {
    setBusy(true);
    window.setTimeout(() => {
      signIn({
        name: nextName,
        email: nextEmail,
        phone: nextPhone,
        city: "Chennai",
      });
      markIntro();
      showToast("Account created");
      router.push("/");
    }, 500);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Please add the name on the booking.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 4) next.password = "Enter your password to continue.";
    if (phone && phone.replace(/\D/g, "").length < 10) next.phone = "Used only to confirm your bookings.";
    setErrors(next);
    if (Object.keys(next).length) return;
    create(name.trim(), email.trim(), phone.trim());
  }

  return (
    <Shell>
      <PageBar title="Create account" backHref="/login" />
      <div className="auth">
        <div className="auth-hero mt">
          <img src="/assets/prop-mango-orchard.jpg" width={1080} height={720} alt="A stone cottage with a garden at a farmhouse" />
        </div>
        <div className="auth-body">
          <div className="stack sm">
            <p className="auth-eyebrow">New to 9bhk</p>
            <h2 className="auth-title">Create account</h2>
            <p className="muted">Tell us who&apos;s escaping. Optional details can wait until your profile.</p>
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
              {busy ? "Signing you in…" : "Continue with Google"}
            </button>
            <div className="or">or sign up with email</div>
            <form className="stack" noValidate onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="signupName">Full name</label>
                <input className="ctrl" id="signupName" autoComplete="name" placeholder="Your name" value={name} onChange={(ev) => setName(ev.target.value)} />
                {errors.name ? <p className="help">{errors.name}</p> : null}
              </div>
              <div className="field">
                <label htmlFor="signupEmail">Email</label>
                <input
                  className="ctrl"
                  id="signupEmail"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                />
                {errors.email ? <p className="help">{errors.email}</p> : null}
              </div>
              <div className="field">
                <label htmlFor="signupPhone">Mobile number</label>
                <input className="ctrl" id="signupPhone" inputMode="tel" autoComplete="tel" placeholder="Optional" value={phone} onChange={(ev) => setPhone(ev.target.value)} />
                <p className="help">{errors.phone || "Used only to confirm your bookings."}</p>
              </div>
              <PasswordField
                id="signupPw"
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Create a password"
                autoComplete="new-password"
                error={errors.password}
              />
              <button className="btn block lg" type="submit" disabled={busy}>
                {busy ? "Creating your account…" : "Create account"}
              </button>
            </form>
            <p className="muted">We never post anything without your permission.</p>
          </div>
          <p className="tiny center mt-lg">
            Already have an account?{" "}
            <Link className="inline-link" href="/login">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}
