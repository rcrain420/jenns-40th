import { FEE_PER_ANGLER_CENTS, MAX_ANGLERS, MIN_ANGLERS } from "./config";

/** Shared by default and youth-emphasis register. Keep it short. */
export function anglersSectionHelp(): string {
  const fee = FEE_PER_ANGLER_CENTS / 100;
  return (
    `${MIN_ANGLERS}–${MAX_ANGLERS} fishing anglers, kids included — need two names to lock the boat; add the rest later from My team. ` +
    `Name and 17-or-under are required; email is optional. ` +
    `Youth seats are free (no $${fee}) and skip the create-account invite — a parent’s email is fine. ` +
    `Adult emails get Join the boat; name-only adults can still join from the shared invite link after they create an account. ` +
    `Captain is optional, not an angler slot, and 18+ if you add one.`
  );
}
