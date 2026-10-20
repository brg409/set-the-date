"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, getButtonClasses } from "./Button";
import { VENUES } from "@/data/venues";
import {
  FEEDBACK_TOPICS,
  LIMITS,
  PLACE_AREAS,
  PLACE_KINDS,
  validateSubmission,
  type FieldErrors,
  type SubmissionKind,
} from "@/lib/submissions";

const INTRO: Record<SubmissionKind, { title: string; body: string; button: string; done: string; doneBody: string }> = {
  suggest: {
    title: "Suggest a Place",
    body: "Know somewhere great in Philadelphia that we should add? Tell us about it. We look at every suggestion and check the details before adding anything.",
    button: "Send suggestion",
    done: "Thanks for the suggestion",
    doneBody: "We'll take a look. New places are added once we've checked the details.",
  },
  feedback: {
    title: "Give Feedback",
    body: "Spotted something wrong, or have an idea? We read everything.",
    button: "Send feedback",
    done: "Thanks for the feedback",
    doneBody: "We read every message. If you left an email, we may write back.",
  },
  contact: {
    title: "Contact Us",
    body: "Questions or ideas? Send us a message and we'll reply by email.",
    button: "Send message",
    done: "Message sent",
    doneBody: "Thanks for reaching out. We'll reply to the email you gave.",
  },
};

const FAILURES: Record<string, string> = {
  not_configured:
    "Sending isn't set up on this site yet, so your message was not delivered. Nothing was lost; it's still here.",
  send_failed: "We couldn't send that just now. Your message is still here, so please try again in a moment.",
  rate_limited: "You've sent several messages in a short time. Please wait a few minutes and try again.",
  too_fast: "That was quick. Please check what you wrote and send it again.",
  too_large: "That message is too long to send.",
  forbidden: "This form can only be sent from the KnowaPlace site.",
  network: "We couldn't reach the server. Check your connection and try again.",
};

type Status = { state: "idle" } | { state: "sending" } | { state: "sent" } | { state: "failed"; message: string };

export function SubmissionForm({ kind }: { kind: SubmissionKind }) {
  const intro = INTRO[kind];
  const uid = useId();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });
  // When the form opened; the server rejects submissions that are far too quick.
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [trap, setTrap] = useState("");

  const set = (key: string) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const knownPlace = useMemo(() => {
    if (kind !== "suggest") return null;
    const typed = (values.name ?? "").trim().toLowerCase();
    if (typed.length < 3) return null;
    return VENUES.find((v) => v.name.toLowerCase() === typed) ?? null;
  }, [kind, values.name]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (status.state === "sending") return;
    const checked = validateSubmission(kind, values);
    if (!checked.ok) {
      setErrors(checked.errors);
      const first = Object.keys(checked.errors)[0];
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    setErrors({});
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, kind, startedAt, company: trap }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string; errors?: FieldErrors };
      if (res.ok && data.ok) {
        setStatus({ state: "sent" });
        return;
      }
      if (data.code === "invalid" && data.errors) {
        setErrors(data.errors);
        setStatus({ state: "idle" });
        return;
      }
      setStatus({ state: "failed", message: FAILURES[data.code ?? ""] ?? FAILURES.send_failed });
    } catch {
      setStatus({ state: "failed", message: FAILURES.network });
    }
  }

  function reset() {
    setValues({});
    setErrors({});
    setTrap("");
    setStartedAt(Date.now());
    setStatus({ state: "idle" });
  }

  const field = (key: string) => ({
    id: `${uid}-${key}`,
    value: values[key] ?? "",
    error: errors[key],
    onChange: set(key),
  });

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 pb-10 pt-4 sm:pt-6">
      <Link
        href="/more"
        className="-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-primary hover:text-primary-dark"
      >
        <ArrowLeft size={16} strokeWidth={2.25} aria-hidden />
        Back to More
      </Link>

      <h1 className="mt-2 font-display text-2xl text-ink sm:text-3xl">{intro.title}</h1>
      <p className="mt-1 text-sm leading-relaxed text-muted">{intro.body}</p>

      {status.state === "sent" ? (
        <div role="status" className="mt-6 flex flex-col items-start gap-3 rounded-3xl border border-line bg-card p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tint text-primary">
            <CheckCircle2 size={22} strokeWidth={2} aria-hidden />
          </span>
          <h2 className="font-display text-xl text-ink">{intro.done}</h2>
          <p className="text-sm text-muted">{intro.doneBody}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Button variant="outline" onClick={reset}>
              Send another
            </Button>
            <Link href="/more" className={getButtonClasses("secondary", "md")}>
              Back to More
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-5">
          {kind === "suggest" && (
            <>
              <TextField label="Name of the place" required maxLength={LIMITS.name} {...field("name")} />
              {knownPlace && (
                <p className="-mt-3 rounded-xl bg-tint px-3 py-2 text-sm text-ink">
                  We already have {knownPlace.name} on KnowaPlace. If you mean a different location, tell us
                  below.
                </p>
              )}
              <TextField
                label="Address or website"
                required
                hint="Either one helps us find it."
                maxLength={LIMITS.short}
                {...field("where")}
              />
              <SelectField label="Neighborhood" options={PLACE_AREAS} {...field("area")} />
              <SelectField label="What kind of place is it?" options={PLACE_KINDS} {...field("placeKind")} />
              <TextArea
                label="Why is it worth adding?"
                optional
                maxLength={LIMITS.why}
                rows={4}
                {...field("why")}
              />
              <TextField label="Your email" optional type="email" hint="Only if you'd like us to follow up." maxLength={LIMITS.email} {...field("email")} />
            </>
          )}
          {kind === "feedback" && (
            <>
              <SelectField label="What's it about?" options={FEEDBACK_TOPICS} {...field("topic")} />
              <TextArea label="Your feedback" required maxLength={LIMITS.message} rows={6} {...field("message")} />
              <TextField label="Your email" optional type="email" hint="Only if you'd like a reply." maxLength={LIMITS.email} {...field("email")} />
            </>
          )}
          {kind === "contact" && (
            <>
              <TextField label="Your name" optional maxLength={LIMITS.name} {...field("name")} />
              <TextField label="Your email" required type="email" hint="So we can reply." maxLength={LIMITS.email} {...field("email")} />
              <TextArea label="Your message" required maxLength={LIMITS.message} rows={6} {...field("message")} />
            </>
          )}

          {/* A field people never see: bots tend to fill every field they find. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Leave this empty
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={trap}
                onChange={(e) => setTrap(e.target.value)}
              />
            </label>
          </div>

          {status.state === "failed" && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-accent bg-accent/20 px-3 py-2.5 text-sm text-ink"
            >
              <AlertCircle size={16} strokeWidth={2.25} className="mt-0.5 shrink-0 text-primary-dark" aria-hidden />
              {status.message}
            </p>
          )}

          <Button type="submit" size="lg" disabled={status.state === "sending"} className="w-full">
            {status.state === "sending" ? "Sending…" : intro.button}
          </Button>
          <p className="-mt-2 text-center text-xs text-muted">
            We use what you send only to read and reply to it. Your message is emailed to us and isn&rsquo;t
            shared.
          </p>
        </form>
      )}
    </main>
  );
}

interface BaseProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  required?: boolean;
  optional?: boolean;
  hint?: string;
}

const INPUT_CLASSES =
  "w-full rounded-xl border bg-card px-3.5 py-2.5 text-base text-ink placeholder:text-muted focus:border-primary sm:text-sm";

function Label({ id, label, required, optional }: Pick<BaseProps, "id" | "label" | "required" | "optional">) {
  return (
    <label htmlFor={id} className="mb-1 block text-sm font-semibold text-ink">
      {label}
      {required && <span className="ml-0.5 text-primary" aria-hidden> *</span>}
      {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
    </label>
  );
}

function Note({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  if (!error && !hint) return null;
  return (
    <p id={`${id}-note`} className={`mt-1 text-xs ${error ? "font-medium text-primary-dark" : "text-muted"}`}>
      {error || hint}
    </p>
  );
}

function TextField({
  type = "text",
  maxLength,
  ...p
}: BaseProps & { type?: string; maxLength?: number }) {
  return (
    <div>
      <Label {...p} />
      <input
        id={p.id}
        type={type}
        value={p.value}
        maxLength={maxLength}
        required={p.required}
        aria-required={p.required}
        aria-invalid={Boolean(p.error)}
        aria-describedby={p.error || p.hint ? `${p.id}-note` : undefined}
        onChange={(e) => p.onChange(e.target.value)}
        className={`${INPUT_CLASSES} ${p.error ? "border-primary-dark" : "border-line"}`}
      />
      <Note id={p.id} hint={p.hint} error={p.error} />
    </div>
  );
}

function TextArea({ rows = 4, maxLength, ...p }: BaseProps & { rows?: number; maxLength?: number }) {
  return (
    <div>
      <Label {...p} />
      <textarea
        id={p.id}
        value={p.value}
        rows={rows}
        maxLength={maxLength}
        aria-required={p.required}
        aria-invalid={Boolean(p.error)}
        aria-describedby={p.error || p.hint ? `${p.id}-note` : undefined}
        onChange={(e) => p.onChange(e.target.value)}
        className={`${INPUT_CLASSES} resize-y ${p.error ? "border-primary-dark" : "border-line"}`}
      />
      <Note id={p.id} hint={p.hint} error={p.error} />
    </div>
  );
}

function SelectField({
  options,
  ...p
}: BaseProps & { options: readonly { value: string; label: string }[] }) {
  return (
    <div>
      <Label {...p} optional />
      <select
        id={p.id}
        value={p.value}
        aria-invalid={Boolean(p.error)}
        aria-describedby={p.error ? `${p.id}-note` : undefined}
        onChange={(e) => p.onChange(e.target.value)}
        className={`${INPUT_CLASSES} ${p.error ? "border-primary-dark" : "border-line"}`}
      >
        <option value="">Choose one</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Note id={p.id} error={p.error} />
    </div>
  );
}
