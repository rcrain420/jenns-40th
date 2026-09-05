/** Leaf module for Livewell admin delete authorization. Node tests import this. */

export const CATCH_DELETE_UNAUTHORIZED = "Unauthorized";

export type CatchDeleteViewer = {
  isAdmin: boolean;
} | null;

export function assertCanDeleteCatch(
  viewer: CatchDeleteViewer,
): { ok: true } | { ok: false; error: string; status: number } {
  if (!viewer?.isAdmin) {
    return { ok: false, error: CATCH_DELETE_UNAUTHORIZED, status: 401 };
  }
  return { ok: true };
}
