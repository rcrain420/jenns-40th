import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CATCH_DELETE_UNAUTHORIZED,
  assertCanDeleteCatch,
} from "./catch-delete.ts";

describe("admin Livewell delete", () => {
  it("allows a signed-in ADMIN", () => {
    assert.deepEqual(assertCanDeleteCatch({ isAdmin: true }), { ok: true });
  });

  it("rejects guests and non-admin users", () => {
    assert.deepEqual(assertCanDeleteCatch(null), {
      ok: false,
      error: CATCH_DELETE_UNAUTHORIZED,
      status: 401,
    });
    assert.deepEqual(assertCanDeleteCatch({ isAdmin: false }), {
      ok: false,
      error: CATCH_DELETE_UNAUTHORIZED,
      status: 401,
    });
  });
});
