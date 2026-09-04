import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  avatarImageSrc,
  initialsFromName,
  isAllowedAvatarHost,
  sanitizeAvatarUrl,
} from "./avatar.ts";

describe("sanitizeAvatarUrl", () => {
  it("keeps a Google https picture URL", () => {
    const src =
      "https://lh3.googleusercontent.com/a/ACg8ocExamplePhoto=s96-c";
    assert.equal(sanitizeAvatarUrl(src), src);
  });

  it("rejects javascript, http, and junk", () => {
    assert.equal(sanitizeAvatarUrl("javascript:alert(1)"), null);
    assert.equal(sanitizeAvatarUrl("http://lh3.googleusercontent.com/a/x"), null);
    assert.equal(sanitizeAvatarUrl("not a url"), null);
    assert.equal(sanitizeAvatarUrl(""), null);
    assert.equal(sanitizeAvatarUrl(null), null);
  });
});

describe("avatar host gate", () => {
  it("allows Google photo hosts and skips others for next/image", () => {
    assert.equal(
      isAllowedAvatarHost("https://lh3.googleusercontent.com/a/photo"),
      true,
    );
    assert.equal(
      isAllowedAvatarHost(
        "https://lh3.googleusercontent.com/a/ACg8ocExamplePhoto=s96-c",
      ),
      true,
    );
    assert.equal(isAllowedAvatarHost("https://evil.example/photo.png"), false);
    assert.equal(
      avatarImageSrc("https://lh3.googleusercontent.com/a/photo"),
      "https://lh3.googleusercontent.com/a/photo",
    );
    assert.equal(avatarImageSrc("https://evil.example/photo.png"), null);
  });
});

describe("initialsFromName", () => {
  it("uses first and last initials, or the first letter of a single name", () => {
    assert.equal(initialsFromName("Aaron Crain"), "AC");
    assert.equal(initialsFromName("Aaron"), "A");
    assert.equal(initialsFromName("  "), "?");
  });
});
