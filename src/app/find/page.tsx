import { Suspense } from "react";
import FindScreen from "./FindScreen";

// `/find` is the Find tab: criteria selection. `/` is the homepage; old
// `/plan` and `/?dateType=…` links redirect here — see next.config.ts.
export default function FindPage() {
  return (
    <Suspense fallback={null}>
      <FindScreen />
    </Suspense>
  );
}
