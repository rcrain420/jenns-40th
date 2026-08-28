import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TOURNAMENT_WIPE_SQL,
  TOURNAMENT_WIPE_TABLES,
  assertSafeWipeTarget,
  describeDatabaseTarget,
} from "./wipe-tournament.ts";

describe("tournament wipe target", () => {
  it("keeps schema migrations out of the truncate list", () => {
    assert.equal(TOURNAMENT_WIPE_TABLES.includes("_prisma_migrations"), false);
    assert.match(TOURNAMENT_WIPE_SQL, /TRUNCATE TABLE/);
    assert.match(TOURNAMENT_WIPE_SQL, /"User"/);
    assert.equal(TOURNAMENT_WIPE_SQL.includes("_prisma_migrations"), false);
  });

  it("recognizes Neon vs local hosts without exposing credentials", () => {
    const neon = describeDatabaseTarget(
      "postgresql://user:secret@ep-test.us-east-2.aws.neon.tech/neondb?sslmode=require",
    );
    assert.equal(neon.host, "ep-test.us-east-2.aws.neon.tech");
    assert.equal(neon.database, "neondb");
    assert.equal(neon.isNeon, true);
    assert.equal(neon.isLocal, false);

    const local = describeDatabaseTarget(
      "postgresql://postgres:postgres@127.0.0.1:5432/jenns40th",
    );
    assert.equal(local.host, "127.0.0.1");
    assert.equal(local.isLocal, true);
    assert.equal(local.isNeon, false);
  });

  it("blocks a local wipe unless --local is passed", () => {
    assert.throws(
      () =>
        assertSafeWipeTarget(
          "postgresql://postgres:postgres@localhost:5433/jenns40th",
        ),
      /local Postgres/,
    );

    const allowed = assertSafeWipeTarget(
      "postgresql://postgres:postgres@localhost:5433/jenns40th",
      { allowLocal: true },
    );
    assert.equal(allowed.isLocal, true);
  });

  it("allows Neon and requires --force for unknown remote hosts", () => {
    const neon = assertSafeWipeTarget(
      "postgresql://u:p@ep-abc.eastus2.azure.neon.tech/neondb",
    );
    assert.equal(neon.isNeon, true);

    assert.throws(
      () =>
        assertSafeWipeTarget("postgresql://u:p@db.example.com:5432/prod"),
      /Expected a Neon host/,
    );

    const forced = assertSafeWipeTarget(
      "postgresql://u:p@db.example.com:5432/prod",
      { force: true },
    );
    assert.equal(forced.host, "db.example.com");
  });
});
