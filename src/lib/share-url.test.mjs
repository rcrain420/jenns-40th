import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isUsableShareUrl, resolveShareUrl } from "./share-url.ts";
import { publicAbsoluteUrl } from "./safe-path.ts";

describe("shareable invite URLs", () => {
  it("keeps an absolute http(s) URL", () => {
    const url =
      "https://officialishfishingtournament.com/join?token=abc";
    assert.equal(resolveShareUrl(url, "https://example.com"), url);
    assert.equal(isUsableShareUrl(url), true);
  });

  it("resolves a relative path against the page origin", () => {
    assert.equal(
      resolveShareUrl("/j/AbCdEfGhIjKl", "https://officialishfishingtournament.com"),
      "https://officialishfishingtournament.com/j/AbCdEfGhIjKl",
    );
    assert.equal(isUsableShareUrl("/j/AbCdEfGhIjKl"), false);
    assert.equal(
      resolveShareUrl("/join?token=abc", "https://officialishfishingtournament.com"),
      "https://officialishfishingtournament.com/join?token=abc",
    );
  });

  it("builds a public absolute URL from a path", () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://officialishfishingtournament.com";
    assert.equal(
      publicAbsoluteUrl("/unlock?token=xyz"),
      "https://officialishfishingtournament.com/unlock?token=xyz",
    );
    if (prev === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prev;
  });
});
