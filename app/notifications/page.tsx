"use client";

import Link from "next/link";
import { PageBar, Shell } from "@/components/shell";
import { useStore } from "@/lib/store";

const NOTES = [
  { title: "Booking confirmed", body: "Palm Grove Private Farmhouse · 12–14 Jun · Tap to view your trip.", when: "2 hours ago", href: "/trips" },
  { title: "New message from host", body: "“Gate code is 4412 — see you after 2 PM.”", when: "5 hours ago", href: "/trips" },
  { title: "Price drop on a saved stay", body: "Verde Meadow Farmhouse is ₹700 cheaper for your saved dates.", when: "Yesterday", href: "/property/verde-meadow" },
  { title: "How was The Guava House?", body: "Share a review to help other guests plan their escape.", when: "3 days ago", href: "/property/guava-house" },
];

export default function NotificationsPage() {
  const { notes } = useStore();
  const items = [...notes, ...NOTES];
  return (
    <Shell>
      <PageBar title="Notifications" backHref="/profile" />
      <div className="stack pad mt">
        {items.map((note) => (
          <Link key={note.title} href={note.href} className="card" style={{ textDecoration: "none" }}>
            <strong>{note.title}</strong>
            <p>{note.body}</p>
            <p className="muted">{note.when}</p>
          </Link>
        ))}
        <div className="empty">
          <h3>You&apos;re all caught up.</h3>
          <p>Booking updates, host messages and trip reminders will appear here.</p>
          <Link className="btn" href="/">
            Back to explore
          </Link>
        </div>
      </div>
    </Shell>
  );
}
