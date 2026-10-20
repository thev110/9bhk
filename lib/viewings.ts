/** Only buyer-supplied fields belong here; identity and property names come from the server. */
export function viewingInput(body: Record<string, unknown>) {
  function text(key: string, max: number, required = false) {
    const raw = body[key];
    if (raw !== undefined && typeof raw !== "string") throw new Error(`Invalid ${key}.`);
    const value = typeof raw === "string" ? raw.trim() : "";
    if ((required && !value) || value.length > max) throw new Error(`Invalid ${key}.`);
    return value;
  }
  const propertyId = text("propertyId", 200, true);
  const buyerName = text("buyerName", 120, true);
  const buyerPhone = text("buyerPhone", 30, true);
  const buyerEmail = text("buyerEmail", 254);
  const notes = text("notes", 4000) || text("automotiveMandate", 4000);
  if (!/^\+?[\d ()-]{7,30}$/.test(buyerPhone) || buyerPhone.replace(/\D/g, "").length < 7) {
    throw new Error("Enter a valid contact phone number.");
  }
  if (buyerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) throw new Error("Enter a valid email address.");
  return { propertyId, buyerName, buyerPhone, buyerEmail: buyerEmail || null, notes: notes || null };
}
