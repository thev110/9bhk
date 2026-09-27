"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast as sonnerToast } from "sonner";
import { persistBooking, persistConfirmation, persistProfile } from "@/lib/supabase/sync";
import { signOutSupabase } from "@/lib/supabase/browser";

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
  signedIn: boolean;
  notes: AppNote[];
};

const STORAGE_KEY = "9bhk-state";

export const defaultUser: User = {
  name: "Guest Explorer",
  email: "guest@9bhk.app",
  phone: "",
  city: "Chennai",
};

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
  sessionChecked: boolean;
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
  markSessionChecked: () => void;
  confirmBooking: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>({
    city: "Chennai",
    saved: [],
    user: null,
    bookings: [],
    draft: null,
    seenIntro: true,
    signedIn: false,
    notes: [],
  });
  const [ready, setReady] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        // Purge legacy mock seed bookings so logged-in users never see Aarav Kumar's fake data
        const realBookings = (parsed.bookings || []).filter(
          (b) => b.id !== "b1" && b.id !== "b2" && b.id !== "b3" && b.guestName !== "Aarav Kumar" && !b.guestEmail?.includes("aarav")
        );
        setState({
          city: parsed.city || "Chennai",
          saved: parsed.saved || [],
          user: parsed.signedIn ? parsed.user ?? null : null,
          bookings: realBookings,
          draft: parsed.draft ?? null,
          seenIntro: true,
          signedIn: parsed.signedIn === true,
          notes: parsed.notes ?? [],
        });
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    sonnerToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  const api = useMemo<Store>(() => {
    return {
      ...state,
      ready,
      sessionChecked,
      markSessionChecked: () => setSessionChecked(true),
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
        setState((s) => ({ ...s, user, signedIn: true }));
        void persistProfile(user);
      },
      signOut: () => {
        void signOutSupabase();
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.user = null;
            parsed.signedIn = false;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
        } catch {
          /* ignore */
        }
        setState((s) => ({ ...s, user: null, signedIn: false }));
      },
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
  }, [state, ready, sessionChecked, toast, showToast]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export { emptyDraft };
