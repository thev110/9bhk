/**
 * Who may open the admin console.
 *
 * A literal allow-list, on purpose. This is the one authorization decision in
 * the app that must not be runtime-configurable: a mistyped or missing
 * environment variable should never be able to hand the console to whoever
 * signs up next.
 *
 * It is enforced in three independent places:
 *
 *   1. `app/admin/layout.tsx` — the server refuses to render the console, so a
 *      non-operator never receives the HTML at all.
 *   2. `app/profile/page.tsx` — the entry point is not shown to anyone else.
 *   3. `public.bhk_is_staff()` in the database — the only one that actually
 *      protects anything, because it is the only one a determined visitor
 *      cannot skip. The first two are politeness; this is the control.
 *
 * Keep this list in step with `bhk_admin_emails()` in
 * `supabase/migrations/20260929140000_admin_email_allowlist.sql`.
 */
export const ADMIN_EMAILS = ["rathnavelkarthi1@gmail.com"] as const;

/** True when `email` belongs to a console operator. Case-insensitive. */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalised = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((admin) => admin === normalised);
}
