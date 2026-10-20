// The three forms on the More tab (Suggest a Place, Give Feedback, Contact Us):
// what each one collects, how it is validated, and how it becomes an email.
// Pure functions, shared by the form pages (instant feedback) and the
// /api/submit route (the check that actually counts). No secrets in here.

export type SubmissionKind = "suggest" | "feedback" | "contact";

export const SUBMISSION_KINDS: SubmissionKind[] = ["suggest", "feedback", "contact"];

export const LIMITS = {
  name: 120,
  short: 200,
  email: 254,
  message: 2000,
  why: 1000,
  page: 200,
} as const;

/** A person has to take at least this long to fill in a form. */
export const MIN_FILL_MS = 3000;

export const PLACE_KINDS = [
  { value: "restaurant", label: "Restaurant" },
  { value: "bar", label: "Bar" },
  { value: "coffee", label: "Coffee shop or café" },
  { value: "dessert", label: "Dessert or bakery" },
  { value: "activity", label: "Activity or experience" },
  { value: "other", label: "Something else" },
] as const;

export const PLACE_AREAS = [
  { value: "rittenhouse", label: "Rittenhouse" },
  { value: "center_city", label: "Center City" },
  { value: "old_city", label: "Old City" },
  { value: "fishtown", label: "Fishtown" },
  { value: "university_city", label: "University City" },
  { value: "south_philly", label: "South Philly" },
  { value: "elsewhere", label: "Somewhere else" },
] as const;

export const FEEDBACK_TOPICS = [
  { value: "wrong_info", label: "Something is wrong or out of date" },
  { value: "bug", label: "Something isn't working" },
  { value: "idea", label: "An idea" },
  { value: "love", label: "Something I like" },
  { value: "other", label: "Something else" },
] as const;

export type FieldErrors = Record<string, string>;

export interface CleanSubmission {
  kind: SubmissionKind;
  /** Every field the person filled in, trimmed. Keys depend on `kind`. */
  fields: Record<string, string>;
}

export type ValidationResult =
  | { ok: true; value: CleanSubmission }
  | { ok: false; errors: FieldErrors };

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

export function isValidEmail(value: string): boolean {
  return value.length <= LIMITS.email && EMAIL_PATTERN.test(value);
}

function text(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
}

function oneOf(value: string, options: readonly { value: string }[]): boolean {
  return options.some((o) => o.value === value);
}

/**
 * Checks and cleans one submission. The same rules run in the browser (so
 * mistakes show before sending) and on the server (so nothing depends on the
 * browser having done it).
 */
export function validateSubmission(kind: SubmissionKind, raw: unknown): ValidationResult {
  const input = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};
  const fields: Record<string, string> = {};

  const need = (key: string, max: number, label: string, min = 1) => {
    const value = text(input, key);
    if (value.length < min) {
      errors[key] = min > 1 ? `${label} needs at least ${min} characters.` : `${label} is required.`;
    } else if (value.length > max) {
      errors[key] = `${label} must be ${max} characters or fewer.`;
    } else {
      fields[key] = value;
    }
  };
  const optional = (key: string, max: number, label: string) => {
    const value = text(input, key);
    if (!value) return;
    if (value.length > max) errors[key] = `${label} must be ${max} characters or fewer.`;
    else fields[key] = value;
  };
  const choice = (key: string, options: readonly { value: string }[], label: string) => {
    const value = text(input, key);
    if (!value) return;
    if (!oneOf(value, options)) errors[key] = `Choose one of the ${label} options.`;
    else fields[key] = value;
  };
  const email = (required: boolean) => {
    const value = text(input, "email");
    if (!value) {
      if (required) errors.email = "Your email is required so we can reply.";
      return;
    }
    if (!isValidEmail(value)) errors.email = "That doesn't look like an email address.";
    else fields.email = value;
  };

  if (kind === "suggest") {
    need("name", LIMITS.name, "The place's name");
    need("where", LIMITS.short, "The address or website");
    choice("placeKind", PLACE_KINDS, "type");
    choice("area", PLACE_AREAS, "neighborhood");
    optional("why", LIMITS.why, "Your note");
    email(false);
  } else if (kind === "feedback") {
    need("message", LIMITS.message, "Your feedback", 5);
    choice("topic", FEEDBACK_TOPICS, "topic");
    optional("page", LIMITS.page, "The page");
    email(false);
  } else if (kind === "contact") {
    optional("name", LIMITS.name, "Your name");
    email(true);
    need("message", LIMITS.message, "Your message", 5);
  } else {
    return { ok: false, errors: { form: "Unknown form." } };
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value: { kind, fields } };
}

/**
 * Bot checks that don't bother people: a hidden field a person never sees
 * (bots fill every field) and a minimum time to fill the form in.
 */
export function spamVerdict(raw: unknown, now: number): "ok" | "bot" | "too_fast" {
  const input = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  if (typeof input.company === "string" && input.company.trim() !== "") return "bot";
  const startedAt = Number(input.startedAt);
  if (!Number.isFinite(startedAt) || now - startedAt < MIN_FILL_MS) return "too_fast";
  return "ok";
}

const LABELS: Record<SubmissionKind, string> = {
  suggest: "Suggested place",
  feedback: "Feedback",
  contact: "Contact",
};

function labelFor(options: readonly { value: string; label: string }[], value?: string): string | undefined {
  return options.find((o) => o.value === value)?.label;
}

/** Newlines in a subject or header value would let a sender add headers. */
function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ComposedEmail {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

/** The email that lands in your inbox for a submission. */
export function composeEmail(submission: CleanSubmission): ComposedEmail {
  const { kind, fields } = submission;
  const rows: [string, string][] = [];

  if (kind === "suggest") {
    rows.push(["Place", fields.name]);
    rows.push(["Address or website", fields.where]);
    const area = labelFor(PLACE_AREAS, fields.area);
    if (area) rows.push(["Neighborhood", area]);
    const type = labelFor(PLACE_KINDS, fields.placeKind);
    if (type) rows.push(["Type", type]);
    if (fields.why) rows.push(["Why it's good", fields.why]);
  } else if (kind === "feedback") {
    const topic = labelFor(FEEDBACK_TOPICS, fields.topic);
    if (topic) rows.push(["Topic", topic]);
    if (fields.page) rows.push(["Page", fields.page]);
    rows.push(["Feedback", fields.message]);
  } else {
    if (fields.name) rows.push(["Name", fields.name]);
    rows.push(["Message", fields.message]);
  }
  rows.push(["Reply email", fields.email ?? "(not given)"]);

  const subject = oneLine(
    kind === "suggest"
      ? `[KnowaPlace] ${LABELS[kind]}: ${fields.name}`
      : kind === "contact" && fields.name
        ? `[KnowaPlace] ${LABELS[kind]} from ${fields.name}`
        : `[KnowaPlace] ${LABELS[kind]}`
  );

  const textBody = rows.map(([label, value]) => `${label}:\n${value}`).join("\n\n");
  const htmlBody = rows
    .map(
      ([label, value]) =>
        `<p style="margin:0 0 14px"><strong>${escapeHtml(label)}</strong><br>${escapeHtml(value).replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  return {
    subject,
    text: textBody,
    html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#282332">${htmlBody}</div>`,
    replyTo: fields.email,
  };
}
