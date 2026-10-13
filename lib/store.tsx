"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast as sonnerToast } from "sonner";
import { deleteClientFromDb, loadAvailability, persistClient, persistCancellation, persistProfile,
  persistSplitShares, persistViewingRequest, persistSaved, persistRealtorProperty,
  deleteRealtorProperty, persistNotificationRead, type AvailabilityRange } from "@/lib/supabase/sync";
import { requireSupabase, signOutSupabase } from "@/lib/supabase/browser";
import { loadAccount } from "@/lib/supabase/account";
import { accountCacheKey } from "@/lib/account";
import type { Setting } from "@/lib/properties";
import type { Occupancy } from "@/lib/availability";
import { type SplitShare } from "@/lib/split";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/types";

export type BookingStatus = "confirmed" | "awaiting" | "completed" | "cancelled";

export type Booking = {
  id: string;
  code: string;
  guestId?: string;
  hostId?: string;
  orderId?: string;
  holdExpiresAt?: string;
  paymentStatus?: string;
  refundStatus?: string;
  createdAt?: string;
  cancellationDeadline?: string;
  quote?: Record<string, number>;
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
  id?: string;
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
  read?: boolean;
  readAt?: string;
};

export type ListingDraft = {
  propertyId?: string;
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
  sourcePropertyId?: string;
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
  brokerSubscriptionPaymentId?: string;
  brokerSubscribedAt?: string;
  brokerSubscriptionExpiresAt?: string;
  realtorProperties?: RealtorProperty[];
  locale: Locale;
};

const STORAGE_KEY = "9bhk-preferences-v2";

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
  reloadAccount: () => Promise<void>;
  clearAccount: () => void;
  readNotification: (id: string) => Promise<void>;
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
  toggleSaved: (id: string) => Promise<void>;
  isSaved: (id: string) => boolean;
  signIn: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  addBooking: (booking: Booking) => Promise<void>;
  setDraft: (draft: ListingDraft | null) => void;
  markIntro: () => void;
  markSessionChecked: () => void;
  confirmBooking: (id: string) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  clearBookings: () => void;
  addClient: (client: RealtorClient) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  brokerSubscribed: boolean;
  brokerSubscriptionPaymentId?: string;
  brokerSubscribedAt?: string;
  brokerSubscriptionExpiresAt?: string;
  setBrokerSubscribed: (active: boolean, paymentId?: string) => void;
  realtorProperties: RealtorProperty[];
  addRealtorProperty: (prop: RealtorProperty) => Promise<void>;
  removeRealtorProperty: (id: string) => Promise<void>;
  setLocale: (locale: Locale) => void;
  setSplit: (bookingId: string, shares: SplitShare[]) => Promise<void>;
  markSplitPaid: (bookingId: string, shareId: string) => Promise<void>;
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
const privateEmpty = { user: null, signedIn: false, saved: [], bookings: [], notes: [], clients: [], draft: null,
  realtorProperties: [], brokerSubscribed: false, brokerSubscriptionPaymentId: undefined,
  brokerSubscribedAt: undefined, brokerSubscriptionExpiresAt: undefined, presentationMode: false };

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>({ ...privateEmpty, city: "Chennai", seenIntro: true, locale: DEFAULT_LOCALE });
  const [ready, setReady] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [toast, setToast] = useState("");
  const [availability, setAvailability] = useState<AvailabilityRange[]>([]);
  const [availabilityReady, setAvailabilityReady] = useState(false);
  const [availabilityTick, setAvailabilityTick] = useState(0);
  const accountEpoch = useRef(0);
  const currentId = useRef<string | null>(null);

  useEffect(() => {
    try {
      // Legacy combined cache contains unverified identities and private records. Never restore it.
      localStorage.removeItem("9bhk-state");
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      setState(s => ({ ...s, city: typeof parsed.city === "string" ? parsed.city : s.city,
        locale: LOCALES.includes(parsed.locale) ? parsed.locale : s.locale }));
    } catch { /* Preferences are optional. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ city: state.city, locale: state.locale })); }
    catch { /* Browsing works when storage is unavailable. */ }
  }, [ready, state.city, state.locale]);

  const clearAccount = useCallback(() => {
    accountEpoch.current += 1;
    if (currentId.current) try { localStorage.removeItem(accountCacheKey(currentId.current)); } catch {}
    currentId.current = null;
    setState(s => ({ ...s, ...privateEmpty }));
  }, []);
  const reloadAccount = useCallback(async () => {
    const epoch = ++accountEpoch.current;
    let account;
    try { account = await loadAccount(); }
    catch (e) { if (epoch === accountEpoch.current) clearAccount(); throw e; }
    if (epoch !== accountEpoch.current) return;
    if (!account) { clearAccount(); return; }
    const id = account.user.id!;
    if (currentId.current && currentId.current !== id) {
      try { localStorage.removeItem(accountCacheKey(currentId.current)); } catch {}
    }
    const changedAccount = currentId.current !== id;
    currentId.current = id;
    // Backend is authoritative. Only an owner's unfinished local draft is cached, never sessions/payments.
    let draft: ListingDraft | null = null;
    if (changedAccount) try { draft = JSON.parse(localStorage.getItem(accountCacheKey(id)) || "{}").draft ?? null; } catch {}
    setState(s => ({ ...s, ...(changedAccount ? privateEmpty : {}), ...account, signedIn: true,
      city: account.user.city, locale: account.user.locale || s.locale, draft: changedAccount ? draft : s.draft }));
  }, [clearAccount]);
  const reloadAvailability = useCallback(() => setAvailabilityTick(n => n + 1), []);
  const markSessionChecked = useCallback(() => setSessionChecked(true), []);
  const markIntro = useCallback(() => setState(s => ({ ...s, seenIntro: true })), []);
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setAvailabilityReady(false);
    void loadAvailability().then(rows => { if (!cancelled) { setAvailability(rows); setAvailabilityReady(true); } })
      .catch(() => { if (!cancelled) { setAvailability([]); setAvailabilityReady(false); } });
    return () => { cancelled = true; };
  }, [ready, sessionChecked, availabilityTick]);
  useEffect(() => {
    if (!state.brokerSubscriptionExpiresAt) return;
    const remaining = Date.parse(state.brokerSubscriptionExpiresAt) - Date.now();
    if (remaining <= 0) { setState(s => ({ ...s, brokerSubscribed: false })); return; }
    const timer = window.setInterval(() => {
      if (Date.parse(state.brokerSubscriptionExpiresAt!) <= Date.now()) setState(s => ({ ...s, brokerSubscribed: false }));
    }, 60000);
    return () => clearInterval(timer);
  }, [state.brokerSubscriptionExpiresAt]);
  const showToast = useCallback((message: string) => {
    setToast(message); sonnerToast(message); window.setTimeout(() => setToast(""), 2200);
  }, []);
  const api = useMemo<Store>(() => ({
    ...state, ready, sessionChecked, availability, availabilityReady, reloadAvailability, reloadAccount,
    clearAccount, markSessionChecked, markIntro, toast, showToast,
    occupancies: availability,
    setCity: city => setState(s => ({ ...s, city })),
    setLocale: locale => {
      if (!state.user) { setState(s => ({ ...s, locale })); return; }
      void persistProfile({ ...state.user, locale }).then(() => reloadAccount()).catch(e => showToast(e.message));
    },
    toggleSaved: async id => {
      if (!state.user) { showToast("Please sign in to save properties."); return; }
      try { await persistSaved(id, !state.saved.includes(id)); await reloadAccount(); }
      catch (e) { showToast(e instanceof Error ? e.message : "Could not save property."); }
    },
    isSaved: id => state.saved.includes(id),
    signIn: async () => { await reloadAccount(); },
    signOut: async () => { await signOutSupabase(); clearAccount(); },
    updateUser: async patch => {
      if (!state.user) throw new Error("Please sign in to update your profile.");
      const requestedEmail = patch.email?.trim();
      if (requestedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedEmail)) throw new Error("Please enter a valid email address.");
      await persistProfile({ ...state.user, ...patch });
      if (requestedEmail && requestedEmail !== state.user.email) {
        const { error } = await requireSupabase().auth.updateUser({ email: requestedEmail });
        if (error) throw error;
        showToast("Check your email to confirm the email address change.");
      }
      await reloadAccount();
    },
    addBooking: async () => { throw new Error("Create a reservation through secure checkout."); },
    confirmBooking: async () => { throw new Error("Payment must be verified by the server."); },
    markSplitPaid: async () => { throw new Error("A share is paid only after gateway verification."); },
    cancelBooking: async id => {
      const booking = state.bookings.find(b => b.id === id);
      if (!booking) throw new Error("Booking not found.");
      await persistCancellation(booking); await reloadAccount(); reloadAvailability();
    },
    setSplit: async (id, shares) => {
      const booking = state.bookings.find(b => b.id === id);
      if (!booking) throw new Error("Booking not found.");
      await persistSplitShares(booking.code, shares); await reloadAccount();
    },
    setDraft: draft => {
      setState(s => ({ ...s, draft }));
      if (currentId.current) try { localStorage.setItem(accountCacheKey(currentId.current), JSON.stringify({ draft })); } catch {}
    },
    clearBookings: () => setState(s => ({ ...s, bookings: [] })),
    presentationMode: Boolean(state.presentationMode),
    setPresentationMode: active => setState(s => ({ ...s, presentationMode: active })),
    brokerSubscribed: Boolean(state.brokerSubscribed && state.brokerSubscriptionExpiresAt && Date.parse(state.brokerSubscriptionExpiresAt) > Date.now()),
    setBrokerSubscribed: () => { void reloadAccount().catch(e => showToast(e.message)); },
    realtorProperties: state.realtorProperties || [],
    addRealtorProperty: async prop => { await persistRealtorProperty(prop); await reloadAccount(); },
    removeRealtorProperty: async id => { await deleteRealtorProperty(id); await reloadAccount(); },
    addClient: async client => { await persistClient(client); await reloadAccount(); },
    removeClient: async id => { await deleteClientFromDb(id); await reloadAccount(); },
    addViewingRequest: async req => { await persistViewingRequest(req); },
    readNotification: async id => { await persistNotificationRead(id); await reloadAccount(); },
  }), [state, ready, sessionChecked, availability, availabilityReady, reloadAvailability, reloadAccount,
    clearAccount, markSessionChecked, markIntro, toast, showToast]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
export { emptyDraft };
