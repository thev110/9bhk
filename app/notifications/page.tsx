"use client";

import Link from "next/link";
import { PageBar, Shell } from "@/components/shell";
import { useStore } from "@/lib/store";

export default function NotificationsPage() {
  const { notes } = useStore();

  return (
    <Shell>
      <PageBar title="Notifications" backHref="/profile" />
      <div className="stack pad mt">
        {notes.length === 0 ? (
          <div className="empty">
            <h3>You&apos;re all caught up.</h3>
            <p>Booking confirmations, gate codes, host messages and check-in details will appear here as you book stays.</p>
            <Link className="btn mt" href="/">
              Explore farmhouses
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
