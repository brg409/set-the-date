import type { Metadata } from "next";
import { SubmissionForm } from "@/components/SubmissionForm";
import { submissionsEnabled } from "@/lib/submissionsConfig";

export const metadata: Metadata = { title: "Contact Us — KnowaPlace" };

export default function Page() {
  return <SubmissionForm kind="contact" enabled={submissionsEnabled()} />;
}
