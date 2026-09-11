import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isAdminEmail,
  listAdminEmails,
  parseAdminEmails,
} from "./admin-emails.ts";

describe("parseAdminEmails", () => {
  it("keeps a single email (backward compatible)", () => {
    assert.deepEqual(parseAdminEmails("you@example.com"), ["you@example.com"]);
    assert.deepEqual(parseAdminEmails("  You@Example.COM  "), [
      "you@example.com",
    ]);
  });

  it("splits on commas, semicolons, and whitespace", () => {
    assert.deepEqual(
      parseAdminEmails("a@x.com, b@y.com;c@z.com\nd@e.com"),
      ["a@x.com", "b@y.com", "c@z.com", "d@e.com"],
    );
    assert.deepEqual(parseAdminEmails("a@x.com b@y.com"), [
      "a@x.com",
      "b@y.com",
    ]);
  });

  it("drops empties and duplicates", () => {
    assert.deepEqual(parseAdminEmails(""), []);
    assert.deepEqual(parseAdminEmails("  , ; \n"), []);
    assert.deepEqual(parseAdminEmails(null), []);
    assert.deepEqual(parseAdminEmails(undefined), []);
    assert.deepEqual(parseAdminEmails("a@x.com,,A@X.com; a@x.com"), [
      "a@x.com",
    ]);
  });
});

describe("listAdminEmails", () => {
  it("merges ADMIN_EMAIL and ADMIN_EMAILS without duplicates", () => {
    assert.deepEqual(
      listAdminEmails({
        ADMIN_EMAIL: "acrain.ccg@gmail.com",
        ADMIN_EMAILS: "jennifera_1986@yahoo.com, ACRAIN.CCG@gmail.com",
      }),
      ["acrain.ccg@gmail.com", "jennifera_1986@yahoo.com"],
    );
  });

  it("works when only one of the env vars is set", () => {
    assert.deepEqual(
      listAdminEmails({ ADMIN_EMAIL: "you@example.com" }),
      ["you@example.com"],
    );
    assert.deepEqual(
      listAdminEmails({ ADMIN_EMAILS: "a@x.com; b@y.com" }),
      ["a@x.com", "b@y.com"],
    );
    assert.deepEqual(listAdminEmails({}), []);
  });
});

describe("isAdminEmail", () => {
  const env = {
    ADMIN_EMAIL: "acrain.ccg@gmail.com, jennifera_1986@yahoo.com",
  };

  it("matches any listed email, case-insensitively", () => {
    assert.equal(isAdminEmail("acrain.ccg@gmail.com", env), true);
    assert.equal(isAdminEmail("  Jennifera_1986@Yahoo.com  ", env), true);
    assert.equal(isAdminEmail("guest@example.com", env), false);
    assert.equal(isAdminEmail("jenifera_1986@yahoo.com", env), false);
  });

  it("is false when no admin emails are configured", () => {
    assert.equal(isAdminEmail("you@example.com", {}), false);
    assert.equal(isAdminEmail("", env), false);
  });
});
