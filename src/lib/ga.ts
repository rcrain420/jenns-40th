export type GaEnv = {
  NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
  NEXT_PUBLIC_GA_ID?: string;
};

/** GA4 measurement IDs look like G- followed by letters/digits. */
const GA4_MEASUREMENT_ID = /^G-[A-Z0-9]+$/i;

function gaEnv(env?: GaEnv): GaEnv {
  return (
    env ?? {
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    }
  );
}

/**
 * Returns a GA4 measurement ID when NEXT_PUBLIC_GA_MEASUREMENT_ID
 * (or NEXT_PUBLIC_GA_ID) is set and looks like a GA4 G- id. Otherwise null —
 * analytics stays off. Prefer MEASUREMENT_ID when both are valid.
 */
export function getGaMeasurementId(env?: GaEnv): string | null {
  const source = gaEnv(env);
  for (const raw of [
    source.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    source.NEXT_PUBLIC_GA_ID,
  ]) {
    const id = raw?.trim() ?? "";
    if (GA4_MEASUREMENT_ID.test(id)) return id;
  }
  return null;
}
