"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/shell";
import { defaultUser, useStore } from "@/lib/store";

const SLIDES = [
  {
    title: "Your next escape is closer than you think.",
    body: "Farmhouses, pools and open fields — a short drive from the city.",
    cta: "Get started",
  },
  {
    title: "Find beautiful farmhouses for slow weekends.",
    body: "Search by place, dates and the things that matter — a pool, a bonfire, space for the whole group.",
    cta: "Explore farmhouses",
  },
  {
    title: "Have a farmhouse? Turn empty dates into bookings.",
    body: "List it in a few guided steps, set your own price, and manage stays from one place.",
    cta: "List your farmhouse",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { signIn } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  function finish(asGuest: boolean) {
    if (!asGuest) {
      setBusy(true);
      window.setTimeout(() => {
        signIn({ ...defaultUser, name: name.trim() || defaultUser.name, phone: phone || defaultUser.phone });
        router.push("/");
      }, 500);
      return;
    }
    router.push("/");
  }

  if (step >= SLIDES.length) {
    return (
      <Shell>
        <div className="pad mt stack" style={{ paddingTop: 48 }}>
          <p className="muted">Welcome back</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 36 }}>Sign in to save stays, manage trips and book farmhouses.</h1>
          <button className="btn block" type="button" disabled={busy} onClick={() => finish(false)}>
            {busy ? "Signing you in…" : "Continue with Google"}
          </button>
          <button className="btn outline block" type="button" onClick={() => finish(true)}>
            Continue as guest
          </button>
          <p className="muted">We never post anything without your permission.</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 28 }}>Almost done</h2>
          <p className="muted">Tell us who&apos;s escaping. Optional — you can add this later in your profile.</p>
          <label className="field">
            Full name
            <input className="ctrl" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            Mobile number
            <input className="ctrl" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <span className="help">Used only to confirm your bookings.</span>
          </label>
          <button className="btn block" type="button" onClick={() => finish(false)}>
            Finish
          </button>
        </div>
      </Shell>
    );
  }

  const slide = SLIDES[step];
  return (
    <Shell>
      <div className="pad stack" style={{ minHeight: "100vh", paddingTop: 72, justifyContent: "flex-end", paddingBottom: 32 }}>
        <p className="brand-name">9bhk.app</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 40, lineHeight: 1.05 }}>{slide.title}</h1>
        <p className="muted">{slide.body}</p>
        <div className="steps" aria-hidden>
          {SLIDES.map((_, i) => (
            <span key={i} className={`st${i <= step ? " is-done" : ""}`} />
          ))}
        </div>
        <button
          className="btn block"
          type="button"
          onClick={() => {
            if (step === 1) router.push("/");
            else if (step === 2) router.push("/host/new");
            else setStep(step + 1);
          }}
        >
          {slide.cta}
        </button>
        <div className="between">
          <button className="btn ghost" type="button" onClick={() => router.push("/")}>
            Skip for now
          </button>
          {step > 0 ? (
            <button className="btn ghost" type="button" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : (
            <button className="btn ghost" type="button" onClick={() => setStep(SLIDES.length)}>
              Next
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}
