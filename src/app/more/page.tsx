import Link from "next/link";
import {
  ChevronRight,
  Info,
  Lightbulb,
  Mail,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { BRAND } from "@/lib/copy";

const ROWS: { icon: LucideIcon; title: string; body: string; href?: string }[] = [
  { icon: Lightbulb, title: "Suggest a Place", body: "Know a place we should add?", href: "/more/suggest" },
  { icon: MessageSquare, title: "Give Feedback", body: "We'd love to hear from you.", href: "/more/feedback" },
  { icon: Mail, title: "Contact Us", body: "Questions? Ideas? Reach out.", href: "/more/contact" },
  { icon: Settings, title: "Settings", body: "Manage your preferences." },
];

const ROW_CLASSES = "flex items-center gap-4 rounded-2xl border border-line bg-card px-4 py-4";

function RowBody({ icon: Icon, title, body, href }: (typeof ROWS)[number]) {
  return (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tint text-primary">
        <Icon size={20} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-sm text-muted">{body}</span>
        {!href && (
          <span className="mt-2 inline-block rounded-full bg-tint px-2.5 py-0.5 text-xs font-medium text-muted">
            Coming soon
          </span>
        )}
      </span>
      {href && <ChevronRight size={18} strokeWidth={2.25} className="shrink-0 text-muted" aria-hidden />}
    </>
  );
}

export default function MorePage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-8 pt-6 sm:pt-8">
      <h1 className="font-display text-2xl text-ink sm:text-3xl">More</h1>
      <p className="mt-1 text-sm text-muted">Help make KnowaPlace even better.</p>

      <ul className="mt-6 flex flex-col gap-3">
        {ROWS.map((row) => (
          <li key={row.title}>
            {row.href ? (
              <Link href={row.href} className={`${ROW_CLASSES} transition-colors hover:border-primary/50 hover:bg-tint`}>
                <RowBody {...row} />
              </Link>
            ) : (
              <div className={`${ROW_CLASSES} opacity-70`}>
                <RowBody {...row} />
              </div>
            )}
          </li>
        ))}
      </ul>

      <section className="mt-6 rounded-2xl bg-tint p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Info size={16} strokeWidth={2.25} className="text-primary" />
          About KnowaPlace
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/80">{BRAND.about}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          KnowaPlace is a prototype covering six Philadelphia neighborhoods. Venue details,
          hours, and availability can change, so confirm with the venue before you go.
          Attributes like noise and romance are editorial judgments, not measured data.
        </p>
      </section>
    </main>
  );
}
