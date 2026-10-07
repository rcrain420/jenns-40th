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

  it("sends join invites for newly added anglers and skips registration confirmation", () => {
    const patch = read("src/app/api/admin/teams/[id]/route.ts");
    const update = patch.slice(patch.indexOf("export async function PATCH"));

    assert.equal(update.includes("sendRegistrationConfirmation"), false);
    assert.match(update, /anglers:\s*\{\s*select:\s*\{\s*email:\s*true\s*\}\s*\}/);
    assert.match(update, /nextEmail !== prevEmail/);
    assert.match(update, /sendCaptainJoinInvite\(/);
    assert.match(update, /\[admin\] captain invite failed/);
    assert.match(update, /\[admin\] join invites failed/);

    const selector = callBody(update, "anglersNewlyAddedForJoinInvite");
    assert.match(selector, /previous:\s*previous\.anglers/);
    assert.match(selector, /next:\s*team\.anglers/);
    assert.match(selector, /joinedEmails:/);
    assert.match(
      selector,
      /previous\.members\.map\(\(member\) => member\.user\.email\)/,
    );

    const joinCall = callBody(update, "sendJoinEmailsForRegisteredAnglers");
    assert.match(joinCall, /anglers:\s*newlyAdded/);
    assert.equal(joinCall.includes("team.anglers"), false);

    const captainCall = update.indexOf("sendCaptainJoinInvite(");
    const joinCallAt = update.indexOf("sendJoinEmailsForRegisteredAnglers(");
    const joinCatch = update.indexOf("[admin] join invites failed");
    const response = update.lastIndexOf("return NextResponse.json({ team })");
    assert.ok(
      captainCall > 0 &&
        captainCall < joinCallAt &&
        joinCallAt < joinCatch &&
        joinCatch < response,
    );
  });
});
