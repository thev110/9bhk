import { requireSupabase } from "@/lib/supabase/browser";
export async function loadBrokerTeamWorkspace(){
 const db=requireSupabase();
 const [teams,members,assignments,handovers,events,opportunities,tasks,history]=await Promise.all([
  db.from("bhk_broker_teams").select("*"),db.from("bhk_broker_team_members").select("*"),db.from("bhk_crm_assignments").select("*"),db.from("bhk_crm_handovers").select("*").order("created_at",{ascending:false}),db.from("bhk_crm_assignment_events").select("*").order("created_at",{ascending:false}),
  db.from("bhk_crm_opportunities").select("*").order("updated_at",{ascending:false}),db.from("bhk_crm_tasks").select("*").order("due_at"),db.from("bhk_crm_stage_history").select("*").order("created_at",{ascending:false}),
 ]);
 for(const result of [teams,members,assignments,handovers,events,opportunities,tasks,history]) if(result.error) throw result.error;
 return {teams:teams.data??[],members:members.data??[],assignments:assignments.data??[],handovers:handovers.data??[],events:events.data??[],opportunities:opportunities.data??[],tasks:tasks.data??[],history:history.data??[]};
}
export async function createBrokerTeam(name:string):Promise<string>{
 const {data,error}=await requireSupabase().rpc("bhk_create_broker_team",{p_name:name});if(error) throw error;return data as string;
}
/** Active member role changes do not require reacceptance; new/reinvited members must accept. */
export async function manageBrokerTeamMember(teamId:string,userId:string,role:"member"|"manager",status:"invited"|"revoked"):Promise<void>{
 const {error}=await requireSupabase().rpc("bhk_manage_team_member",{p_team:teamId,p_user:userId,p_role:role,p_status:status});if(error) throw error;
}
export async function acceptBrokerTeamInvitation(teamId:string):Promise<void>{
 const {error}=await requireSupabase().rpc("bhk_accept_team_invitation",{p_team:teamId});if(error) throw error;
}
export async function assignCrmOpportunity(opportunityId:string,teamId:string,assigneeId:string,shareContact:boolean,version:number):Promise<number>{
 const {data,error}=await requireSupabase().rpc("bhk_assign_crm_opportunity",{p_opportunity:opportunityId,p_team:teamId,p_assignee:assigneeId,p_share_contact:shareContact,p_version:version});if(error) throw error;return data as number;
}
export async function revokeCrmAssignment(opportunityId:string,version:number):Promise<void>{
 const {error}=await requireSupabase().rpc("bhk_revoke_crm_assignment",{p_opportunity:opportunityId,p_version:version});if(error) throw error;
}
export async function requestCrmHandover(opportunityId:string,targetId:string,reason:string):Promise<string>{
 const {data,error}=await requireSupabase().rpc("bhk_request_crm_handover",{p_opportunity:opportunityId,p_target:targetId,p_reason:reason});if(error) throw error;return data as string;
}
export async function decideCrmHandover(id:string,approve:boolean,shareContact:boolean):Promise<void>{
 const {error}=await requireSupabase().rpc("bhk_decide_crm_handover",{p_id:id,p_approve:approve,p_share_contact:shareContact});if(error) throw error;
}
/** Read-only name/phone/email only after current assignment and explicit owner sharing consent. */
export async function loadSharedClientContact(opportunityId:string):Promise<{name:string;phone:string;email:string|null}|null>{
 const {data,error}=await requireSupabase().rpc("bhk_crm_shared_contact",{p_opportunity:opportunityId});if(error) throw error;return data?.[0]??null;
}
