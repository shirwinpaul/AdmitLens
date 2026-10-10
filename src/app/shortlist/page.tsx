import type { Metadata } from "next";
import { ShortlistView } from "@/components/ShortlistView";

export const metadata: Metadata = { title: "My shortlist — AdmitLens" };

export default function ShortlistPage() {
  return <ShortlistView />;
}
