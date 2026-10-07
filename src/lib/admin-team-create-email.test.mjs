import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(relative) {
  return readFileSync(join(ROOT, relative), "utf8");
}

function callBody(source, name) {
  const start = source.indexOf(`${name}(`);
  assert.ok(start >= 0, `${name} is missing`);
  const end = source.indexOf("});", start);
  assert.ok(end > start, `${name} call is missing a closing });`);
  return source.slice(start, end);
}

describe("admin late-add registration email", () => {
  it("sends confirmation and angler join mail with the public register inputs", () => {
    const admin = read("src/app/api/admin/teams/route.ts");
    const register = read("src/app/api/register/route.ts");
    const post = admin.slice(admin.indexOf("export async function POST"));

    const fields = [
      "teamId:",
      "teamName:",
      "amountDueCents:",
      "registrantEmail:",
      "paidSeatCount: paidEntrySeatCount(",
      "youthSeatCount:",
      ".filter((a) => a.isYouth).length",
      "entryKind:",
    ];
    const adminCall = callBody(post, "sendRegistrationConfirmation");
    const publicCall = callBody(register, "sendRegistrationConfirmation");
    for (const field of fields) {
      assert.ok(adminCall.includes(field), `admin confirmation missing ${field}`);
      assert.ok(
        publicCall.includes(field),
        `public confirmation missing ${field}`,
      );
    }

    assert.match(post, /if \(team\.registrantEmail\.trim\(\)\)/);
    assert.match(post, /sendJoinEmailsForRegisteredAnglers\(/);
    assert.match(post, /sendCaptainJoinInvite\(/);
    assert.match(post, /\[admin\] confirmation email failed/);
    assert.match(post, /\[admin\] confirmation email not delivered/);
    assert.match(post, /\[admin\] join invites failed/);
    assert.match(post, /\[admin\] captain invite failed/);

    const confirmCatch = post.indexOf("[admin] confirmation email failed");
    const joinCall = post.indexOf("sendJoinEmailsForRegisteredAnglers(");
    const captainCall = post.indexOf("sendCaptainJoinInvite(");
    const response = post.indexOf("confirmationEmailSent,");
    assert.ok(
      confirmCatch < joinCall &&
        joinCall < captainCall &&
        captainCall < response,
    );

    assert.equal(/isRegistrationOpen\s*\(/.test(admin), false);
    assert.equal(/getRegistrationAvailability\s*\(/.test(admin), false);
  });

  it("leaves admin team edits on the captain-invite-only path", () => {
    const patch = read("src/app/api/admin/teams/[id]/route.ts");
    assert.equal(patch.includes("sendRegistrationConfirmation"), false);
    assert.equal(patch.includes("sendJoinEmailsForRegisteredAnglers"), false);
    assert.match(patch, /sendCaptainJoinInvite\(/);
  });
});
