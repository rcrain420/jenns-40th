export type AdminEmailEnv = {
  ADMIN_EMAIL?: string;
  ADMIN_EMAILS?: string;
};

/** Split comma, semicolon, or whitespace-separated emails. Case-insensitive, de-duped. */
export function parseAdminEmails(value?: string | null): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const part of value.split(/[,;\s]+/)) {
    const email = part.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
  }
  return emails;
}

function adminEmailEnv(env?: AdminEmailEnv): AdminEmailEnv {
  return (
    env ?? {
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    }
  );
}

/** Merge ADMIN_EMAIL and ADMIN_EMAILS. Either may be a list. */
export function listAdminEmails(env?: AdminEmailEnv): string[] {
  const source = adminEmailEnv(env);
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const raw of [source.ADMIN_EMAIL, source.ADMIN_EMAILS]) {
    for (const email of parseAdminEmails(raw)) {
      if (seen.has(email)) continue;
      seen.add(email);
      emails.push(email);
    }
  }
  return emails;
}

export function isAdminEmail(email: string, env?: AdminEmailEnv): boolean {
  const needle = email.trim().toLowerCase();
  if (!needle) return false;
  return listAdminEmails(env).includes(needle);
}
