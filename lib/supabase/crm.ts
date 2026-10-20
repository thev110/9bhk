import { requireSupabase } from "@/lib/supabase/browser";

export type OpportunityStage = "new" | "contacted" | "qualified" | "viewing" | "negotiating" | "won" | "lost";
export type OpportunityInput = { clientId: string; title: string; purpose: "buy" | "rent" | "sell"; timeline?: string; financing?: "unknown" | "cash" | "loan_needed" | "preapproved_self_reported" };
export async function loadCrm() {
  const db = requireSupabase();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) throw new Error("Sign in to access your CRM.");
  const [opportunities, tasks, history] = await Promise.all([
    db.from("bhk_crm_opportunities").select("*").eq("owner_id", auth.user.id).order("updated_at", { ascending: false }),
    db.from("bhk_crm_tasks").select("*").order("due_at"),
    db.from("bhk_crm_stage_history").select("*").order("created_at", { ascending: false }),
  ]);
  for (const result of [opportunities, tasks, history]) if (result.error) throw result.error;
  return { opportunities: opportunities.data ?? [], tasks: tasks.data ?? [], history: history.data ?? [] };
}
export async function createOpportunity(input: OpportunityInput): Promise<string> {
  const { data, error } = await requireSupabase().rpc("bhk_crm_create", { p_client: input.clientId, p_title: input.title, p_purpose: input.purpose, p_timeline: input.timeline ?? "", p_financing: input.financing ?? "unknown" });
  if (error) throw error;
  return data as string;
}
export async function transitionOpportunity(id: string, version: number, stage: OpportunityStage, reason: string): Promise<number> {
  const { data, error } = await requireSupabase().rpc("bhk_crm_transition", { p_id: id, p_version: version, p_stage: stage, p_reason: reason });
  if (error) throw error;
  return data as number;
}
export async function updateOpportunityDetails(id: string, version: number, details: Pick<OpportunityInput, "title" | "timeline" | "financing">): Promise<number> {
  const { data, error } = await requireSupabase().rpc("bhk_crm_update_details", { p_id: id, p_version: version, p_title: details.title, p_timeline: details.timeline ?? "", p_financing: details.financing ?? "unknown" });
  if (error) throw error;
  return data as number;
}
export async function addFollowUp(opportunityId: string, title: string, dueAt: string): Promise<string> {
  if (!Number.isFinite(Date.parse(dueAt))) throw new Error("Provide a valid due date.");
  const { data, error } = await requireSupabase().rpc("bhk_crm_add_task", { p_opportunity: opportunityId, p_title: title, p_due: new Date(dueAt).toISOString() });
  if (error) throw error;
  return data as string;
}
export async function completeFollowUp(id: string): Promise<void> {
  const { error } = await requireSupabase().rpc("bhk_crm_complete_task", { p_task: id });
  if (error) throw error;
}
