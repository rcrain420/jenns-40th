import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LINE_GUESS_DONATE_URL,
  LINE_GUESS_METHOD,
  formatGuessFeet,
  formatLineGuessTime,
  lineGuessEntryPath,
  lineGuessListPath,
} from "./line-guess-format.ts";
import {
  clearLineGuessPinFailures,
  lineGuessPin,
  lineGuessPinAttemptAllowed,
  lineGuessTokenMatches,
  parseLineGuessEntry,
  recordLineGuessPinFailure,
} from "./line-guess.ts";

describe("line guess paths and donate link", () => {
  it("uses a secret /line path and the Cancer Care Alliance campaign", () => {
    assert.equal(lineGuessEntryPath("abc"), "/line/abc");
    assert.equal(lineGuessListPath("abc"), "/line/abc/list");
    assert.equal(lineGuessEntryPath("abc").includes("/admin"), false);
    assert.equal(lineGuessEntryPath("abc").includes("/guess"), false);
    assert.equal(
      LINE_GUESS_DONATE_URL,
      "https://impact.ccalliance.org/Fightlikearedfish",
    );
    assert.equal(LINE_GUESS_DONATE_URL.toLowerCase().includes("venmo"), false);
    assert.equal(LINE_GUESS_METHOD, "CCA");
  });

  it("formats feet and Chicago time", () => {
    assert.equal(formatGuessFeet(250), "250 ft");
    assert.equal(formatGuessFeet(247.5), "247.5 ft");
    assert.equal(formatGuessFeet(10.1), "10.1 ft");
    const label = formatLineGuessTime(new Date("2026-10-09T20:04:00.000Z"));
    assert.match(label, /Oct/);
    assert.match(label, /9/);
    assert.match(label, /3:04/);
    assert.match(label, /PM/);
    assert.match(label, /CT$/);
  });
});

describe("line guess token and pin", () => {
  it("accepts only a long configured token", () => {
    const prev = process.env.LINE_GUESS_PATH_TOKEN;
    process.env.LINE_GUESS_PATH_TOKEN = "a".repeat(48);
    try {
      assert.equal(lineGuessTokenMatches("a".repeat(48)), true);
      assert.equal(lineGuessTokenMatches("a".repeat(47)), false);
      assert.equal(lineGuessTokenMatches("guess"), false);
      assert.equal(lineGuessTokenMatches(""), false);
    } finally {
      if (prev === undefined) delete process.env.LINE_GUESS_PATH_TOKEN;
      else process.env.LINE_GUESS_PATH_TOKEN = prev;
    }
  });

  it("rejects a short or missing path token", () => {
    const prev = process.env.LINE_GUESS_PATH_TOKEN;
    process.env.LINE_GUESS_PATH_TOKEN = "short-token";
    try {
      assert.equal(lineGuessTokenMatches("short-token"), false);
    } finally {
      if (prev === undefined) delete process.env.LINE_GUESS_PATH_TOKEN;
      else process.env.LINE_GUESS_PATH_TOKEN = prev;
    }
  });

  it("requires a 4–8 digit pin", () => {
    const prev = process.env.LINE_GUESS_PIN;
    process.env.LINE_GUESS_PIN = "4040";
    try {
      assert.equal(lineGuessPin(), "4040");
    } finally {
      process.env.LINE_GUESS_PIN = "nope";
      assert.equal(lineGuessPin(), null);
      if (prev === undefined) delete process.env.LINE_GUESS_PIN;
      else process.env.LINE_GUESS_PIN = prev;
    }
  });
});

describe("line guess entry parser", () => {
  it("accepts a name, decimal feet, and the paid checkbox", () => {
    const parsed = parseLineGuessEntry({
      name: "  Ada   Lovelace ",
      guessFeet: "247.5",
      paidClaimed: true,
      note: "  for Jenn  ",
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.data.name, "Ada Lovelace");
    assert.equal(parsed.data.guessFeet, 247.5);
    assert.equal(parsed.data.paidClaimed, true);
    assert.equal(parsed.data.note, "for Jenn");
  });

  it("rejects a missing donation check, zero, and junk feet", () => {
    const unpaid = parseLineGuessEntry({
      name: "Ada",
      guessFeet: 100,
      paidClaimed: false,
    });
    assert.equal(unpaid.ok, false);

    const zero = parseLineGuessEntry({
      name: "Ada",
      guessFeet: 0,
      paidClaimed: true,
    });
    assert.equal(zero.ok, false);

    const junk = parseLineGuessEntry({
      name: "Ada",
      guessFeet: "1e3",
      paidClaimed: true,
    });
    assert.equal(junk.ok, false);

    const venmo = parseLineGuessEntry({
      name: "Ada",
      guessFeet: 12,
      paidClaimed: true,
      method: "VENMO",
    });
    assert.equal(venmo.ok, true);
    if (venmo.ok) {
      assert.equal("method" in venmo.data, false);
    }
  });
});

describe("line guess pin attempts", () => {
  it("locks after eight failures inside the window", () => {
    const key = "pin-test-lock";
    clearLineGuessPinFailures(key);
    const start = 1_700_000_000_000;
    for (let i = 0; i < 7; i += 1) {
      recordLineGuessPinFailure(key, start);
      assert.equal(lineGuessPinAttemptAllowed(key, start + 1), true);
    }
    recordLineGuessPinFailure(key, start + 2);
    assert.equal(lineGuessPinAttemptAllowed(key, start + 3), false);
    assert.equal(lineGuessPinAttemptAllowed(key, start + 6 * 60 * 1000), true);
    clearLineGuessPinFailures(key);
  });
});
