import Link from "next/link";
import { DATE_TYPE_OPTIONS } from "@/lib/options";
import { HOME_COPY, QUICK_START_OCCASIONS } from "@/lib/homeContent";

/** Each option opens Find with that existing occasion already selected. */
export function QuickStart() {
  const options = QUICK_START_OCCASIONS.map((value) =>
    DATE_TYPE_OPTIONS.find((o) => o.value === value)
  ).filter((o): o is (typeof DATE_TYPE_OPTIONS)[number] => Boolean(o));

  return (
    <section aria-labelledby="quick-start" className="border-y border-line bg-card">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 md:py-10">
        <h2 id="quick-start" className="font-display text-2xl text-ink sm:text-3xl">
          {HOME_COPY.quickStartHeading}
        </h2>
        <p className="mt-1 text-sm text-muted">{HOME_COPY.quickStartSub}</p>
        <ul className="-mx-5 mt-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0 md:pb-0">
          {options.map(({ value, label, description, icon: Icon }) => (
            <li key={value} className="min-w-[9.5rem] shrink-0 snap-start md:min-w-0">
              <Link
                href={`/find?dateType=${value}`}
                className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-page p-4 transition-colors hover:border-primary/50 hover:bg-tint"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tint text-primary">
                  <Icon size={18} strokeWidth={2} aria-hidden />
                </span>
                <span className="font-medium text-ink">{label}</span>
                <span className="text-xs leading-snug text-muted">{description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
