import { browserSupabase } from "@/lib/supabase/browser";

export type PortfolioInput = { title: string; brokerDisplayName: string; agencyName?: string; introduction: string; propertyIds: string[] };
export type Portfolio = {
  id: string;
  version: number;
  title: string;
  brokerDisplayName: string;
  agencyName: string | null;
  brandingStatus: "self_reported";
  introduction: string;
  /** Public projection only; this is not a private broker inventory record. */
  properties: Record<string, unknown>[];
};
export type PortfolioShare = { id: string; portfolio_id: string; version: number; recipient_id: string; expires_at: string; revoked_at: string | null };
async function client() {
  const db = browserSupabase();
  if (!db) throw new Error("Portfolio services are unavailable.");
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to access portfolios.");
  return db;
}
export async function savePortfolio(input: PortfolioInput, id?: string): Promise<string> {
  if (input.propertyIds.length < 1 || input.propertyIds.length > 20 || new Set(input.propertyIds).size !== input.propertyIds.length) {
    throw new Error("Choose 1–20 different public listings. Private broker inventory is not supported.");
  }
  const db = await client();
  const { data, error } = await db.rpc("bhk_save_portfolio", { p_id: id ?? null, p_title: input.title, p_display_name: input.brokerDisplayName,
    p_agency: input.agencyName ?? null, p_intro: input.introduction, p_properties: input.propertyIds });
  if (error) throw error;
  return data;
}
export async function listOwnedPortfolios(): Promise<{ id: string; current_version: number; created_at: string }[]> {
  const db = await client();
  const { data, error } = await db.from("bhk_portfolios").select("id,current_version,created_at").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function readPortfolio(id: string): Promise<Portfolio> {
  const db = await client();
  const { data, error } = await db.rpc("bhk_read_portfolio", { p_portfolio: id });
  if (error) throw error;
  return data;
}
/** This persists a named-recipient grant; it does not send a message. */
export async function sharePortfolio(id: string, recipientUserId: string, expiresAt: string): Promise<string> {
  const db = await client();
  const { data, error } = await db.rpc("bhk_share_portfolio", { p_portfolio: id, p_recipient: recipientUserId, p_expires: expiresAt });
  if (error) throw error;
  return data;
}
export async function revokePortfolioShare(id: string): Promise<void> {
  const db = await client();
  const { error } = await db.rpc("bhk_revoke_portfolio_share", { p_grant: id });
  if (error) throw error;
}
export async function listPortfolioShares(id: string): Promise<PortfolioShare[]> {
  const db = await client();
  const { data, error } = await db.from("bhk_portfolio_grants").select("id,portfolio_id,version,recipient_id,expires_at,revoked_at").eq("portfolio_id", id).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
