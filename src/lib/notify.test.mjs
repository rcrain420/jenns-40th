import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  catchAlertHeadline,
  catchAlertHref,
  commentAlertHeadline,
  commentAlertHref,
  commentSnippet,
  isOwnCommentNotification,
  mergeBellNotifications,
  toCatchBellNotification,
  toCommentBellNotification,
} from "./notify.ts";

describe("comment snippets", () => {
  it("trims and collapses whitespace", () => {
    assert.equal(commentSnippet("  nice   fish  "), "nice fish");
  });

  it("truncates long comments with an ellipsis", () => {
    const long = "x".repeat(120);
    const snippet = commentSnippet(long, 80);
    assert.equal(snippet.endsWith("…"), true);
    assert.ok(snippet.length <= 80);
  });
});

describe("comment alert copy", () => {
  it("names the commenter and the catch", () => {
    const headline = commentAlertHeadline({
      commentId: "cmt_1",
      catchId: "catch_1",
      breed: "Redfish",
      commenterName: "Sam",
      catchOwnerName: "Alex",
      snippet: "Nice fish!",
    });
    assert.match(headline, /Sam/);
    assert.match(headline, /Alex|Redfish|Nice fish/);
  });

  it("deep-links to the Livewell catch card", () => {
    assert.equal(commentAlertHref("fish99"), "/catches#catch-fish99");
    assert.equal(catchAlertHref("fish99"), "/catches#catch-fish99");
  });
});

describe("self-notification filter", () => {
  it("hides the comment from its author", () => {
    assert.equal(isOwnCommentNotification("user-a", "user-a"), true);
  });

  it("shows the comment to every other account", () => {
    assert.equal(isOwnCommentNotification("user-a", "user-b"), false);
    assert.equal(isOwnCommentNotification("user-a", null), false);
    assert.equal(isOwnCommentNotification(null, "user-b"), false);
  });
});

describe("bell feed merge", () => {
  it("sorts newest first and respects the limit", () => {
    const olderCatch = toCatchBellNotification({
      catchId: "catch-old",
      breed: "Trout",
      lengthInches: 18,
      weightLbs: 2,
      anglerName: "Alex",
      teamName: "Bay Dogs",
      createdAt: "2026-09-05T10:00:00.000Z",
    });
    const comment = toCommentBellNotification({
      commentId: "cmt-new",
      catchId: "catch-old",
      breed: "Trout",
      commenterName: "Sam",
      catchOwnerName: "Alex",
      body: "That slot is a joke.",
      createdAt: "2026-09-05T11:00:00.000Z",
    });
    const newerCatch = toCatchBellNotification({
      catchId: "catch-new",
      breed: "Redfish",
      lengthInches: 28,
      weightLbs: 7,
      anglerName: "Pat",
      teamName: "Pat",
      createdAt: "2026-09-05T12:00:00.000Z",
    });

    const merged = mergeBellNotifications(
      [olderCatch, comment, newerCatch],
      2,
    );
    assert.deepEqual(
      merged.map((n) => n.id),
      ["catch:catch-new", "comment:cmt-new"],
    );
    assert.equal(merged[1].type, "comment");
    assert.equal(merged[1].href, "/catches#catch-catch-old");
    assert.match(merged[1].title, /Sam commented/);
  });

  it("keeps catch alert headlines stable", () => {
    const payload = {
      catchId: "abc",
      breed: "Flounder",
      lengthInches: 15,
      weightLbs: 1.5,
      anglerName: "Alex",
      teamName: "Bay Dogs",
    };
    assert.equal(catchAlertHeadline(payload), catchAlertHeadline(payload));
  });
});
