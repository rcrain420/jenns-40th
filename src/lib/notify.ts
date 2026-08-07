import { EVENT } from "./config";

export type CatchNotifyPayload = {
  catchId: string;
  breed: string;
  lengthInches: number;
  weightLbs: number;
  anglerName: string;
  teamName: string;
};

const FUN_LINES = [
  (p: CatchNotifyPayload) =>
    `${p.anglerName} just put a ${p.breed} on the board — time to talk trash.`,
  (p: CatchNotifyPayload) =>
    `${p.teamName} is on the board with a ${p.weightLbs} lb AI guess. Weighmaster still undecided.`,
  (p: CatchNotifyPayload) =>
    `Photo dropped: ${p.anglerName}'s ${p.breed} (${p.lengthInches}"). For fun only — scale day is later.`,
  (p: CatchNotifyPayload) =>
    `${p.anglerName} logged a catch. Comment if you dare. Estimates ≠ weigh-in.`,
  (p: CatchNotifyPayload) =>
    `Fleet alert: ${p.teamName} thinks they have a ${p.breed}. Prove 'em wrong at 2 p.m.`,
] as const;

export function catchAlertHeadline(payload: CatchNotifyPayload): string {
  const index =
    Math.abs(
      [...payload.catchId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0),
    ) % FUN_LINES.length;
  return FUN_LINES[index]!(payload);
}

/**
 * Catch uploads fan out as in-app bell alerts (clients poll recent catches).
 * Email blast is intentionally retired — keep the fleet on the Livewell.
 */
export async function notifyAnglersOfNewCatch(
  payload: CatchNotifyPayload,
): Promise<{ alerted: true; channel: "in-app" }> {
  console.info(
    `[notify] in-app catch alert queued for ${EVENT.shortName}: ${payload.catchId}`,
  );
  return { alerted: true, channel: "in-app" };
}
