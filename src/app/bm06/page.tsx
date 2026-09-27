import { redirect } from "next/navigation";

// Legacy BM.06 screen retained only for saved links. Entry now lives in /equipment.
export default function Bm06Page() {
  redirect("/equipment#bm06-entry");
}
