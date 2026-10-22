// Server-only: whether the More-tab forms can actually send. Without Resend
// configured, the forms show "Coming soon" instead of letting someone fill
// one in only to be told it couldn't be delivered. The pages are prerendered,
// so after adding the variables in Vercel, redeploy for the forms to appear.
export function submissionsEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.SUBMISSIONS_TO_EMAIL);
}
