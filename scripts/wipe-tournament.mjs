#!/usr/bin/env node
/**
 * Empty tournament registrations so the same emails can sign up again.
 * Reads DATABASE_URL from .env in this repo (Prisma-style). Does not print secrets.
 *
 * Production Neon:
 *   npm run db:wipe -- --yes
 *
 * Local Docker/Postgres only:
 *   npm run db:wipe -- --yes --local
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import {
  TOURNAMENT_WIPE_SQL,
  assertSafeWipeTarget,
} from "../src/lib/wipe-tournament.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = value;
  }
}

function parseArgs(argv) {
  return {
    yes: argv.includes("--yes"),
    allowLocal: argv.includes("--local"),
    force: argv.includes("--force"),
  };
}

loadDotEnv(resolve(root, ".env"));
loadDotEnv(resolve(root, ".env.local"));

const args = parseArgs(process.argv.slice(2));
const url = process.env.DATABASE_URL?.trim();

if (!url) {
  console.error(
    "DATABASE_URL is missing. Put the Neon connection string in .env (Vercel → jenns-40th → Settings → Environment Variables).",
  );
  process.exit(1);
}

if (!args.yes) {
  console.error(
    "Refusing to wipe without --yes.\n  Production: npm run db:wipe -- --yes\n  Local only: npm run db:wipe -- --yes --local",
  );
  process.exit(1);
}

let target;
try {
  target = assertSafeWipeTarget(url, {
    allowLocal: args.allowLocal,
    force: args.force,
  });
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const before = await prisma.$queryRawUnsafe(
    `SELECT
      (SELECT count(*)::int FROM "Team") AS teams,
      (SELECT count(*)::int FROM "User") AS users,
      (SELECT count(*)::int FROM "Angler") AS anglers`,
  );
  console.log(
    `Wiping ${target.host}/${target.database} (teams=${before[0].teams}, users=${before[0].users}, anglers=${before[0].anglers})`,
  );
  await prisma.$executeRawUnsafe(TOURNAMENT_WIPE_SQL);
  const after = await prisma.$queryRawUnsafe(
    `SELECT
      (SELECT count(*)::int FROM "Team") AS teams,
      (SELECT count(*)::int FROM "User") AS users,
      (SELECT count(*)::int FROM "Angler") AS anglers`,
  );
  console.log(
    `Done. teams=${after[0].teams}, users=${after[0].users}, anglers=${after[0].anglers}. Same emails can register again. Leave new teams unpaid.`,
  );
} finally {
  await prisma.$disconnect();
}
