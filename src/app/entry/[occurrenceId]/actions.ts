"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { vietnamLocalDateTimeToIso } from "@/lib/forms/datetime";
const text=(form:FormData,key:string)=>String(form.get(key)??"");
const fail=(id:string,message:string):never=>redirect(`/entry/${id}?error=${encodeURIComponent(message)}`);
export async function saveMeasurementAction(form:FormData){
 const id=text(form,"occurrenceId"); let performedAt="";
 try{performedAt=vietnamLocalDateTimeToIso(text(form,"performedAt"));}catch(error){fail(id,error instanceof Error?error.message:"Ngày giờ không hợp lệ");}
 const supabase=await createClient();
 const{error}=await supabase.rpc("save_measurement_record",{target_occurrence_id:id,target_performed_at:performedAt,target_temperature:Number(text(form,"temperature")),target_humidity:text(form,"humidity")?Number(text(form,"humidity")):null,target_note:text(form,"note")||null,target_is_na:false,target_na_reason:null});
 if(error)fail(id,"Không thể lưu số đo. Vui lòng tải lại và thử lại.");
 revalidatePath("/tasks"); redirect(`/tasks?saved=${id}`);
}
export async function markNaAction(form:FormData){
 const id=text(form,"occurrenceId"),reason=text(form,"reason").trim(); if(!reason)fail(id,"Lý do N/A là bắt buộc");
 const supabase=await createClient(); const{error}=await supabase.rpc("save_measurement_record",{target_occurrence_id:id,target_performed_at:null,target_temperature:null,target_humidity:null,target_note:null,target_is_na:true,target_na_reason:reason});
 if(error)fail(id,"Không thể đánh dấu Không áp dụng. Vui lòng tải lại và thử lại.");
 revalidatePath("/tasks"); redirect("/tasks?saved=na");
}
