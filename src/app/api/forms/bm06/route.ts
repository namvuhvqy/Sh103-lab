import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateShiftStatuses } from "@/lib/forms/validation";
const redirectError=(request:Request,area:string,message:string)=>NextResponse.redirect(new URL(`/bm06?area=${encodeURIComponent(area)}&error=${encodeURIComponent(message)}`,request.url),303);
export async function POST(request:Request){
 const data=await request.formData(),occurrenceId=String(data.get("occurrenceId")??""),areaCode=String(data.get("areaCode")??""),intent=String(data.get("intent")??"draft");
 let statuses:unknown;try{statuses=JSON.parse(String(data.get("statuses")??"[]"))}catch{return redirectError(request,areaCode,"Payload trạng thái không hợp lệ")}
 if(!Array.isArray(statuses))return redirectError(request,areaCode,"Payload trạng thái không hợp lệ");
 const supabase=await createClient();
 const{data:occ,error:occurrenceError}=await supabase.from("schedule_occurrences").select("period_id,register_periods(form_version_id)").eq("id",occurrenceId).single();
 const period=occ?.register_periods as unknown as {form_version_id:string}|null;
 if(occurrenceError||!period)return redirectError(request,areaCode,"Không tìm thấy ca hoặc bạn không có quyền truy cập");
 const{data:expected,error:assetError}=await supabase.from("form_version_assets").select("asset_id").eq("form_version_id",period.form_version_id).eq("active",true);
 if(assetError)return redirectError(request,areaCode,"Không tải được danh sách thiết bị");
 const mapped=statuses.map((item:Record<string,unknown>)=>({assetId:String(item.asset_id),status:String(item.status)}));
 const required=intent==="finalize"?(expected??[]).map(item=>item.asset_id):mapped.map(item=>item.assetId);
 const validation=validateShiftStatuses(mapped,required);
 if(!validation.ok)return redirectError(request,areaCode,validation.error);
 const{error}=await supabase.rpc("save_equipment_shift_draft",{target_occurrence_id:occurrenceId,target_usage:Number(data.get("usageValue")),target_unit:String(data.get("usageUnit")),target_note:String(data.get("note")||"")||null,target_statuses:statuses,target_finalize:intent==="finalize",target_expected_lock:Number(data.get("lockVersion")||1)});
 if(error)return redirectError(request,areaCode,"Không thể lưu ca. Dữ liệu có thể đã thay đổi; vui lòng tải lại và thử lại.");
 return NextResponse.redirect(new URL(`/bm06?area=${encodeURIComponent(areaCode)}&saved=1`,request.url),303);
}
