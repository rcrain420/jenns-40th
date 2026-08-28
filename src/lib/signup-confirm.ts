/**
 * Confirm-account mail is leftover after join grants Livewell access.
 * Skip it when join already verified the account, or when the next hop
 * is Join the boat (which verifies immediately).
 */
export function shouldSendSignupConfirmEmail(input: {
  emailVerified: boolean;
  next?: string | null;
}): boolean {
  if (input.emailVerified) return false;
  if (isJoinNextPath(input.next)) return false;
  return true;
}

export function isJoinNextPath(next?: string | null): boolean {
  if (!next) return false;
  const path = next.split("?")[0].split("#")[0];
  return path === "/join" || path.startsWith("/join/");
}
