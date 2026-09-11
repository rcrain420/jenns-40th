/** Shared by the adult boat register form. Keep it short. Leaf-safe for Node tests. */

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
    `${minAnglers}–${maxAnglers} adult seats — boat teams are adults only. ` +
    `One adult name locks the boat; add the rest later from My team. ` +
    `Name and shirt size are required; email is optional. ` +
    `Register kids separately for free RowRide — they are not added to this boat and may fish from land or by boat. ` +
    `They do not change the $${feeDollars} boat entry. ` +
    `Adult emails get Join the boat; name-only adults join from the invite link. ` +
    `Captain is optional, not an angler slot, and 18+ if you add one.`
  );
}
