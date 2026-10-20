// Receives a More-tab form (suggest / feedback / contact) and emails it to the
// site owner through Resend. Everything secret stays here on the server:
//
//   RESEND_API_KEY          required - the Resend API key
//   SUBMISSIONS_TO_EMAIL    required - the inbox that receives submissions
//   SUBMISSIONS_FROM_EMAIL  optional - defaults to Resend's testing sender
//
// It never reports success unless Resend accepted the email, and when the
// keys are missing it says so rather than pretending to send.

import {
  SUBMISSION_KINDS,
  composeEmail,
  spamVerdict,
  validateSubmission,
  type SubmissionKind,
} from "@/lib/submissions";

const MAX_BODY_BYTES = 12_000;
const DEFAULT_FROM = "KnowaPlace <onboarding@resend.dev>";

// Best-effort limit per visitor. Serverless instances don't share memory, so
// this slows a single noisy client down rather than guaranteeing a cap.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const recent = new Map<string, number[]>();

function rateLimited(key: string, now: number): boolean {
  const hits = (recent.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  recent.set(key, hits);
  if (recent.size > 500) {
    for (const [k, v] of recent) if (v.every((t) => now - t >= RATE_WINDOW_MS)) recent.delete(k);
  }
  return hits.length > RATE_MAX;
}

function reply(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request): Promise<Response> {
  // Only forms on this site may post here.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return reply(403, { ok: false, code: "forbidden" });
  }

  let raw: unknown;
  try {
    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) return reply(413, { ok: false, code: "too_large" });
    raw = JSON.parse(body);
  } catch {
    return reply(400, { ok: false, code: "bad_request" });
  }

  const now = Date.now();
  const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (rateLimited(ip, now)) return reply(429, { ok: false, code: "rate_limited" });

  const spam = spamVerdict(raw, now);
  // A bot that filled the hidden field is told it worked and nothing is sent.
  if (spam === "bot") return reply(200, { ok: true });
  if (spam === "too_fast") return reply(400, { ok: false, code: "too_fast" });

  const kind = (raw as { kind?: unknown }).kind;
  if (typeof kind !== "string" || !SUBMISSION_KINDS.includes(kind as SubmissionKind)) {
    return reply(400, { ok: false, code: "bad_request" });
  }
  const checked = validateSubmission(kind as SubmissionKind, raw);
  if (!checked.ok) return reply(422, { ok: false, code: "invalid", errors: checked.errors });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUBMISSIONS_TO_EMAIL;
  if (!apiKey || !to) return reply(503, { ok: false, code: "not_configured" });

  const email = composeEmail(checked.value);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.SUBMISSIONS_FROM_EMAIL || DEFAULT_FROM,
        to: [to],
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
    });
    if (!res.ok) return reply(502, { ok: false, code: "send_failed" });
    return reply(200, { ok: true });
  } catch {
    return reply(502, { ok: false, code: "send_failed" });
  }
}
