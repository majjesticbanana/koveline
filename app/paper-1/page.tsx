import { redirect } from "next/navigation";

/** Legacy Paper I URL: keep old bookmarks working, but use the integrated deck. */
export default function LegacyPaperOnePage() {
  redirect("/islam/paper-1");
}
