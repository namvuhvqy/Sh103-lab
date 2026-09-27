import { permanentRedirect } from "next/navigation";

export default function GeneralTasksRedirect() {
  permanentRedirect("/temperature");
}
