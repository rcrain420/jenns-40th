/** Adult and youth merch sizes. One shirt per named angler; captain is not a seat. */

export const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

export type ShirtSize = (typeof SHIRT_SIZES)[number];

export const SHIRT_SIZE_REQUIRED_ERROR = "Shirt size is required";

export function isShirtSize(value: unknown): value is ShirtSize {
  return (
    typeof value === "string" &&
    (SHIRT_SIZES as readonly string[]).includes(value)
  );
}

export function missingShirtSize(
  anglers: Array<{ fullName?: string; shirtSize?: string | null }>,
): boolean {
  return anglers
    .filter((angler) => (angler.fullName ?? "").trim())
    .some((angler) => !isShirtSize(angler.shirtSize));
}
