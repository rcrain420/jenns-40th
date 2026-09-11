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
    `${minAnglers}–${maxAnglers} adult seats — kids do not take one. ` +
    `One adult name locks the boat; add the rest later from My team. ` +
    `Name, shirt size, and 17-or-under are required; email is optional. ` +
    `Youth may join if the captain or guide allows it (guides often prefer no more than four anglers — ask first) or enter RowRide from land. ` +
    `They do not change the $${feeDollars} boat entry and skip the create-account invite; a parent’s email is fine. ` +
    `Youth fish are out of the main stringer, in on paid side pots and RowRide. ` +
    `Adult emails get Join the boat; name-only adults join from the invite link. ` +
    `Captain is optional, not an angler slot, and 18+ if you add one.`
  );
}
