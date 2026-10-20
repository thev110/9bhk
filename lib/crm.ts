/** CRM matching uses declared requirements only; missing facts never count as a match. */
export type MatchRequirements = { purpose: "buy" | "rent"; budgetMin: number; budgetMax: number; city?: string; bedrooms?: number };
export type MatchProperty = { id: string; city?: string; bedrooms?: number; forSale: boolean; forRent: boolean; salePriceCr?: number; nightlyRate?: number };
export type PropertyMatch = { id: string; eligible: boolean; reasons: string[]; missing: string[] };
export function explainPropertyMatch(requirements: MatchRequirements, property: MatchProperty): PropertyMatch {
  if (!Number.isFinite(requirements.budgetMin) || !Number.isFinite(requirements.budgetMax) || requirements.budgetMin < 0 || requirements.budgetMax < requirements.budgetMin) throw new Error("Provide a valid budget range.");
  if (requirements.bedrooms !== undefined && (!Number.isInteger(requirements.bedrooms) || requirements.bedrooms < 1)) throw new Error("Provide a positive bedroom requirement.");
  const reasons: string[] = [], missing: string[] = [];
  let eligible = true;
  const offered = requirements.purpose === "buy" ? property.forSale : property.forRent;
  if (!offered) { eligible = false; reasons.push("Not offered for the requested purpose."); }
  const price = requirements.purpose === "buy" ? property.salePriceCr : property.nightlyRate;
  if (price === undefined || !Number.isFinite(price) || price <= 0) missing.push("Price unavailable.");
  else if (price < requirements.budgetMin || price > requirements.budgetMax) { eligible = false; reasons.push("Outside the declared budget."); }
  else reasons.push(requirements.purpose === "buy" ? "Asking price fits the budget in crore INR." : "Nightly rate fits the budget in INR; fees and total stay cost require a quote.");
  if (requirements.city?.trim()) {
    if (!property.city?.trim()) missing.push("City unavailable.");
    else if (property.city.trim().toLocaleLowerCase("en") !== requirements.city.trim().toLocaleLowerCase("en")) { eligible = false; reasons.push("Different city."); }
    else reasons.push("Matches the requested city.");
  }
  if (requirements.bedrooms !== undefined) {
    if (property.bedrooms === undefined || !Number.isInteger(property.bedrooms) || property.bedrooms < 1) missing.push("Bedroom count unavailable.");
    else if (property.bedrooms < requirements.bedrooms) { eligible = false; reasons.push("Too few bedrooms."); }
    else reasons.push("Meets the minimum bedroom count.");
  }
  return { id: property.id, eligible: eligible && missing.length === 0, reasons, missing };
}
export type ContactIdentity = { id: string; email?: string | null; phone?: string | null };
/** Suggestions only: never merges records or infers phone country codes. */
export function duplicateClientSuggestions(candidate: ContactIdentity, clients: ContactIdentity[]) {
  const email = candidate.email?.trim().toLowerCase();
  const phone = candidate.phone?.replace(/[\s().-]/g, "");
  return clients.filter(client => client.id !== candidate.id).flatMap(client => {
    const reasons: string[] = [];
    if (email && client.email?.trim().toLowerCase() === email) reasons.push("Same email address");
    if (phone && /^\+?\d{7,15}$/.test(phone) && client.phone?.replace(/[\s().-]/g, "") === phone) reasons.push("Same phone number");
    return reasons.length ? [{ id: client.id, reasons }] : [];
  });
}
export type FollowUpTask = { id: string; due_at: string; completed_at: string | null };
/** Caller supplies its chosen day's exclusive end, preserving local timezone boundaries. */
export function dueWorklist<T extends FollowUpTask>(tasks: T[], dayEnd: string): T[] {
  const end = Date.parse(dayEnd);
  if (!Number.isFinite(end)) throw new Error("Provide a valid day boundary.");
  return tasks.filter(task => !task.completed_at && Date.parse(task.due_at) < end).sort((a,b) => Date.parse(a.due_at)-Date.parse(b.due_at) || a.id.localeCompare(b.id));
}
