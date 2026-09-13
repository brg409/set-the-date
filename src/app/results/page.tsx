import { Suspense } from "react";
import { Header } from "@/components/Header";
import { LoadingScreen } from "@/components/LoadingScreen";
import ResultsClient from "./ResultsClient";

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <Header />
          <LoadingScreen />
        </div>
      }
    >
      <ResultsClient />
    </Suspense>
  );
}
