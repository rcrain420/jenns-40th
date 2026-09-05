/** Leaf-safe: decide whether saving a captain email should send mail. */
export function shouldSendCaptainInvite(input: {
  email: string | null | undefined;
  alreadyOnThisBoat: boolean;
  onAnotherTeam: boolean;
}): { send: boolean; skipReason?: "empty" | "joined" | "other-team" } {
  const email = input.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return { send: false, skipReason: "empty" };
  }
  if (input.onAnotherTeam) {
    return { send: false, skipReason: "other-team" };
  }
  if (input.alreadyOnThisBoat) {
    return { send: false, skipReason: "joined" };
  }
  return { send: true };
}
