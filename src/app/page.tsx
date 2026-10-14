import { Suspense } from "react";
import FindScreen from "./FindScreen";

// `/` is the Find tab: criteria selection. (The old marketing landing page
// was retired; /plan and /saved redirect — see next.config.ts.)
export default function FindPage() {
  return (
    <Suspense fallback={null}>
      <FindScreen />
    </Suspense>
  );
}
