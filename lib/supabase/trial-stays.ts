import { requireSupabase } from "@/lib/supabase/browser";
export type TrialStayTermsInput={enabled:boolean;terms:string;creditPaise:number;minNights:number;validUntil:string;creditValidDays:number};
export async function loadTrialStayTerms(propertyId:string){
 const {data,error}=await requireSupabase().from("bhk_trial_stay_terms").select("*").eq("property_id",propertyId).order("version",{ascending:false});
 if(error) throw error;
 return data??[];
}
export async function setTrialStayTerms(propertyId:string,version:number,input:TrialStayTermsInput):Promise<number>{
 if(!Number.isSafeInteger(input.creditPaise)||input.creditPaise<0) throw new Error("Credit must be a non-negative integer in paise.");
 const {data,error}=await requireSupabase().rpc("bhk_set_trial_stay_terms",{p_property:propertyId,p_version:version,p_enabled:input.enabled,p_terms:input.terms,p_credit:input.creditPaise,p_min_nights:input.minNights,p_valid_until:input.validUntil,p_credit_days:input.creditValidDays});
 if(error) throw error;
 return data as number;
}
/** The chosen terms must predate the booking. Exactly one own offer or enquiry is linked. */
export async function enrollTrialStay(bookingId:string,termsVersion:number,target:{offerId:string;enquiryId?:never}|{enquiryId:string;offerId?:never}):Promise<string>{
 const {data,error}=await requireSupabase().rpc("bhk_enroll_trial_stay",{p_booking:bookingId,p_terms_version:termsVersion,p_offer:target.offerId??null,p_enquiry:target.enquiryId??null});
 if(error) throw error;
 return data as string;
}
export async function approveTrialStayCredit(enrollmentId:string,reason:string):Promise<string>{
 const {data,error}=await requireSupabase().rpc("bhk_approve_trial_credit",{p_enrollment:enrollmentId,p_reason:reason});
 if(error) throw error;
 return data as string;
}
/** Records a seller-acknowledged purchase credit, without transferring funds or changing offer price. */
export async function applyTrialStayCredit(creditId:string,offerId:string,reason:string):Promise<void>{
 const {error}=await requireSupabase().rpc("bhk_apply_trial_credit",{p_credit:creditId,p_offer:offerId,p_reason:reason});
 if(error) throw error;
}
export async function reverseTrialStayCredit(creditId:string,reason:string):Promise<void>{
 const {error}=await requireSupabase().rpc("bhk_reverse_trial_credit",{p_credit:creditId,p_reason:reason});
 if(error) throw error;
}
export async function loadMyTrialStays(){
 const db=requireSupabase();
 const [enrollments,credits,events]=await Promise.all([db.from("bhk_trial_stay_enrollments").select("*").order("created_at",{ascending:false}),db.from("bhk_trial_stay_credits").select("*").order("created_at",{ascending:false}),db.from("bhk_trial_stay_credit_events").select("*").order("created_at",{ascending:false})]);
 for(const result of [enrollments,credits,events]) if(result.error) throw result.error;
 return {enrollments:enrollments.data??[],credits:credits.data??[],events:events.data??[]};
}
