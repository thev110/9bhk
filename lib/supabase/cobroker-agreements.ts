import { requireSupabase } from "@/lib/supabase/browser";
export type CobrokerTerms={payerId:string;commissionPaise:number;brokerAPaise:number;brokerBPaise:number;milestones:string;attribution:string;terms:string};
function termsValues(input:CobrokerTerms){
 if(![input.commissionPaise,input.brokerAPaise,input.brokerBPaise].every(Number.isSafeInteger)||input.commissionPaise<=0||input.brokerAPaise<0||input.brokerBPaise<0||input.brokerAPaise+input.brokerBPaise!==input.commissionPaise) throw new Error("Commission shares must total the agreed integer-paise amount.");
 return {p_payer:input.payerId,p_commission:input.commissionPaise,p_share_a:input.brokerAPaise,p_share_b:input.brokerBPaise,p_milestones:input.milestones,p_attribution:input.attribution,p_terms:input.terms};
}
export async function loadCobrokerAgreements(){
 const db=requireSupabase();
 const [agreements,revisions,acceptances,events]=await Promise.all([db.from("bhk_cobroker_agreements").select("*").order("updated_at",{ascending:false}),db.from("bhk_cobroker_agreement_revisions").select("*").order("version",{ascending:false}),db.from("bhk_cobroker_acceptances").select("*"),db.from("bhk_cobroker_events").select("*").order("created_at",{ascending:false})]);
 for(const result of [agreements,revisions,acceptances,events]) if(result.error) throw result.error;
 return {agreements:agreements.data??[],revisions:revisions.data??[],acceptances:acceptances.data??[],events:events.data??[]};
}
export async function proposeCobrokerAgreement(propertyId:string,brokerA:string,brokerB:string,input:CobrokerTerms):Promise<string>{
 const {data,error}=await requireSupabase().rpc("bhk_propose_cobroker_agreement",{p_property:propertyId,p_broker_a:brokerA,p_broker_b:brokerB,...termsValues(input)});if(error) throw error;return data as string;
}
export async function reviseCobrokerAgreement(id:string,version:number,input:CobrokerTerms):Promise<number>{
 const {data,error}=await requireSupabase().rpc("bhk_revise_cobroker_agreement",{p_id:id,p_version:version,...termsValues(input)});if(error) throw error;return data as number;
}
/** All three parties accept the exact revision; assent does not initiate payment. */
export async function acceptCobrokerAgreement(id:string,version:number):Promise<void>{
 const {error}=await requireSupabase().rpc("bhk_accept_cobroker_agreement",{p_id:id,p_version:version});if(error) throw error;
}
export async function disputeCobrokerAgreement(id:string,version:number,reason:string):Promise<void>{
 const {error}=await requireSupabase().rpc("bhk_dispute_cobroker_agreement",{p_id:id,p_version:version,p_reason:reason});if(error) throw error;
}

export async function loadCobrokerMilestones(){
 const db=requireSupabase();
 const [milestones,acknowledgements]=await Promise.all([db.from("bhk_cobroker_milestones").select("*").order("created_at"),db.from("bhk_cobroker_milestone_acknowledgements").select("*").order("created_at")]);
 if(milestones.error)throw milestones.error;if(acknowledgements.error)throw acknowledgements.error;
 return {milestones:milestones.data??[],acknowledgements:acknowledgements.data??[]};
}
export async function proposeCobrokerMilestone(agreementId:string,version:number,input:{title:string;description:string;amountPaise:number;dueAt?:string}):Promise<string>{
 if(!Number.isSafeInteger(input.amountPaise)||input.amountPaise<0)throw new Error("Milestone amount must be non-negative integer paise.");
 const {data,error}=await requireSupabase().rpc("bhk_propose_cobroker_milestone",{p_agreement:agreementId,p_version:version,p_title:input.title,p_description:input.description,p_amount:input.amountPaise,p_due:input.dueAt??null});if(error)throw error;return data as string;
}
/** Payment is reported by the payer using an external reference; never treated as gateway verified. */
export async function claimCobrokerMilestone(id:string,kind:"completion"|"payment",note:string,receiptReference?:string):Promise<void>{
 const {error}=await requireSupabase().rpc("bhk_claim_cobroker_milestone",{p_id:id,p_kind:kind,p_note:note,p_receipt:receiptReference??null});if(error)throw error;
}
export async function acknowledgeCobrokerMilestone(id:string,kind:"proposal"|"completion"|"payment",note:string):Promise<void>{
 const {error}=await requireSupabase().rpc("bhk_acknowledge_cobroker_milestone",{p_id:id,p_kind:kind,p_note:note});if(error)throw error;
}
/** Use reviseCobrokerAgreement after a dispute; resolution requires all three new-version acceptances. */
