import type { Metadata } from "next";
import { SubmissionForm } from "@/components/SubmissionForm";

export const metadata: Metadata = { title: "Give Feedback — KnowaPlace" };

export default function Page() {
  return <SubmissionForm kind="feedback" />;
}
