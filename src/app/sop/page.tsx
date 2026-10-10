import type { Metadata } from "next";
import { SopClient } from "./SopClient";

export const metadata: Metadata = { title: "SOP review — AdmitLens" };

export default function SopPage() {
  return <SopClient />;
}
