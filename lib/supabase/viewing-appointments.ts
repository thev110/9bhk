import { requireSupabase } from "@/lib/supabase/browser";
export type ViewingAction = "confirmed" | "rescheduled" | "cancelled";
export async function listViewingAppointments() {
  const db=requireSupabase();
  const [appointments,events]=await Promise.all([
    db.from("bhk_viewing_appointments").select("*").order("starts_at"),
    db.from("bhk_viewing_appointment_events").select("*").order("created_at",{ascending:false}),
  ]);
  if(appointments.error) throw appointments.error;
  if(events.error) throw events.error;
  return { appointments:appointments.data??[],events:events.data??[] };
}
function windowValues(startsAt:string,endsAt:string) {
  const start=Date.parse(startsAt),end=Date.parse(endsAt);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>4*60*60*1000) throw new Error("Choose a viewing window of up to four hours.");
  return {p_start:new Date(start).toISOString(),p_end:new Date(end).toISOString()};
}
export async function proposeViewingAppointment(requestId:string,startsAt:string,endsAt:string,reason:string):Promise<string> {
  const {data,error}=await requireSupabase().rpc("bhk_propose_viewing",{p_request:requestId,...windowValues(startsAt,endsAt),p_reason:reason});
  if(error) throw error;
  return data as string;
}
export async function updateViewingAppointment(id:string,version:number,action:ViewingAction,reason:string,window?:{startsAt:string;endsAt:string}):Promise<number> {
  if(action==="rescheduled"&&!window) throw new Error("Choose the proposed viewing time.");
  const {data,error}=await requireSupabase().rpc("bhk_update_viewing",{p_id:id,p_version:version,p_action:action,p_reason:reason,...(action==="rescheduled"&&window?windowValues(window.startsAt,window.endsAt):{p_start:null,p_end:null})});
  if(error) throw error;
  return data as number;
}

export async function saveViewingQualification(requestId:string,version:number,input:{budgetMinPaise:number;budgetMaxPaise:number;financing:"unknown"|"cash_self_reported"|"loan_needed"|"preapproved_self_reported";purchaseTimeline:string}):Promise<number> {
  if(!Number.isSafeInteger(input.budgetMinPaise)||!Number.isSafeInteger(input.budgetMaxPaise)||input.budgetMinPaise<0||input.budgetMaxPaise<input.budgetMinPaise) throw new Error("Provide an integer-paise budget range.");
  const {data,error}=await requireSupabase().rpc("bhk_qualify_viewing_request",{p_request:requestId,p_version:version,p_min:input.budgetMinPaise,p_max:input.budgetMaxPaise,p_financing:input.financing,p_timeline:input.purchaseTimeline});
  if(error) throw error;
  return data as number;
}
export async function recordViewingAttendance(id:string,version:number,attendance:"attended"|"no_show",reason:string):Promise<number> {
  const {data,error}=await requireSupabase().rpc("bhk_record_viewing_attendance",{p_id:id,p_version:version,p_attendance:attendance,p_reason:reason});
  if(error) throw error;
  return data as number;
}
export async function submitViewingFeedback(id:string,usefulness:number,body:string):Promise<void> {
  const {error}=await requireSupabase().rpc("bhk_submit_viewing_feedback",{p_id:id,p_usefulness:usefulness,p_body:body});
  if(error) throw error;
}
export async function loadViewingQualificationAndFeedback() {
  const db=requireSupabase();
  const [qualifications,feedback]=await Promise.all([db.from("bhk_viewing_qualifications").select("*"),db.from("bhk_viewing_feedback").select("*")]);
  if(qualifications.error) throw qualifications.error;
  if(feedback.error) throw feedback.error;
  return {qualifications:qualifications.data??[],feedback:feedback.data??[]};
}
