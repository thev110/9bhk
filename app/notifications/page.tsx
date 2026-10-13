"use client";

import Link from "next/link";
import { PageBar, Shell } from "@/components/shell";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function NotificationsPage() {
  const { notes, user, ready, sessionChecked, readNotification, showToast } = useStore();
  const t = useT();
  if (!ready || !sessionChecked) return <Shell><PageBar title={t("notifications.title")} backHref="/profile" /><p className="pad muted">Loading…</p></Shell>;
  if (!user) return <Shell><PageBar title={t("notifications.title")} backHref="/profile" /><div className="empty"><Link className="btn" href="/login?next=/notifications">{t("auth.signIn")}</Link></div></Shell>;

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
            <Link key={note.id || note.title} href={note.href} className="card" onClick={() => { void readNotification(note.id).catch((error) => showToast(error instanceof Error ? error.message : "Could not mark notification read.")); }} style={{ textDecoration: "none", opacity: note.read ? 0.75 : 1 }}>
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
