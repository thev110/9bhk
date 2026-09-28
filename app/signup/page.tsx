"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageBar, Shell } from "@/components/shell";
import { GoogleMark, PasswordField } from "@/components/auth-fields";
import { useStore } from "@/lib/store";
import { signInWithGoogle } from "@/lib/supabase/browser";
import { useT } from "@/lib/i18n";

function afterAuth(): string {
  const next = new URLSearchParams(window.location.search).get("next") || "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function SignupPage() {
  const router = useRouter();
  const { signIn, markIntro, showToast } = useStore();
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [authSearch, setAuthSearch] = useState("");

  useEffect(() => {
    setAuthSearch(window.location.search);
  }, []);

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
      showToast(t("toast.accountCreated"));
      router.push(afterAuth());
    }, 500);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = t("auth.errName");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t("auth.errEmail");
    if (password.length < 4) next.password = t("auth.errPassword");
    if (phone && phone.replace(/\D/g, "").length < 10) next.phone = t("auth.phoneHelp");
    setErrors(next);
    if (Object.keys(next).length) return;
    create(name.trim(), email.trim(), phone.trim());
  }

  return (
    <Shell>
      <PageBar title={t("auth.createAccount")} backHref="/login" />
      <div className="auth">
        <div className="auth-hero mt">
          <img src="/assets/prop-mango-orchard.jpg" width={1080} height={720} alt={t("auth.heroAltSignup")} />
        </div>
        <div className="auth-body">
          <div className="stack sm">
            <p className="auth-eyebrow">{t("auth.newToApp")}</p>
            <h2 className="auth-title">{t("auth.createAccount")}</h2>
            <p className="muted">{t("auth.signupTagline")}</p>
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
              {busy ? t("auth.signingIn") : t("auth.continueGoogle")}
            </button>
            <div className="or">{t("auth.orSignupEmail")}</div>
            <form className="stack" noValidate onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="signupName">{t("profile.fieldFullName")}</label>
                <input className="ctrl" id="signupName" autoComplete="name" placeholder={t("auth.namePlaceholder")} value={name} onChange={(ev) => setName(ev.target.value)} />
                {errors.name ? <p className="help">{errors.name}</p> : null}
              </div>
              <div className="field">
                <label htmlFor="signupEmail">{t("auth.fieldEmail")}</label>
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
                <label htmlFor="signupPhone">{t("auth.fieldMobile")}</label>
                <input className="ctrl" id="signupPhone" inputMode="tel" autoComplete="tel" placeholder={t("auth.phoneOptional")} value={phone} onChange={(ev) => setPhone(ev.target.value)} />
                <p className="help">{errors.phone || t("auth.phoneHelp")}</p>
              </div>
              <PasswordField
                id="signupPw"
                label={t("auth.fieldPassword")}
                value={password}
                onChange={setPassword}
                placeholder={t("auth.createPasswordPlaceholder")}
                autoComplete="new-password"
                error={errors.password}
              />
              <button className="btn block lg" type="submit" disabled={busy}>
                {busy ? t("auth.creatingAccount") : t("auth.createAccount")}
              </button>
            </form>
            <p className="muted">{t("auth.postPermission")}</p>
          </div>
          <p className="tiny center mt-lg">
            {t("auth.alreadyAccount")} {" "}
            <Link className="inline-link" href={`/login${authSearch}`}>
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}
