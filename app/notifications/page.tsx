"use client";

import Link from "next/link";
import { PageBar, Shell } from "@/components/shell";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function NotificationsPage() {
  const { notes } = useStore();
  const t = useT();

  return (
    <Shell>
      <PageBar title={t("notifications.title")} backHref="/profile" />
      <div className="stack pad mt">
        {notes.length === 0 ? (
          <div className="empty">
            <h3>{t("notifications.empty")}</h3>
            <p>{t("notifications.emptyBody")}</p>
            <Link className="btn mt" href="/">
              {t("saved.explore")}
            </Link>
          </div>
        ) : (
          notes.map((note) => (
            <Link key={note.id || note.title} href={note.href} className="card" style={{ textDecoration: "none" }}>
              <strong>{note.title}</strong>
              <p>{note.body}</p>
              <p className="muted">{note.when}</p>
            </Link>
          ))
        )}
      </div>
    </Shell>
  );
}
