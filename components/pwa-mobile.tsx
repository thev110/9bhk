"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaMobileHandler() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Strictly hide when navigating to any page other than "/"
    if (pathname !== "/") {
      setShowPrompt(false);
      return;
    }

    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as unknown as { standalone?: boolean }).standalone);

    if (isStandalone) return;

    // Detect mobile
    const userAgent = navigator.userAgent || "";
    const isIosDevice = /iPhone|iPad|iPod/i.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIos(isIosDevice);

    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed) return;

    // Handle Chrome / Android PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem("pwa-prompt-dismissed") && window.location.pathname === "/") {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // For iOS users on home page, prompt gently once after 6 seconds if never dismissed
    if (isIosDevice && !dismissed) {
      const timer = setTimeout(() => {
        if (window.location.pathname === "/" && !localStorage.getItem("pwa-prompt-dismissed")) {
          setShowPrompt(true);
        }
      }, 6000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [pathname]);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowPrompt(false);
        localStorage.setItem("pwa-prompt-dismissed", "true");
      }
      setDeferredPrompt(null);
    }
  }

  function dismiss() {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  }

  // Never render outside of the explore home page
  if (!showPrompt || pathname !== "/") return null;

  return (
    <div className="pwa-banner" role="dialog" aria-label="Install app">
      <div className="pwa-banner-card">
        <button
          className="pwa-close-btn"
          type="button"
          onClick={dismiss}
          aria-label="Dismiss app install banner"
        >
          <Icon name="close" />
        </button>

        <div className="pwa-banner-main">
          <img
            src="/logo-mark.png"
            alt="9bhk.app"
            width={44}
            height={44}
            className="pwa-app-icon"
          />
          <div className="pwa-banner-text">
            <strong>Install 9bhk app</strong>
            <p>
              {isIos
                ? "Tap Share > 'Add to Home Screen' for the full app experience."
                : "Add to home screen for fast bookings and full-screen stays."}
            </p>
          </div>
        </div>

        <div className="pwa-banner-actions">
          {deferredPrompt ? (
            <button className="btn sm block" type="button" onClick={handleInstall}>
              <Icon name="download" />
              Install app
            </button>
          ) : isIos ? (
            <div className="pwa-ios-instructions">
              <span>
                <Icon name="share" /> Tap <strong>Share</strong> &gt; <strong>Add to Home Screen</strong>
              </span>
            </div>
          ) : (
            <button className="btn sm block" type="button" onClick={dismiss}>
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
