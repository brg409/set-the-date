import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOME_COPY } from "@/lib/homeContent";

export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-5xl px-5 pb-12 md:pb-16">
      <div className="rounded-3xl bg-primary px-6 py-10 text-center text-white sm:py-12">
        <h2 className="font-display text-2xl font-medium sm:text-4xl">{HOME_COPY.finalHeading}</h2>
        <Link
          href="/find"
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-medium text-primary-dark transition-colors hover:bg-tint"
        >
          {HOME_COPY.cta}
          <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
