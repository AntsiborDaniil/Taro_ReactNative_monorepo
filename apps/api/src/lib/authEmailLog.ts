export type AuthEmailKind = 'signup_confirmation' | 'signup_resend';

export type AuthEmailLogPayload = {
  to: string;
  kind: AuthEmailKind;
  code?: string;
  /** true = RAM dev (no SMTP); false = Supabase Auth mailer */
  simulated: boolean;
};

export function logAuthEmail(payload: AuthEmailLogPayload): void {
  const { to, kind, code, simulated } = payload;
  const delivery = simulated
    ? 'SIMULATED — письмо не уходит (memory backend / dev)'
    : 'QUEUED — Supabase Auth отправит письмо (Inbucket / SMTP)';

  const codePart = code ? `, код в письме: ${code}` : '';

  // eslint-disable-next-line no-console
  console.log(`[auth email] ${delivery} | ${kind} → ${to}${codePart}`);
}

export function logAuthSignupComplete(email: string, userId: string): void {
  // eslint-disable-next-line no-console
  console.log(
    `[auth] Registration complete — email=${email}, userId=${userId}`
  );
}

export function logAuthGoogleDevSignIn(email: string, userId: string): void {
  // eslint-disable-next-line no-console
  console.log(
    `[auth google] DEV mock sign-in — email=${email}, userId=${userId} (без реального Google OAuth)`
  );
}

export function logAuthRequest(
  method: string,
  path: string,
  statusCode: number,
  ms: number
): void {
  // eslint-disable-next-line no-console
  console.log(`[auth http] ${method} ${path} → ${statusCode} (${ms}ms)`);
}
