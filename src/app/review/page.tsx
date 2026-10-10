import type { Metadata } from "next";
import { ReviewClient } from "./ReviewClient";

export const metadata: Metadata = { title: "Resume review — AdmitLens" };

export default function ReviewPage() {
  return <ReviewClient />;
}
