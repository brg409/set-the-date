import { HOME_COPY, HOW_IT_WORKS } from "@/lib/homeContent";

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works"
      className="mx-auto w-full max-w-5xl px-5 pb-10 md:pb-14"
    >
      <h2 id="how-it-works" className="font-display text-2xl text-ink sm:text-3xl">
        {HOME_COPY.howHeading}
      </h2>
      <ol className="mt-5 grid gap-5 md:grid-cols-3 md:gap-8">
        {HOW_IT_WORKS.map((step, i) => (
          <li key={step.title} className="flex items-start gap-4">
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tint font-display text-lg text-primary"
            >
              {i + 1}
            </span>
            <div>
              <h3 className="font-medium text-ink">{step.title}</h3>
              <p className="mt-0.5 text-sm text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
