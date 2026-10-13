"use client";

import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { PRODUCT_AUDIENCES, type ProductAudience } from "@/lib/product-audiences";

type Props = {
  variant?: "landing" | "login";
  value?: ProductAudience;
  onChange?: (audience: ProductAudience) => void;
  destination?: string;
  onDestinationChange?: (destination: string) => void;
  disabled?: boolean;
};

/** Shared product introductions; switching products keeps the current URL. */
export function ProductEntryPoints({
  variant = "landing",
  value,
  onChange,
  destination = "/buy",
  onDestinationChange,
  disabled = false,
}: Props) {
  const t = useT();
  const { user } = useStore();
  const [localAudience, setLocalAudience] = useState<ProductAudience>("stays");
  const selected = value ?? localAudience;
  const id = useId();
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const login = variant === "login";
  const Heading = login ? "h3" : "h2";

  function select(audience: ProductAudience) {
    setLocalAudience(audience);
    onChange?.(audience);
  }

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = PRODUCT_AUDIENCES.length - 1;
    const next = event.key === "ArrowRight" ? (index + 1) % PRODUCT_AUDIENCES.length
      : event.key === "ArrowLeft" ? (index + last) % PRODUCT_AUDIENCES.length
      : event.key === "Home" ? 0 : event.key === "End" ? last : null;
    if (next === null || disabled) return;
    event.preventDefault();
    select(PRODUCT_AUDIENCES[next].id);
    tabs.current[next]?.focus();
  }

  function workspaceHref(path: string) {
    return user ? path : `/login?next=${encodeURIComponent(path)}`;
  }

  return (
    <section className={`product-entry product-entry-${variant}`} aria-labelledby={`${id}-heading`}>
      <Heading id={`${id}-heading`} className="product-entry-heading">
        {t(login ? "products.loginHeading" : "products.heading")}
      </Heading>
      <div className="product-tabs" role="tablist" aria-label={t("products.label")}>
        {PRODUCT_AUDIENCES.map((product, index) => (
          <button
            key={product.id}
            ref={(element) => { tabs.current[index] = element; }}
            type="button"
            role="tab"
            id={`${id}-tab-${product.id}`}
            aria-controls={`${id}-panel-${product.id}`}
            aria-selected={selected === product.id}
            tabIndex={selected === product.id ? 0 : -1}
            disabled={disabled}
            onClick={() => select(product.id)}
            onKeyDown={(event) => navigateTabs(event, index)}
          >
            <span className="product-tab-name">{product.name}</span>
            <span className="product-tab-audience">{t(`products.${product.id}.audience`)}</span>
          </button>
        ))}
      </div>
      {PRODUCT_AUDIENCES.map((product) => (
        <div
          key={product.id}
          role="tabpanel"
          id={`${id}-panel-${product.id}`}
          aria-labelledby={`${id}-tab-${product.id}`}
          hidden={selected !== product.id}
          tabIndex={0}
          className="product-panel"
        >
          {!login ? <h3>{t(`products.${product.id}.title`)}</h3> : null}
          <p className="product-description">{t(`products.${product.id}.description`)}</p>
          {product.id === "pro" ? <p className="product-note">{t("products.pro.note")}</p> : null}
          {!login ? (
            <div className="product-actions">
              {product.id === "stays" ? (
                <Link className="btn sm" href="/search">{t("products.stays.action")}</Link>
              ) : product.id === "pro" ? (
                <Link className="btn sm" href={workspaceHref("/realtor")}>{t("products.pro.action")}</Link>
              ) : (
                <>
                  <Link className="btn sm" href="/buy">{t("products.estates.buy")}</Link>
                  <Link className="btn sm outline" href={workspaceHref("/host/new")}>{t("products.estates.list")}</Link>
                </>
              )}
            </div>
          ) : product.id === "estates" ? (
            <div className="product-intents" role="group" aria-label={t("products.estates.intent")}>
              <button type="button" aria-pressed={!destination.startsWith("/host")} disabled={disabled} onClick={() => onDestinationChange?.("/buy")}>{t("products.estates.buy")}</button>
              <button type="button" aria-pressed={destination.startsWith("/host")} disabled={disabled} onClick={() => onDestinationChange?.("/host/new")}>{t("products.estates.list")}</button>
            </div>
          ) : null}
        </div>
      ))}
      {login ? <p className="product-login-hint">{t("products.loginHint")}</p> : null}
    </section>
  );
}
