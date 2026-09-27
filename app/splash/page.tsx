"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function SplashPage() {
  const router = useRouter();
  const { markIntro } = useStore();

  return (
    <div className="app">
      <div className="splash">
        <div className="splash-bg" aria-hidden>
          <img src="/assets/prop-palm-grove.jpg" width={800} height={1000} alt="" />
        </div>
        <div className="splash-top">
          <img src="/logo-mark.png" width={72} height={72} alt="" style={{ width: 72, height: 72, borderRadius: 22 }} />
          <p className="splash-word">9bhk.app</p>
          <h1 className="splash-title">Your next escape is closer than you think.</h1>
          <p className="splash-sub">Farmhouses, pools and open fields — a short drive from the city.</p>
        </div>
        <div className="splash-foot stack">
          <div className="splash-bar" role="progressbar" aria-label="Loading 9bhk.app">
            <i />
          </div>
          <Link className="btn block lg solid" href="/login">
            Get started
          </Link>
          <button
            className="btn block ghost-light"
            type="button"
            onClick={() => {
              markIntro();
              router.push("/");
            }}
          >
            Browse as guest
          </button>
        </div>
      </div>
    </div>
  );
}
