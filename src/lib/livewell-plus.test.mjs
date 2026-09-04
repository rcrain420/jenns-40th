import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CATCH_PHOTO_INPUT,
  FORCE_LIVEWELL_PLUS_ACTIVE_FOR_TEST,
  LIVEWELL_END_AT,
  LIVEWELL_PLUS_LOCKED,
  LIVEWELL_START_AT,
  canShowLivewellPlus,
  isTournamentLiveWindow,
  livewellPlusIsActive,
} from "./livewell-plus.ts";

const before = new Date(LIVEWELL_START_AT.getTime() - 60_000);
const during = new Date(LIVEWELL_START_AT.getTime() + 60_000);
const after = new Date(LIVEWELL_END_AT.getTime() + 60_000);

describe("Livewell + window", () => {
  it("uses the existing countdown start and Saturday end", () => {
    assert.equal(isTournamentLiveWindow(before), false);
    assert.equal(isTournamentLiveWindow(during), true);
    assert.equal(isTournamentLiveWindow(after), false);
  });

  it("test-mode flag makes + act live before the start", () => {
    assert.equal(FORCE_LIVEWELL_PLUS_ACTIVE_FOR_TEST, true);
    assert.equal(livewellPlusIsActive(before), true);
    assert.equal(livewellPlusIsActive(during), true);
  });

  it("hides + when the user cannot post", () => {
    assert.equal(
      canShowLivewellPlus({ loggedIn: false, emailVerified: false }),
      false,
    );
    assert.equal(
      canShowLivewellPlus({ loggedIn: true, emailVerified: false }),
      false,
    );
    assert.equal(
      canShowLivewellPlus({ loggedIn: true, emailVerified: true }),
      true,
    );
  });

  it("locked copy explains posting waits for lines in", () => {
    assert.match(LIVEWELL_PLUS_LOCKED.title, /live/i);
    assert.match(LIVEWELL_PLUS_LOCKED.body, /lines are in|tournament starts/i);
  });
});

describe("catch photo input", () => {
  it("accepts images and does not force the camera", () => {
    assert.equal(CATCH_PHOTO_INPUT.accept, "image/*");
    assert.equal("capture" in CATCH_PHOTO_INPUT, false);
  });
});
