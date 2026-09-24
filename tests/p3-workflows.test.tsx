import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { validateDecontamination, validateMaintenance, validateShiftStatuses } from "@/lib/forms/validation";
import { ShiftRegisterForm } from "@/components/forms/ShiftRegisterForm";
import { MaintenanceForm } from "@/components/forms/MaintenanceForm";

const assets=Array.from({length:25},(_,index)=>({id:`00000000-0000-0000-0000-${String(index+1).padStart(12,"0")}`,sourceOrder:index+1,name:`Máy ${index+1}`,locationCode:index<9?'SINH_HOA':'MIEN_DICH'}));

describe("P3 workflow validation",()=>{
 it("requires at least one KNBM activity",()=>{
  expect(validateDecontamination({daily:false,weekly:false,spill:false})).toEqual({ok:false,error:"Chọn ít nhất một hoạt động khử nhiễm"});
  expect(validateDecontamination({daily:true,weekly:true,spill:false})).toEqual({ok:true});
 });
 it("accepts only MVP maintenance cadence and result",()=>{
  expect(validateMaintenance("WEEKLY","PASS")).toEqual({ok:true});
  expect(validateMaintenance("QUARTERLY","PASS").ok).toBe(false);
  expect(validateMaintenance("DAILY","UNKNOWN").ok).toBe(false);
 });
 it("rejects duplicate, missing, or invalid BM06 statuses",()=>{
  const valid=assets.map(asset=>({assetId:asset.id,status:"BT"}));
  expect(validateShiftStatuses(valid,assets.map(a=>a.id))).toEqual({ok:true});
  expect(validateShiftStatuses(valid.slice(0,24),assets.map(a=>a.id)).ok).toBe(false);
  expect(validateShiftStatuses([...valid.slice(0,24),valid[0]],assets.map(a=>a.id)).ok).toBe(false);
  expect(validateShiftStatuses(valid.map((x,i)=>i===0?{...x,status:"NA"}:x),assets.map(a=>a.id)).ok).toBe(false);
 });
});

describe("Maintenance MVP form",()=>{
 it("exposes only Daily Weekly Monthly and PASS FAIL",()=>{
  render(<MaintenanceForm occurrenceId="occ-1" cadence="WEEKLY" assetName="Máy X"/>);
  expect(screen.getByText("Hằng tuần")).toBeInTheDocument();
  expect(screen.getByRole("radio",{name:"Đạt"})).toBeInTheDocument();
  expect(screen.getByRole("radio",{name:"Không đạt"})).toBeInTheDocument();
  expect(screen.queryByText(/03 tháng|06 tháng|12 tháng/)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/đính kèm/i)).not.toBeInTheDocument();
 });
});

describe("BM06 mobile form",()=>{
 it("renders 25 ordered machines and progress without preselecting status",()=>{
  render(<ShiftRegisterForm occurrenceId="occ-1" assets={assets} initialStatuses={{}} lockVersion={1}/>);
  expect(screen.getAllByRole("group",{name:/trạng thái máy/i})).toHaveLength(25);
  expect(screen.getByText("0/25 máy đã ghi nhận")).toBeInTheDocument();
  expect(screen.getByText("#1")).toBeInTheDocument();
  expect(screen.getByText("#25")).toBeInTheDocument();
  expect(screen.getByRole("button",{name:"Lưu nháp"})).toBeDisabled();
  expect(screen.getByRole("button",{name:"Hoàn tất ca"})).toBeDisabled();
 });
 it("limits area-first entry to area assets and never exposes finalize",()=>{
  const initial=Object.fromEntries(assets.map(asset=>[asset.id,"BT"]));
  render(<ShiftRegisterForm occurrenceId="occ-1" assets={assets} initialStatuses={initial} lockVersion={1} areaCode="SINH_HOA"/>);
  expect(screen.getAllByRole("group",{name:/trạng thái máy/i})).toHaveLength(9);
  expect(screen.queryByRole("button",{name:"Hoàn tất ca"})).not.toBeInTheDocument();
  expect(screen.getByRole("button",{name:"Lưu nháp khu vực"})).toBeInTheDocument();
 });
});
