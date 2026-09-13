"use client";

import { useEffect, useState } from "react";
import { LOADING_MESSAGES } from "@/lib/copy";

export function LoadingScreen() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-28 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute h-16 w-16 animate-ping rounded-full bg-coral/20" />
        <span className="absolute h-11 w-11 animate-pulse rounded-full bg-coral/30" />
        <span className="relative h-6 w-6 rounded-full bg-coral" />
      </div>
      <p className="font-display text-lg text-navy transition-opacity duration-300">
        {LOADING_MESSAGES[index]}
      </p>
    </div>
  );
}
