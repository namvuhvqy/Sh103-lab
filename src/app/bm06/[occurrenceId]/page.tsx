import { redirect } from "next/navigation";

// Legacy occurrence URL retained only for saved links. Entry now lives in /equipment.
export default function Bm06OccurrencePage() {
  redirect("/equipment#bm06-entry");
}
