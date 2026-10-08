import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { chicagoParts } from "./chicago-time.ts";
import {
  REGISTRATION_CLOSES_AT,
  isRegistrationOpen,
} from "./config.ts";
import {
  ADMIN_EXCEPTION_NOTE,
  NO_WALKUP_POLICY,
  PUBLIC_REGISTRATION_DATE_CLOSED_ERROR,
  PUBLIC_REGISTRATION_ENDED_PHRASE,
  PUBLIC_REGISTRATION_FULL_ERROR,
  PUBLIC_REGISTRATION_OPEN_NOTE,
  REGISTRATION_CLOSED_TITLE,
  REGISTRATION_DEADLINE_FULL,
  REGISTRATION_DEADLINE_LABEL,
  REGISTRATION_DEADLINE_MONTH_DAY,
  REGISTRATION_DEADLINE_WEEKDAY,
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
  "docs/rowride-rules.md",
  "src/app/team/page.tsx",
  "src/app/guides/page.tsx",
  "src/app/register/youth/page.tsx",
  "src/app/admin/teams/new/page.tsx",
  "src/app/api/admin/teams/route.ts",
  "src/components/RegisterForm.tsx",
  "src/components/RegistrationClosedNotice.tsx",
  "src/components/YouthLandRegisterForm.tsx",
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
  it("stays open through Thursday, October 8, 2026 and closes at midnight Central", () => {
    assert.equal(
      REGISTRATION_CLOSES_AT.toISOString(),
      "2026-10-09T05:00:00.000Z",
    );
    const closes = chicagoParts(REGISTRATION_CLOSES_AT);
    assert.equal(closes.weekday, "Friday");
    assert.deepEqual(
      {
        year: closes.year,
        month: closes.month,
        day: closes.day,
        hour: closes.hour,
        minute: closes.minute,
        second: closes.second,
      },
      { year: 2026, month: 10, day: 9, hour: 0, minute: 0, second: 0 },
    );
    const stillThursday = chicagoParts(
      new Date(REGISTRATION_CLOSES_AT.getTime() - 1),
    );
    assert.equal(stillThursday.weekday, "Thursday");
    assert.equal(stillThursday.day, 8);
    assert.equal(stillThursday.month, 10);
    assert.equal(stillThursday.year, 2026);
    assert.equal(
      isRegistrationOpen(new Date(REGISTRATION_CLOSES_AT.getTime() - 1)),
      true,
    );
    assert.equal(isRegistrationOpen(REGISTRATION_CLOSES_AT), false);
    assert.equal(
      isRegistrationOpen(new Date(REGISTRATION_CLOSES_AT.getTime() + 1)),
      false,
    );
    // 8:00 PM CT on Wednesday, October 7 — the reopen window Aaron asked for.
    const wednesdayEvening = new Date("2026-10-08T01:00:00.000Z");
    assert.equal(isRegistrationOpen(wednesdayEvening), true);
    const lateThursday = new Date("2026-10-09T04:59:00.000Z");
    assert.equal(isRegistrationOpen(lateThursday), true);
  });

  it("derives cutoff labels from the last open Chicago calendar day", () => {
    assert.equal(REGISTRATION_DEADLINE_WEEKDAY, "Thursday, October 8");
    assert.equal(REGISTRATION_DEADLINE_MONTH_DAY, "October 8");
    assert.equal(REGISTRATION_DEADLINE_LABEL, "October 8, 2026");
    assert.equal(REGISTRATION_DEADLINE_FULL, "Thursday, October 8, 2026");
    assert.match(
      PUBLIC_REGISTRATION_OPEN_NOTE,
      /^Registration closes at midnight Thursday, October 8 \(Central time\)\.$/,
    );
    assert.equal(
      PUBLIC_REGISTRATION_ENDED_PHRASE,
      "Public registration ended Thursday, October 8",
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
    assert.match(
      PUBLIC_REGISTRATION_DATE_CLOSED_ERROR,
      /closed on Thursday, October 8/,
    );
    assert.equal(/walk-?up/i.test(PUBLIC_REGISTRATION_DATE_CLOSED_ERROR), false);
  });
});

describe("closed registration copy", () => {
  it("names the Thursday, October 8 end and bans walk-ups without a public exception CTA", () => {
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
    assert.match(dateClosed.body, /ended Thursday, October 8/);
    assert.match(dateClosed.body, /no walk-ups/i);
    assert.match(dateClosed.body, /marina/i);
    assert.equal(/contact the organizers/i.test(dateClosed.body), false);
    assert.equal(/request (an )?exception/i.test(dateClosed.body), false);
    assert.equal(/waitlist/i.test(dateClosed.body), false);

    assert.match(full.body, /capacity/i);
    assert.match(full.body, /no walk-ups/i);
    assert.match(both.body, /ended Thursday, October 8/);
    assert.match(both.body, /full/i);
    assert.match(NO_WALKUP_POLICY, /no walk-ups/i);

    const closedNote = publicRegistrationDeadlineNote(false);
    assert.match(closedNote, /ended Thursday, October 8/);
    assert.match(closedNote, /no walk-ups/i);
    assert.match(closedNote, /tournament weekend/);
    const openNote = publicRegistrationDeadlineNote(true);
    assert.match(
      openNote,
      /Registration closes at midnight Thursday, October 8/,
    );
    assert.match(openNote, /Central time/);
    assert.match(openNote, /no walk-ups/i);
    assert.match(openNote, /tournament weekend/);
  });

  it("keeps admin late adds as the only exception path", () => {
    assert.match(ADMIN_EXCEPTION_NOTE, /exception path/i);
    assert.match(ADMIN_EXCEPTION_NOTE, /midnight Thursday, October 8, 2026/);
    assert.match(ADMIN_EXCEPTION_NOTE, /Central time/);
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

  it("states the October 8 deadline and no walk-ups in the rules", () => {
    const rulesPage = readFileSync(join(ROOT, "src/app/rules/page.tsx"), "utf8");
    assert.match(rulesPage, /REGISTRATION_DEADLINE_FULL/);
    assert.match(rulesPage, /REGISTRATION_DEADLINE_WEEKDAY/);
    assert.match(rulesPage, /REGISTRATION_DEADLINE_MONTH_DAY/);
    assert.match(rulesPage, /NO_WALKUP_POLICY/);
    assert.equal(/October 1(?!\d)/.test(rulesPage), false);
    assert.match(rulesPage, /no walk-up/i);
    assert.match(rulesPage, /marina/i);
    assert.match(rulesPage, /organizers approve/i);
    assert.match(rulesPage, /registration-deadline/);

    const tournamentRules = readFileSync(
      join(ROOT, "docs/tournament-rules.md"),
      "utf8",
    );
    assert.match(tournamentRules, new RegExp(REGISTRATION_DEADLINE_FULL));
    assert.match(tournamentRules, /midnight \*{0,2}Thursday, October 8/i);
    assert.match(tournamentRules, /Central time/);
    assert.match(tournamentRules, /no walk-up/i);
    assert.match(tournamentRules, /marina/i);
    assert.match(tournamentRules, /organizers approve/i);
    assert.match(tournamentRules, /Register by October 8/);
    assert.equal(/October 1(?!\d)/.test(tournamentRules), false);

    const rowrideRules = readFileSync(
      join(ROOT, "docs/rowride-rules.md"),
      "utf8",
    );
    assert.match(
      rowrideRules,
      /closes at midnight Thursday, October 8 \(Central time\)/,
    );
    assert.match(rowrideRules, /no walk-ups/i);
    assert.equal(/October 1(?!\d)/.test(rowrideRules), false);

    const readme = readFileSync(join(ROOT, "README.md"), "utf8");
    assert.match(readme, new RegExp(REGISTRATION_DEADLINE_FULL));
    assert.match(readme, /Central time/);
    assert.equal(/Oct 1, 2026/.test(readme), false);

    const kidsPage = readFileSync(join(ROOT, "src/app/kids/page.tsx"), "utf8");
    assert.match(kidsPage, /publicRegistrationDeadlineNote\(availability\.isLandOpen\)/);
    assert.equal(/October 1(?!\d)/.test(kidsPage), false);
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
    const registerRoute = readFileSync(
      join(ROOT, "src/app/api/register/route.ts"),
      "utf8",
    );
    assert.match(registerRoute, /isRegistrationOpen\(\)/);
    assert.match(registerRoute, /PUBLIC_REGISTRATION_DATE_CLOSED_ERROR/);

    const youthPage = readFileSync(
      join(ROOT, "src/app/register/youth/page.tsx"),
      "utf8",
    );
    assert.ok(
      youthPage.indexOf("isLandOpen") < youthPage.indexOf("view === \"auth\""),
      "RowRide page must show the closed state before the signup form",
    );

    assert.match(publicCreate, /publicCreateBlockedReason/);
    assert.match(publicCreate, /isLandOpen/);
    assert.match(publicCreate, /PUBLIC_REGISTRATION_DATE_CLOSED_ERROR/);
    assert.equal(
      /publicCreateBlockedReason\(availability\);\s*if \(blocked\)/.test(
        publicCreate.slice(publicCreate.indexOf("createYouthLandRegistration")),
      ),
      false,
      "land-only create must stay date-gated, not boat-capacity gated",
    );
  });
});
