import { Suspense } from "react";
import PlanFlow from "./PlanFlow";

export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <PlanFlow />
    </Suspense>
  );
}
