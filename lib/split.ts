/**
 * Split Pay — the group funds a stay together instead of one organiser
 * fronting the whole amount.
 *
 * The rules that matter:
 *
 * 1. Shares must sum to the total **exactly**. Rupees do not always divide by
 *    headcount, so the remainder is distributed one rupee at a time rather than
 *    left to float as a rounding error the organiser silently absorbs.
 * 2. The host is paid only when the group is fully funded *and* the check-in
 *    day has arrived. Holding funds until arrival is what makes the fee
 *    collectable without the host carrying cancellation risk on a stay nobody
 *    funded.
 */

export type SplitShare = {
  id: string;
  name: string;
  /** Whole rupees. */
  amount: number;
  paid: boolean;
  paidAt?: string;
};

export type SplitProgress = {
  collected: number;
  total: number;
  outstanding: number;
  paidCount: number;
  headcount: number;
  /** 0–100, rounded, for a progress bar. */
  percent: number;
  funded: boolean;
};

export type PayoutState = {
  ready: boolean;
  reason: "ready" | "unfunded" | "too-early";
  /** Guests still to pay — only meaningful when `reason` is "unfunded". */
  outstandingCount: number;
};

/**
 * Divide `total` rupees across `count` people so the shares sum exactly.
 * The first `total % count` people pay one rupee more.
 */
export function equalShares(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

/**
 * Build the split for a booking. `organiser` is listed first so the remainder
 * lands on the person who chose the villa — they are the one holding the
 * booking, and a one-rupee difference is theirs to carry.
 */
export function buildSplit(total: number, members: string[], organiser: string): SplitShare[] {
  const roster = [organiser, ...members.filter((name) => name !== organiser)];
  const amounts = equalShares(total, roster.length);
  return roster.map((name, index) => ({
    id: `share-${index + 1}`,
    name,
    amount: amounts[index] ?? 0,
    paid: false,
  }));
}

export function splitProgress(shares: SplitShare[]): SplitProgress {
  const total = shares.reduce((sum, share) => sum + share.amount, 0);
  const collected = shares.reduce((sum, share) => (share.paid ? sum + share.amount : sum), 0);
  const paidCount = shares.filter((share) => share.paid).length;
  const outstanding = total - collected;
  return {
    collected,
    total,
    outstanding,
    paidCount,
    headcount: shares.length,
    percent: total > 0 ? Math.round((collected / total) * 100) : 0,
    funded: total > 0 && collected === total,
  };
}

/**
 * Whether the host payout may be released. Escrow releases on the check-in day,
 * not at booking time — a group that books in March and pays in full should not
 * hand the host cash for a stay that is still six weeks away.
 */
export function payoutState(shares: SplitShare[], checkIn: string, today: string): PayoutState {
  const progress = splitProgress(shares);
  if (!progress.funded) {
    return {
      ready: false,
      reason: "unfunded",
      outstandingCount: progress.headcount - progress.paidCount,
    };
  }
  if (today < checkIn) return { ready: false, reason: "too-early", outstandingCount: 0 };
  return { ready: true, reason: "ready", outstandingCount: 0 };
}

/** Mark one share paid, returning a new array. Unknown ids are ignored. */
export function markPaid(shares: SplitShare[], id: string, at: string): SplitShare[] {
  return shares.map((share) => (share.id === id ? { ...share, paid: true, paidAt: at } : share));
}

/** Rupees to paise, the unit Razorpay and every Indian gateway expects. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
