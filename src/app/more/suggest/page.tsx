import type { Metadata } from "next";
import { SubmissionForm } from "@/components/SubmissionForm";

export const metadata: Metadata = { title: "Suggest a Place — KnowaPlace" };

export default function Page() {
  return <SubmissionForm kind="suggest" />;
}
