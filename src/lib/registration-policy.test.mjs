import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  REGISTRATION_CLOSES_AT,
  isRegistrationOpen,
} from "./config.ts";
import {
  ADMIN_EXCEPTION_NOTE,
  NO_WALKUP_POLICY,
  PUBLIC_REGISTRATION_DATE_CLOSED_ERROR,
  PUBLIC_REGISTRATION_FULL_ERROR,
  REGISTRATION_CLOSED_TITLE,
  REGISTRATION_DEADLINE_LABEL,
  publicCreateBlockedReason,
  publicRegistrationClosedCopy,
  publicRegistrationDeadlineNote,
} from "./registration-policy.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

const COPY_SURFACES = [
  "README.md",
  "docs/tournament-rules.md",
  "src/app/page.tsx",
  "src/app/rules/page.tsx",
  "src/app/register/page.tsx",
  "src/app/pots/page.tsx",
  "src/app/kids/page.tsx",
  "src/app/team/page.tsx",
  "src/app/guides/page.tsx",
  "src/app/admin/teams/new/page.tsx",
  "src/app/api/admin/teams/route.ts",
  "src/components/RegisterForm.tsx",
  "src/components/RegistrationClosedNotice.tsx",
  "src/components/GuideSearch.tsx",
  "src/lib/registration.ts",
  "src/lib/registration-policy.ts",
];

/** Phrases that invite day-of / marina signup. Policy bans may mention walk-ups. */
const INVITING_WALKUP = [
  /walk-?ups? (are|is) (welcome|available|open|allowed)/i,
  /register at the marina/i,
  /register (on|at) (friday|saturday|tournament day|the dock)/i,
  /day-of registration (is|will|opens)/i,
  /on-site registration/i,
  /sign up at the (marina|dock)/i,
  /walk-?up (sign-?ups?|entries?) (are|is|welcome)/i,
  /contact the organizers if you need help/i,
];

describe("registration cutoff", () => {
  it("stays open until end of day October 1, 2026 America/Chicago", () => {
    assert.equal(REGISTRATION_DEADLINE_LABEL, "October 1, 2026");
    assert.equal(
      REGISTRATION_CLOSES_AT.toISOString(),
      "2026-10-02T05:00:00.000Z",
    );
    assert.equal(
      isRegistrationOpen(new Date(REGISTRATION_CLOSES_AT.getTime() - 1)),
      true,
    );
    assert.equal(isRegistrationOpen(REGISTRATION_CLOSES_AT), false);
    assert.equal(
      isRegistrationOpen(new Date(REGISTRATION_CLOSES_AT.getTime() + 1)),
      false,
    );
  });
});

describe("public create gate", () => {
  it("rejects after the date cutoff and when the field is full", () => {
    assert.equal(
      publicCreateBlockedReason({ openByDate: true, openByCapacity: true }),
      null,
    );
    assert.equal(
      publicCreateBlockedReason({ openByDate: false, openByCapacity: true }),
      PUBLIC_REGISTRATION_DATE_CLOSED_ERROR,
    );
    assert.equal(
      publicCreateBlockedReason({ openByDate: true, openByCapacity: false }),
      PUBLIC_REGISTRATION_FULL_ERROR,
    );
    assert.match(PUBLIC_REGISTRATION_DATE_CLOSED_ERROR, /October 1, 2026/);
    assert.equal(/walk-?up/i.test(PUBLIC_REGISTRATION_DATE_CLOSED_ERROR), false);
  });
});

describe("closed registration copy", () => {
  it("names the October 1 end and bans walk-ups without a public exception CTA", () => {
    const dateClosed = publicRegistrationClosedCopy({
      openByDate: false,
      openByCapacity: true,
    });
    const full = publicRegistrationClosedCopy({
      openByDate: true,
      openByCapacity: false,
    });
    const both = publicRegistrationClosedCopy({
      openByDate: false,
      openByCapacity: false,
    });

    assert.equal(dateClosed.title, REGISTRATION_CLOSED_TITLE);
    assert.match(dateClosed.body, /October 1, 2026/);
    assert.match(dateClosed.body, /no walk-ups/i);
    assert.match(dateClosed.body, /marina/i);
    assert.equal(/contact the organizers/i.test(dateClosed.body), false);
    assert.equal(/request (an )?exception/i.test(dateClosed.body), false);
    assert.equal(/waitlist/i.test(dateClosed.body), false);

    assert.match(full.body, /capacity/i);
    assert.match(full.body, /no walk-ups/i);
    assert.match(both.body, /October 1, 2026/);
    assert.match(both.body, /full/i);
    assert.match(NO_WALKUP_POLICY, /no walk-ups/i);

    const closedNote = publicRegistrationDeadlineNote(false);
    assert.match(closedNote, /ended October 1, 2026/);
    assert.match(closedNote, /no walk-ups/i);
    const openNote = publicRegistrationDeadlineNote(true);
    assert.match(openNote, /registered by October 1, 2026/);
    assert.match(openNote, /no walk-ups/i);
  });

  it("keeps admin late adds as the only exception path", () => {
    assert.match(ADMIN_EXCEPTION_NOTE, /exception path/i);
    assert.match(ADMIN_EXCEPTION_NOTE, /October 1, 2026/);
    assert.match(ADMIN_EXCEPTION_NOTE, /no walk-ups/i);
    assert.match(ADMIN_EXCEPTION_NOTE, /soft cap/i);
  });
});

describe("no leftover walk-up invitations", () => {
  it("does not invite marina or day-of signup on public surfaces", () => {
    for (const relative of COPY_SURFACES) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      for (const pattern of INVITING_WALKUP) {
        assert.equal(
          pattern.test(text),
          false,
          `${relative} still matches ${pattern}`,
        );
      }
    }
  });

  it("states the October 1 deadline and no walk-ups in the rules", () => {
    for (const relative of [
      "docs/tournament-rules.md",
      "src/app/rules/page.tsx",
    ]) {
      const text = readFileSync(join(ROOT, relative), "utf8");
      assert.match(text, /October 1, 2026/);
      assert.match(text, /no walk-up/i);
      assert.match(text, /marina/i);
      assert.match(text, /organizers approve/i);
      assert.match(text, /registration-deadline|Register by October 1/);
    }
  });

  it("keeps admin create off the public registration gate", () => {
    const adminRoute = readFileSync(
      join(ROOT, "src/app/api/admin/teams/route.ts"),
      "utf8",
    );
    assert.equal(/isRegistrationOpen\s*\(/.test(adminRoute), false);
    assert.equal(/getRegistrationAvailability\s*\(/.test(adminRoute), false);
    assert.match(adminRoute, /Exception path/);
    assert.match(adminRoute, /soft cap/);

    const publicCreate = readFileSync(
      join(ROOT, "src/lib/registration.ts"),
      "utf8",
    );
    assert.match(publicCreate, /publicCreateBlockedReason/);
  });
});
