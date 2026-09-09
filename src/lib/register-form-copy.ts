/** Shared by default and youth-emphasis register. Keep it short. Leaf-safe for Node tests. */

export function anglersSectionHelp({
  minAnglers,
  maxAnglers,
  feeDollars,
}: {
  minAnglers: number;
  maxAnglers: number;
  feeDollars: number;
}): string {
  return (
    `${minAnglers}–${maxAnglers} fishing anglers, kids included — one name locks the boat; add the rest later from My team. ` +
    `Name, shirt size, and 17-or-under are required; email is optional. ` +
    `Youth seats count toward the ${maxAnglers} and do not change the $${feeDollars} boat entry — they skip the create-account invite; a parent’s email is fine. ` +
    `Youth fish are out of the main stringer, in on paid side pots and RowRide. ` +
    `Adult emails get Join the boat; name-only adults join from the invite link. ` +
    `Captain is optional, not an angler slot, and 18+ if you add one.`
  );
}
