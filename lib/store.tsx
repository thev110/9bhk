"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast as sonnerToast } from "sonner";
import {
  deleteClientFromDb,
  loadAvailability,
  loadRealtorClients,
  persistBooking,
  persistClient,
  persistConfirmation,
  persistCancellation,
  persistLocale,
  persistProfile,
  persistSplitShares,
  persistViewingRequest,
  type AvailabilityRange,
} from "@/lib/supabase/sync";
import { signOutSupabase } from "@/lib/supabase/browser";
import type { Setting } from "@/lib/properties";
import type { Occupancy } from "@/lib/availability";
import { markPaid as markSharePaid, type SplitShare } from "@/lib/split";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/types";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { translate } from "@/lib/i18n/t";
import type { DictKey } from "@/lib/i18n/en";

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
  /** Set once the organiser splits the bill across the group. */
  split?: SplitShare[];
};

export type UserRole = "buyer" | "realtor" | "seller" | "guest" | "admin";

export type User = {
  name: string;
  email: string;
  phone: string;
  city: string;
  avatarUrl?: string;
  upiId?: string;
  role?: UserRole;
  agencyName?: string;
  reraNumber?: string;
  verifiedBroker?: boolean;
  commissionRate?: number;
  locale?: Locale;
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
  /** Seaside, hill station, city or countryside. Drives the whole listing. */
  setting: Setting;
  settingDetail: string;
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
  isForSale?: boolean;
  salePrice?: number;
  /** Seaside listings only. */
  beachFrontage?: string;
  /** Optional — a listing with no garage leaves this undefined. */
  garageType?: string;
  garageCapacity?: number;
  landArea?: string;
  // ── Celebration capacity. Optional and all-or-nothing: a house that cannot
  // host a function leaves every field undefined rather than half-filled.
  hostsCelebrations?: boolean;
  maxEventGuests?: number;
  powerLoadKw?: number;
  soundCurfewHour?: number;
  parkingCars?: number;
  generatorKw?: number;
  catererKitchen?: boolean;
};

export type RealtorClient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  budgetMinCr: number;
  budgetMaxCr: number;
  preferredStretch: string;
  garageNeed: string;
  confidential: boolean;
  notes?: string;
  createdAt: string;
};

export type RealtorProperty = {
  id: string;
  name: string;
  location: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  forRent: boolean;
  forSale: boolean;
  nightlyRate?: number;
  salePriceCr?: number;
  pool: boolean;
  notes?: string;
  createdAt: string;
};

/**
 * 9bhk 3-BHK Platform Showcase Rule:
 * Only properties with a minimum of 3 BHK can be publicly showcased in the 9bhk app
 * for renting and sales. Properties with fewer than 3 BHK can still be managed in the
 * broker's private catalog and shared via direct private link, but are never displayed
 * in the public marketplace.
 */
export function isShowcaseEligible(property: { bedrooms: number }): boolean {
  return property.bedrooms >= 3;
}

type Persisted = {
  city: string;
  saved: string[];
  user: User | null;
  bookings: Booking[];
  draft: ListingDraft | null;
  seenIntro: boolean;
  signedIn: boolean;
  notes: AppNote[];
  clients: RealtorClient[];
  presentationMode?: boolean;
  brokerSubscribed?: boolean;
  realtorProperties?: RealtorProperty[];
  locale: Locale;
};

const STORAGE_KEY = "9bhk-state";

export const defaultUser: User = {
  name: "Guest Explorer",
  email: "guest@9bhk.app",
  phone: "",
  city: "Chennai",
  role: "buyer",
};

const emptyDraft = (): ListingDraft => ({
  name: "",
  description: "",
  type: "Villa",
  guests: 8,
  city: "Chennai",
  area: "",
  address: "",
  setting: "countryside",
  settingDetail: "",
  bedrooms: 3,
  beds: 4,
  bathrooms: 3,
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
  /** Live stays read back from the database, independent of this device. */
  availability: AvailabilityRange[];
  availabilityReady: boolean;
  reloadAvailability: () => void;
  /**
   * Database availability and local bookings merged, which is the only thing a
   * calendar should render. DB rows come first so a stay booked on another
   * device still holds its nights even if it is absent from local storage.
   */
  occupancies: Occupancy[];
  toast: string;
  presentationMode: boolean;
  setPresentationMode: (active: boolean) => void;
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
  cancelBooking: (id: string) => void;
  clearBookings: () => void;
  addClient: (client: RealtorClient) => void;
  removeClient: (id: string) => void;
  brokerSubscribed: boolean;
  setBrokerSubscribed: (active: boolean) => void;
  realtorProperties: RealtorProperty[];
  addRealtorProperty: (prop: RealtorProperty) => void;
  removeRealtorProperty: (id: string) => void;
  setLocale: (locale: Locale) => void;
  setSplit: (bookingId: string, shares: SplitShare[]) => void;
  markSplitPaid: (bookingId: string, shareId: string) => void;
  addViewingRequest: (req: {
    propertyId: string;
    propertyName: string;
    buyerName: string;
    buyerPhone: string;
    buyerEmail?: string;
    notes?: string;
  }) => Promise<void>;
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
    clients: [
      {
        id: "c-101",
        name: "Vikramaditya K (Family Office)",
        phone: "+91 98401 22334",
        email: "vk@chennaicapital.com",
        budgetMinCr: 20,
        budgetMaxCr: 40,
        preferredStretch: "ECR · Mahabalipuram Dunes",
        garageNeed: "Collector Vault (4+ cars, low approach ramp)",
        confidential: true,
        notes: "Looking for direct high-tide frontage with private beach gate for Ferrari 296 GTB & Defender.",
        createdAt: "2026-09-27",
      },
    ],
    presentationMode: false,
    brokerSubscribed: true,
    realtorProperties: [
      {
        id: "rp-1",
        name: "Coromandel Coastal Pavilion",
        location: "East Coast Road (ECR), Chennai",
        city: "Chennai",
        bedrooms: 4,
        bathrooms: 4,
        guests: 12,
        forRent: true,
        forSale: true,
        nightlyRate: 35000,
        salePriceCr: 14.5,
        pool: true,
        notes: "Direct high-tide frontage, 30 kW power load, verified generator.",
        createdAt: "2026-09-28",
      },
      {
        id: "rp-2",
        name: "Mahabalipuram Sand Dune Villa",
        location: "Mahabalipuram Coastal Strip",
        city: "Mahabalipuram",
        bedrooms: 3,
        bathrooms: 3,
        guests: 10,
        forRent: true,
        forSale: false,
        nightlyRate: 28000,
        pool: true,
        notes: "Private pool, sound curfew 23:00, great for family reunions.",
        createdAt: "2026-10-01",
      },
      {
        id: "rp-3",
        name: "Poes Garden Luxury Executive Suite",
        location: "Central Chennai",
        city: "Chennai",
        bedrooms: 2,
        bathrooms: 2,
        guests: 4,
        forRent: true,
        forSale: false,
        nightlyRate: 16000,
        pool: false,
        notes: "2 BHK executive city property. Private link only (not showcased on 9bhk app).",
        createdAt: "2026-10-03",
      },
    ],
    locale: DEFAULT_LOCALE,
  });
  const [ready, setReady] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [toast, setToast] = useState("");
  const [availability, setAvailability] = useState<AvailabilityRange[]>([]);
  const [availabilityReady, setAvailabilityReady] = useState(false);
  const [availabilityTick, setAvailabilityTick] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        // Purge legacy mock seed bookings and unconfirmed local test reservations so they don't lock out the calendar
        const realBookings = (parsed.bookings || []).filter(
          (b) =>
            b.id !== "b1" &&
            b.id !== "b2" &&
            b.id !== "b3" &&
            b.guestName !== "Aarav Kumar" &&
            !b.guestEmail?.includes("aarav") &&
            b.guestEmail !== "priya.s@example.com" &&
            !(b.status === "awaiting" && (b.guestEmail === "guest@9bhk.app" || !b.paymentRef))
        );
        setState((curr) => ({
          city: parsed.city || "Chennai",
          saved: parsed.saved || [],
          user: parsed.signedIn ? parsed.user ?? null : null,
          bookings: realBookings,
          draft: parsed.draft ?? null,
          seenIntro: true,
          signedIn: parsed.signedIn === true,
          notes: parsed.notes ?? [],
          clients: parsed.clients && parsed.clients.length ? parsed.clients : curr.clients,
          presentationMode: parsed.presentationMode ?? false,
          brokerSubscribed: parsed.brokerSubscribed ?? curr.brokerSubscribed ?? true,
          realtorProperties:
            parsed.realtorProperties && parsed.realtorProperties.length
              ? parsed.realtorProperties
              : curr.realtorProperties,
          locale: LOCALES.includes(parsed.locale) ? (parsed.locale as Locale) : DEFAULT_LOCALE,
        }));
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

  // The calendar has to reflect real bookings, not just the ones this device
  // made. Local storage alone cannot know a weekend someone else took, so read
  // live occupancy from the database once local state is up, and re-read it
  // when the session settles — a host sees different rows signed in than out.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void loadAvailability().then((rows) => {
      if (cancelled) return;
      setAvailability(rows);
      setAvailabilityReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, sessionChecked, state.signedIn, availabilityTick]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    sonnerToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  const api = useMemo<Store>(() => {
    // Notes are generated in the store rather than a component, so translate
    // against the active catalog directly instead of going through useT().
    const tr = (key: DictKey, vars?: Record<string, string | number>) =>
      translate(dictionaries[state.locale] ?? dictionaries[DEFAULT_LOCALE], key, vars);

    return {
      ...state,
      ready,
      sessionChecked,
      availability,
      availabilityReady,
      reloadAvailability: () => setAvailabilityTick((n) => n + 1),
      occupancies: [
        ...availability,
        ...state.bookings
          .filter((booking) => booking.status === "confirmed")
          .map((booking) => ({
            propertyId: booking.propertyId,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            status: booking.status,
          })),
      ],
      markSessionChecked: () => setSessionChecked(true),
      toast,
      showToast,
      setCity: (city) => setState((s) => ({ ...s, city })),
      setLocale: (locale) => {
        setState((s) => ({
          ...s,
          locale,
          // Mirror onto the signed-in user so persistProfile carries it forward
          user: s.user ? { ...s.user, locale } : s.user,
        }));
        if (typeof window !== "undefined") void persistLocale(locale);
      },
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
              title: tr("note.paymentSentTitle"),
              body: tr("note.paymentSentBody", {
                property: booking.propertyName || tr("note.yourFarmhouse"),
              }),
              href: "/trips",
              when: tr("note.justNow"),
            },
            ...s.notes,
          ],
        }));
      },
      setSplit: (bookingId, shares) => {
        // Persist before the local update so each share exists as a real row an
        // invited guest's payment can settle against.
        const booking = state.bookings.find((item) => item.id === bookingId);
        if (booking) void persistSplitShares(booking.code, shares);
        setState((s) => ({
          ...s,
          bookings: s.bookings.map((item) =>
            item.id === bookingId ? { ...item, split: shares } : item,
          ),
        }));
      },
      markSplitPaid: (bookingId, shareId) => {
        const booking = state.bookings.find((item) => item.id === bookingId);
        if (!booking?.split) return;
        const next = markSharePaid(booking.split, shareId, new Date().toISOString().slice(0, 10));
        void persistSplitShares(booking.code, next);
        setState((s) => ({
          ...s,
          bookings: s.bookings.map((item) =>
            item.id === bookingId ? { ...item, split: next } : item,
          ),
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
                title: tr("note.stayBookedTitle"),
                body: tr("note.stayBookedBody", {
                  property: booking.propertyName || tr("note.yourFarmhouse"),
                }),
                href: "/trips",
                when: tr("note.justNow"),
              },
              ...s.notes,
            ],
          };
        }),
      cancelBooking: (id) =>
        setState((s) => {
          const booking = s.bookings.find((item) => item.id === id);
          if (!booking) return s;
          void persistCancellation(booking);
          return {
            ...s,
            bookings: s.bookings.map((item) => (item.id === id ? { ...item, status: "cancelled" } : item)),
          };
        }),
      clearBookings: () => setState((s) => ({ ...s, bookings: [] })),
      presentationMode: Boolean(state.presentationMode),
      setPresentationMode: (active) => setState((s) => ({ ...s, presentationMode: active })),
      brokerSubscribed: Boolean(state.brokerSubscribed),
      setBrokerSubscribed: (active) => setState((s) => ({ ...s, brokerSubscribed: active })),
      realtorProperties: state.realtorProperties || [],
      addRealtorProperty: (prop) =>
        setState((s) => ({
          ...s,
          realtorProperties: [prop, ...(s.realtorProperties || [])],
        })),
      removeRealtorProperty: (id) =>
        setState((s) => ({
          ...s,
          realtorProperties: (s.realtorProperties || []).filter((p) => p.id !== id),
        })),
      addClient: (client) => {
        void persistClient(client);
        setState((s) => ({
          ...s,
          clients: [client, ...s.clients],
        }));
      },
      removeClient: (id) => {
        void deleteClientFromDb(id);
        setState((s) => ({
          ...s,
          clients: s.clients.filter((c) => c.id !== id),
        }));
      },
      addViewingRequest: async (req) => {
        await persistViewingRequest(req);
      },
    };
  }, [state, ready, sessionChecked, toast, showToast, availability, availabilityReady]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export { emptyDraft };
