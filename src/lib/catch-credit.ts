/** Who-caught credit for Livewell posts. Leaf module for Node tests. */

export type TeamAnglerCredit = {
  id: string;
  fullName: string;
};

export const WHO_CAUGHT_REQUIRED_ERROR =
  "Who caught this? Pick the angler on your team.";

export const WHO_CAUGHT_NOT_ON_TEAM_ERROR =
  "That angler is not on your team.";

export function resolveCatchAnglerCredit(input: {
  teamAnglers: TeamAnglerCredit[];
  requestedAnglerId?: string | null;
}):
  | { ok: true; anglerId: string | null }
  | { ok: false; error: string } {
  const requested = input.requestedAnglerId?.trim() || null;

  if (input.teamAnglers.length > 1) {
    if (!requested) {
      return { ok: false, error: WHO_CAUGHT_REQUIRED_ERROR };
    }
    if (!input.teamAnglers.some((angler) => angler.id === requested)) {
      return { ok: false, error: WHO_CAUGHT_NOT_ON_TEAM_ERROR };
    }
    return { ok: true, anglerId: requested };
  }

  if (requested && input.teamAnglers.some((angler) => angler.id === requested)) {
    return { ok: true, anglerId: requested };
  }

  return { ok: true, anglerId: input.teamAnglers[0]?.id ?? null };
}
