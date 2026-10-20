import { authenticated, failure, TransactionError } from "@/lib/server/transactions";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user, service } = await authenticated(request);
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new TransactionError("Document unavailable.", 404);
    const action = new URL(request.url).searchParams.get("download") === "1" ? "download" : "view";
    const { data: grant, error } = await service.rpc("bhk_access_sale_document", { p_actor: user.id, p_version: id, p_action: action });
    if (error || !grant) throw new TransactionError("Document unavailable or access has expired.", 404);
    const { data: file, error: storageError } = await service.storage.from("sale-documents").download(grant.path);
    if (storageError || !file) throw new TransactionError("Document file is unavailable.", 503);
    const safeName = String(grant.fileName).replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 150) || "document";
    const type = ["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(file.type) ? file.type : "application/octet-stream";
    return new Response(file, { headers: {
      "Content-Type": type,
      "Content-Disposition": `${action === "download" ? "attachment" : "inline"}; filename="${safeName}"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'", "Referrer-Policy": "no-referrer",
    } });
  } catch (error) { return failure(error); }
}
