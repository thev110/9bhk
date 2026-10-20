import { browserSupabase } from "@/lib/supabase/browser";
import { validateDocument } from "@/lib/supabase/documents";

async function account() {
  const db = browserSupabase();
  if (!db) throw new Error("Online services are unavailable.");
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to access documents.");
  return { db, user: data.user };
}
export async function uploadSaleDocument(input: { propertyId: string; documentId?: string; label: string; file: File }) {
  const invalid = validateDocument(input.file);
  if (invalid) throw new Error(invalid === "too_large" ? "Document must be at most 15 MB." : "Choose a PDF, JPEG, PNG or WebP.");
  const { db, user } = await account();
  const path = `${user.id}/${crypto.randomUUID()}`;
  const upload = await db.storage.from("sale-documents").upload(path, input.file, { contentType: input.file.type, upsert: false });
  if (upload.error) throw new Error("Document upload failed.");
  const { data, error } = await db.rpc("bhk_add_sale_document_version", {
    p_property: input.propertyId, p_document: input.documentId ?? null, p_label: input.label,
    p_path: path, p_filename: input.file.name,
  });
  if (error) throw new Error("Document uploaded but could not be indexed. Contact support before retrying.");
  return data as string;
}
export async function grantSaleDocument(versionId: string, recipientId: string, expiresAt: string, allowDownload = false) {
  const { db } = await account();
  const { data, error } = await db.rpc("bhk_grant_sale_document", { p_version: versionId, p_recipient: recipientId, p_expiry: expiresAt, p_download: allowDownload });
  if (error) throw new Error(error.message);
  return data as string;
}
export async function revokeSaleDocumentGrant(grantId: string) {
  const { db } = await account();
  const { error } = await db.rpc("bhk_revoke_sale_document_grant", { p_grant: grantId });
  if (error) throw new Error(error.message);
}
export async function withdrawSaleDocument(versionId: string) {
  const { db } = await account();
  const { error } = await db.rpc("bhk_withdraw_sale_document", { p_version: versionId });
  if (error) throw new Error(error.message);
}
/** The returned bytes can be saved by a recipient; view-only permission cannot prevent copying. */
export async function readSaleDocument(versionId: string, download = false) {
  const { db } = await account();
  const { data } = await db.auth.getSession();
  const response = await fetch(`/api/documents/${encodeURIComponent(versionId)}${download ? "?download=1" : ""}`, {
    headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` }, cache: "no-store",
  });
  if (!response.ok) throw new Error("Document unavailable or permission expired.");
  return response.blob();
}
