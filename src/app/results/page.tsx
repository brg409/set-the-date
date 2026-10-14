import { Suspense } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import ResultsClient from "./ResultsClient";

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResultsClient />
    </Suspense>
  );
}
