export const TOURNAMENT_WIPE_TABLES = [
  "CatchComment",
  "FishCatch",
  "EmailToken",
  "TeamMember",
  "Angler",
  "Team",
  "User",
] as const;

export const TOURNAMENT_WIPE_SQL = `TRUNCATE TABLE ${TOURNAMENT_WIPE_TABLES.map(
  (name) => `"${name}"`,
).join(", ")} RESTART IDENTITY CASCADE`;

export type DatabaseTarget = {
  host: string;
  database: string;
  isLocal: boolean;
  isNeon: boolean;
};

export function describeDatabaseTarget(url: string): DatabaseTarget {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("DATABASE_URL is not a valid connection string.");
  }

  const host = (parsed.hostname || "").toLowerCase();
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, "")).split(
    "/",
  )[0];
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0";
  const isNeon = host === "neon.tech" || host.endsWith(".neon.tech");

  return { host, database, isLocal, isNeon };
}

export function assertSafeWipeTarget(
  url: string,
  opts: { allowLocal?: boolean; force?: boolean } = {},
): DatabaseTarget {
  const target = describeDatabaseTarget(url);

  if (target.isLocal && !opts.allowLocal) {
    throw new Error(
      `Refusing to wipe ${target.host}/${target.database}. That is local Postgres. Use a Neon DATABASE_URL (host ends with neon.tech), or pass --local only if you meant to empty this machine.`,
    );
  }

  if (!target.isLocal && !target.isNeon && !opts.force) {
    throw new Error(
      `Refusing to wipe ${target.host}/${target.database}. Expected a Neon host (*.neon.tech). Pass --force if this really is officialishfishingtournament.com production.`,
    );
  }

  return target;
}
