"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { persistBooking, persistConfirmation, persistProfile } from "@/lib/supabase/sync";

export type BookingStatus = "confirmed" | "awaiting" | "completed" | "cancelled";

export type Booking = {
  id: string;
  code: string;
  propertyId: string;
  propertyName?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  total: number;
  status: BookingStatus;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  upiId?: string;
  paymentRef?: string;
};

export type User = {
  name: string;
  email: string;
  phone: string;
  city: string;
  avatarUrl?: string;
  upiId?: string;
};

export type AppNote = {
  id: string;
  title: string;
  body: string;
  href: string;
  when: string;
};

export type ListingDraft = {
  name: string;
  description: string;
  type: string;
  guests: number;
  city: string;
  area: string;
  address: string;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  photos: string[];
  price: number;
  cleaning: number;
  deposit: number;
  minStay: number;
  status: "draft" | "pending" | "published";
};

type Persisted = {
  city: string;
  saved: string[];
  user: User | null;
  bookings: Booking[];
  draft: ListingDraft | null;
  seenIntro: boolean;
  notes: AppNote[];
};

const STORAGE_KEY = "9bhk-state";

const defaultUser: User = {
  name: "Aarav Kumar",
  email: "aarav.kumar@email.com",
  phone: "98400 12021",
  city: "Chennai",
  upiId: "9bhk@okhdfcbank",
};

const seedBookings: Booking[] = [
  {
    id: "b1",
    code: "9B-40218",
    propertyId: "palm-grove",
    propertyName: "Palm Grove",
    checkIn: "2026-06-12",
    checkOut: "2026-06-14",
    adults: 2,
    children: 0,
    total: 20384,
    status: "confirmed",
    guestName: "Aarav Kumar",
    guestEmail: "aarav.kumar@email.com",
    guestPhone: "98400 12021",
    upiId: "9bhk@okhdfcbank",
    paymentRef: "UPI-40218",
  },
  {
    id: "b2",
    code: "9B-40244",
    propertyId: "verde-meadow",
    propertyName: "Verde Meadow",
    checkIn: "2026-07-03",
    checkOut: "2026-07-06",
    adults: 6,
    children: 0,
    total: 15600,
    status: "awaiting",
    guestName: "Karthik M",
    guestEmail: "karthik.m@email.com",
    guestPhone: "98840 22110",
    upiId: "9bhk@okhdfcbank",
  },
  {
    id: "b3",
    code: "9B-39810",
    propertyId: "guava-house",
    propertyName: "The Guava House",
    checkIn: "2026-02-02",
    checkOut: "2026-02-04",
    adults: 4,
    children: 0,
    total: 11900,
    status: "completed",
    guestName: "Rahul V",
    guestEmail: "rahul.v@email.com",
    guestPhone: "98410 77821",
    upiId: "9bhk@okhdfcbank",
  },
];

const emptyDraft = (): ListingDraft => ({
  name: "",
  description: "",
  type: "Private farmhouse",
  guests: 8,
  city: "ECR",
  area: "",
  address: "",
  bedrooms: 3,
  beds: 4,
  bathrooms: 2,
  amenities: [],
  photos: [],
  price: 8500,
  cleaning: 1200,
  deposit: 0,
  minStay: 2,
  status: "draft",
});

type Store = Persisted & {
  ready: boolean;
  toast: string;
  showToast: (message: string) => void;
  setCity: (city: string) => void;
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  signIn: (user: User) => void;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
  addBooking: (booking: Booking) => void;
  setDraft: (draft: ListingDraft | null) => void;
  markIntro: () => void;
  confirmBooking: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>({
    city: "Chennai",
    saved: [],
    user: defaultUser,
    bookings: seedBookings,
    draft: null,
    seenIntro: false,
    notes: [],
  });
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        const byId = Object.fromEntries(seedBookings.map((booking) => [booking.id, booking]));
        setState({
          city: parsed.city || "Chennai",
          saved: parsed.saved || [],
          user: parsed.user ?? defaultUser,
          bookings: (parsed.bookings?.length ? parsed.bookings : seedBookings).map((booking) => {
            const seed = byId[booking.id];
            return {
              ...booking,
              propertyName:
                booking.propertyName && booking.propertyName !== booking.propertyId
                  ? booking.propertyName
                  : seed?.propertyName || booking.propertyName,
              guestName: booking.guestEmail ? booking.guestName : seed?.guestName || booking.guestName,
              guestEmail: booking.guestEmail || seed?.guestEmail || "",
              guestPhone: booking.guestPhone || seed?.guestPhone || "",
              upiId: booking.upiId || seed?.upiId,
              paymentRef: booking.paymentRef || seed?.paymentRef,
            };
          }),
          draft: parsed.draft ?? null,
          seenIntro: parsed.seenIntro === true,
          notes: parsed.notes ?? [],
        });
      }
    } catch {
      /* keep seed */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  const api = useMemo<Store>(() => {
    return {
      ...state,
      ready,
      toast,
      showToast,
      setCity: (city) => setState((s) => ({ ...s, city })),
      toggleSaved: (id) =>
        setState((s) => ({
          ...s,
          saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id],
        })),
      isSaved: (id) => state.saved.includes(id),
      signIn: (user) => {
        setState((s) => ({ ...s, user }));
        void persistProfile(user);
      },
      signOut: () => setState((s) => ({ ...s, user: null })),
      updateUser: (patch) =>
        setState((s) => {
          const user = s.user ? { ...s.user, ...patch } : { ...defaultUser, ...patch };
          void persistProfile(user);
          return { ...s, user };
        }),
      addBooking: (booking) => {
        void persistBooking(booking);
        setState((s) => ({
          ...s,
          bookings: [booking, ...s.bookings],
          notes: [
            {
              id: `note-${booking.id}`,
              title: "Payment sent",
              body: `${booking.propertyName || "Your farmhouse"} is waiting for the host to confirm. You'll be notified when the stay is booked.`,
              href: "/trips",
              when: "Just now",
            },
            ...s.notes,
          ],
        }));
      },
      setDraft: (draft) => setState((s) => ({ ...s, draft })),
      markIntro: () => setState((s) => ({ ...s, seenIntro: true })),
      confirmBooking: (id) =>
        setState((s) => {
          const booking = s.bookings.find((item) => item.id === id);
          if (!booking) return s;
          void persistConfirmation(booking);
          return {
            ...s,
            bookings: s.bookings.map((item) => (item.id === id ? { ...item, status: "confirmed" } : item)),
            notes: [
              {
                id: `confirmed-${id}`,
                title: "Stay is booked",
                body: `${booking.propertyName || "Your farmhouse"} is confirmed. Check Trips for arrival details.`,
                href: "/trips",
                when: "Just now",
              },
              ...s.notes,
            ],
          };
        }),
    };
  }, [state, ready, toast, showToast]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export { emptyDraft, defaultUser };
