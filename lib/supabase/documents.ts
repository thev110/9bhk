import { browserSupabase } from "@/lib/supabase/browser";

/**
 * Verification documents: what a host uploads, and what staff read back.
 *
 * Files live in the **private** `verification-docs` bucket, so a document is
 * never reachable by guessing a URL — the only way to open one is a signed URL
 * minted for a session the storage policy admits. That is the whole point: an
 * ownership proof is not a listing photo.
 */

export const DOCUMENT_KINDS = ["ownership_proof", "tax_receipt", "host_id"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export type DocumentStatus = "pending" | "verified" | "rejected";

export type PropertyDocument = {
  id: string;
  propertyId: string;
  kind: DocumentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Bucket-relative path; the file is only reachable via a signed URL. */
  path: string;
  status: DocumentStatus;
  note?: string;
  createdAt: string;
};

/** Matches the bucket's own 15 MB limit, so the client refuses early. */
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

/** Matches the bucket's `allowed_mime_types`, so storage never rejects late. */
export const ACCEPTED_DOCUMENT_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const DOCUMENT_ACCEPT_ATTR = ACCEPTED_DOCUMENT_MIME.join(",");

export type DocumentValidation = "too_large" | "bad_type" | null;

/**
 * Why a file cannot be submitted, or null when it is fine.
 *
 * Returns a reason rather than a message so the caller picks its own language.
 */
export function validateDocument(file: File): DocumentValidation {
  if (file.size > MAX_DOCUMENT_BYTES) return "too_large";
  if (!ACCEPTED_DOCUMENT_MIME.includes(file.type as (typeof ACCEPTED_DOCUMENT_MIME)[number])) {
    return "bad_type";
  }
  return null;
}

type DocumentRow = {
  id: string;
  property_id: string;
  kind: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  note: string | null;
  created_at: string;
};

function fromRow(row: DocumentRow): PropertyDocument {
  return {
    id: row.id,
    propertyId: row.property_id,
    kind: row.kind as DocumentKind,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    path: row.storage_path,
    status: row.status as DocumentStatus,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}

const DOCUMENT_COLUMNS =
  "id, property_id, kind, storage_path, file_name, mime_type, size_bytes, status, note, created_at";

/**
 * Upload one document and index it against the listing.
 *
 * The path is `<uid>/<propertyId>-<kind>-<uuid>.<ext>`: the first segment has
 * to be the uploader's id because the bucket's insert policy requires it, and
 * the rest keeps a reviewer's file list readable if anyone ever browses the
 * bucket directly.
 *
 * Re-uploading the same kind replaces the row (the table is unique on
 * `(property_id, kind)`), so a reviewer always sees the current document in
 * each slot rather than a growing pile of superseded ones.
 */
export async function uploadPropertyDocument(input: {
  propertyId: string;
  kind: DocumentKind;
  file: File;
}): Promise<PropertyDocument> {
  const supabase = browserSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  const validation = validateDocument(input.file);
  if (validation) throw new Error(validation);

  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sign in with Google before uploading documents");

  const extension = input.file.name.includes(".")
    ? input.file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "bin"
    : "bin";
  const path = `${data.user.id}/${input.propertyId}-${input.kind}-${crypto.randomUUID()}.${extension}`;

  const upload = await supabase.storage.from("verification-docs").upload(path, input.file, {
    contentType: input.file.type,
    upsert: false,
  });
  if (upload.error) throw upload.error;

  const { data: row, error } = await supabase
    .from("bhk_property_documents")
    .upsert(
      {
        property_id: input.propertyId,
        host_id: data.user.id,
        kind: input.kind,
        storage_path: path,
        file_name: input.file.name,
        mime_type: input.file.type,
        size_bytes: input.file.size,
        // A replaced document goes back to the start of the review line; the
        // previous verdict was about a different file.
        status: "pending",
        note: null,
        reviewed_by: null,
        reviewed_at: null,
      },
      { onConflict: "property_id,kind" },
    )
    .select(DOCUMENT_COLUMNS)
    .single();

  if (error) throw error;
  return fromRow(row as unknown as DocumentRow);
}

/** Documents already submitted for one listing. */
export async function listPropertyDocuments(propertyId: string): Promise<PropertyDocument[]> {
  const supabase = browserSupabase();
  if (!supabase || !propertyId) return [];
  const { data, error } = await supabase
    .from("bhk_property_documents")
    .select(DOCUMENT_COLUMNS)
    .eq("property_id", propertyId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as unknown as DocumentRow[]).map(fromRow);
}

/**
 * Documents for several listings at once, for the review queue.
 *
 * One round trip rather than one per card: a queue of twenty submissions would
 * otherwise fire twenty requests before it could render.
 */
export async function listDocumentsForProperties(
  propertyIds: string[],
): Promise<PropertyDocument[]> {
  const supabase = browserSupabase();
  if (!supabase || propertyIds.length === 0) return [];
  const { data, error } = await supabase
    .from("bhk_property_documents")
    .select(DOCUMENT_COLUMNS)
    .in("property_id", propertyIds)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as unknown as DocumentRow[]).map(fromRow);
}

/**
 * A short-lived link to the file itself.
 *
 * The bucket is private, so there is no permanent URL to hand out. Five
 * minutes is enough to open or download a document and short enough that a
 * link pasted into a chat is dead before it travels.
 */
export async function documentUrl(path: string, expiresInSeconds = 300): Promise<string | null> {
  const supabase = browserSupabase();
  if (!supabase || !path) return null;
  const { data, error } = await supabase.storage
    .from("verification-docs")
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Open a document in a new tab.
 *
 * Returns false when no link could be minted — which is what a signed-out
 * visitor, or a host reaching for someone else's paperwork, will get.
 */
export async function openDocument(path: string): Promise<boolean> {
  const url = await documentUrl(path);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

/**
 * Download a document to disk.
 *
 * Fetches the signed URL through the client rather than pointing a link at it,
 * so the server's own `Content-Disposition` (and the original file name) is
 * what survives — a `<a download>` on a cross-origin Supabase URL is ignored by
 * browsers.
 */
export async function downloadDocument(doc: Pick<PropertyDocument, "path" | "fileName">): Promise<boolean> {
  const url = await documentUrl(doc.path);
  if (!url) return false;
  const response = await fetch(url);
  if (!response.ok) return false;
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = doc.fileName || "document";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
  return true;
}

/** A staff verdict on one document. */
export async function reviewDocument(input: {
  id: string;
  status: Exclude<DocumentStatus, "pending">;
  note?: string;
}): Promise<boolean> {
  const supabase = browserSupabase();
  if (!supabase) return false;
  const { data } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("bhk_property_documents")
    .update({
      status: input.status,
      note: input.note?.trim() || null,
      reviewed_by: data.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  return !error;
}
