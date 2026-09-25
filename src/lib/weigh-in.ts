import { createHash } from "crypto";
import type { MainStringer, WeighedFish, WeighSession } from "@prisma/client";
import { prisma } from "./db.ts";
import { getPotTotals } from "./pots.ts";
import {
  buildSidePotStandings,
  buildWeighInStandings,
  type BoardFish,
  type BoardSession,
  type BoardStringer,
  type BoardTeam,
  type SidePotLeaderboard,
  type WeighAdminData,
  type WeighInLeaderboard,
} from "./weigh-board.ts";
import {
  announceBoardPlace,
  canEnterMainStringer,
  evaluateSidePot,
  formatWeightLbs,
  isPaidPotId,
  isWeighSpecies,
  qualifyingStringerTotal,
  teamBoughtSidePot,
  validateStringerAssignment,
  type PaidPotId,
  type SlotFish,
} from "./weigh-scoring.ts";

export class WeighInError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "WeighInError";
    this.status = status;
  }
}

export type { WeighAdminData };

function iso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

function milliEqual(a: number | null | undefined, b: number | null | undefined): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.round(a * 1000) === Math.round(b * 1000);
}

function toBoardSession(session: WeighSession): BoardSession {
  return {
    id: session.id,
    label: session.label,
    status: session.status,
    updatedAt: session.updatedAt.toISOString(),
    startsAt: iso(session.startsAt),
    endsAt: iso(session.endsAt),
  };
}

function toSlot(fish: WeighedFish): SlotFish {
  return {
    id: fish.id,
    species: fish.species,
    weightLbs: fish.weightLbs,
    weighedAt: fish.weighedAt.toISOString(),
    sequence: fish.sequence,
    disqualified: fish.disqualified,
    taggedTrout: fish.taggedTrout,
  };
}

function toBoardFish(fish: WeighedFish): BoardFish {
  return {
    id: fish.id,
    teamId: fish.teamId,
    species: fish.species,
    weightLbs: fish.weightLbs,
    lengthInches: fish.lengthInches,
    spotCount: fish.spotCount,
    weighedAt: fish.weighedAt.toISOString(),
    sequence: fish.sequence,
    disqualified: fish.disqualified,
    taggedTrout: fish.taggedTrout,
    dqReason: fish.dqReason,
    notes: fish.notes,
  };
}

type StringerWithSlots = MainStringer & {
  redfish: Array<{ slot: number; weighedFishId: string; weighedFish?: WeighedFish }>;
  troutFish?: WeighedFish | null;
};

function toBoardStringer(stringer: StringerWithSlots): BoardStringer {
  return {
    teamId: stringer.teamId,
    status: stringer.status,
    troutFishId: stringer.troutFishId,
    redfish: stringer.redfish.map((slot) => ({
      slot: slot.slot,
      weighedFishId: slot.weighedFishId,
    })),
    totalWeightLbs: stringer.totalWeightLbs,
    lockedAt: iso(stringer.lockedAt),
    dqReason: stringer.dqReason,
    unlockNote: stringer.unlockNote,
  };
}

function withVersion<T extends { session: BoardSession | null }>(
  body: T,
): T & { version: string } {
  const hash = createHash("sha1").update(JSON.stringify(body)).digest("hex").slice(0, 16);
  const stamp = body.session?.updatedAt ?? "none";
  return { ...body, version: `${stamp}-${hash}` };
}

export async function resolveWeighSession(sessionId?: string | null) {
  if (sessionId) {
    const session = await prisma.weighSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new WeighInError("Weigh session not found", 404);
    return session;
  }
  const open = await prisma.weighSession.findFirst({
    where: { status: "OPEN" },
    orderBy: { updatedAt: "desc" },
  });
  if (open) return open;
  return prisma.weighSession.findFirst({ orderBy: { updatedAt: "desc" } });
}

/** Open session for homepage / pot-page links. Null when the scales are closed. */
export async function getOpenWeighSession() {
  return prisma.weighSession.findFirst({
    where: { status: "OPEN" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, label: true, status: true },
  });
}

async function requireOpenSession(sessionId: string) {
  const session = await prisma.weighSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new WeighInError("Weigh session not found", 404);
  if (session.status !== "OPEN") {
    throw new WeighInError("This weigh session is closed. Open it before entering fish.", 409);
  }
  return session;
}

async function touchSession(
  tx: { weighSession: typeof prisma.weighSession },
  session: WeighSession,
) {
  await tx.weighSession.update({
    where: { id: session.id },
    data: { status: session.status },
  });
}

async function loadBoardInputs(session: WeighSession) {
  const [teams, fish, stringers] = await Promise.all([
    prisma.team.findMany({
      select: { id: true, teamName: true, entryKind: true, sidePots: true },
      orderBy: { teamName: "asc" },
    }),
    prisma.weighedFish.findMany({
      where: { sessionId: session.id },
      orderBy: { sequence: "asc" },
    }),
    prisma.mainStringer.findMany({
      where: { sessionId: session.id },
      include: { redfish: { orderBy: { slot: "asc" } } },
    }),
  ]);
  return {
    session: toBoardSession(session),
    teams: teams satisfies BoardTeam[],
    fish: fish.map(toBoardFish),
    stringers: stringers.map(toBoardStringer),
  };
}

export async function getWeighInLeaderboard(
  sessionId?: string | null,
): Promise<WeighInLeaderboard> {
  const session = await resolveWeighSession(sessionId);
  if (!session) {
    return withVersion({
      session: null,
      hero: null,
      ranks: [],
      disqualified: [],
      onTheScale: [],
      boatsRemaining: [],
    });
  }
  const inputs = await loadBoardInputs(session);
  return withVersion(buildWeighInStandings(inputs));
}

export async function getSidePotLeaderboard(
  sessionId?: string | null,
): Promise<SidePotLeaderboard> {
  const session = await resolveWeighSession(sessionId);
  if (!session) {
    const totals = await getPotTotals();
    return withVersion(
      buildSidePotStandings({
        session: null,
        teams: [],
        fish: [],
        entries: [],
        pools: totals.sidePots.map((pot) => ({
          id: pot.id,
          totalCents: pot.totalCents,
          entrantCount: pot.entrantCount,
        })),
      }),
    );
  }
  const [inputs, entries, totals] = await Promise.all([
    loadBoardInputs(session),
    prisma.sidePotEntry.findMany({
      where: { sessionId: session.id },
      select: { potId: true, teamId: true, weighedFishId: true },
    }),
    getPotTotals(),
  ]);
  return withVersion(
    buildSidePotStandings({
      ...inputs,
      entries,
      pools: totals.sidePots.map((pot) => ({
        id: pot.id,
        totalCents: pot.totalCents,
        entrantCount: pot.entrantCount,
      })),
    }),
  );
}

export async function getWeighAdminData(sessionId?: string | null): Promise<WeighAdminData> {
  const [sessions, active] = await Promise.all([
    prisma.weighSession.findMany({ orderBy: { createdAt: "asc" } }),
    resolveWeighSession(sessionId),
  ]);
  if (!active) {
    return {
      sessions: [],
      activeSessionId: null,
      teams: [],
      fish: [],
      stringers: [],
      sidePotEntries: [],
    };
  }
  const [inputs, sidePotEntries] = await Promise.all([
    loadBoardInputs(active),
    prisma.sidePotEntry.findMany({
      where: { sessionId: active.id },
      select: {
        id: true,
        potId: true,
        teamId: true,
        weighedFishId: true,
        eligible: true,
        ineligibleReason: true,
        metricLabel: true,
      },
    }),
  ]);
  return {
    sessions: sessions.map(toBoardSession),
    activeSessionId: active.id,
    teams: inputs.teams,
    fish: inputs.fish,
    stringers: inputs.stringers,
    sidePotEntries,
  };
}

function assertWeight(weightLbs: number) {
  if (!Number.isFinite(weightLbs) || weightLbs <= 0 || weightLbs > 200) {
    throw new WeighInError("Enter a weight in pounds, greater than 0.");
  }
}

function assertLength(lengthInches: number | null, required: boolean) {
  if (lengthInches == null) {
    if (required) throw new WeighInError("Enter a length in inches.");
    return;
  }
  if (!Number.isFinite(lengthInches) || lengthInches <= 0 || lengthInches > 80) {
    throw new WeighInError("Length looks off. Enter inches from the official board.");
  }
}

function assertSpots(spotCount: number | null, required: boolean) {
  if (spotCount == null) {
    if (required) throw new WeighInError("Enter the spot count for this redfish.");
    return;
  }
  if (!Number.isInteger(spotCount) || spotCount < 0 || spotCount > 40) {
    throw new WeighInError("Spot count must be a whole number.");
  }
}

export async function saveWeighedFish(input: {
  id?: string | null;
  sessionId: string;
  teamId: string;
  species: string;
  weightLbs: number;
  lengthInches: number | null;
  spotCount: number | null;
  taggedTrout: boolean;
  disqualified: boolean;
  dqReason: string | null;
  notes: string | null;
  actorUserId: string;
}) {
  const session = await requireOpenSession(input.sessionId);
  if (!isWeighSpecies(input.species)) {
    throw new WeighInError("Species must be trout, redfish, or catfish.");
  }
  const team = await prisma.team.findUnique({
    where: { id: input.teamId },
    select: { id: true, entryKind: true, teamName: true },
  });
  if (!team) throw new WeighInError("Team not found", 404);

  const species = input.species;
  const needsLength = species === "TROUT" || species === "REDFISH";
  const needsSpots = species === "REDFISH";
  assertWeight(input.weightLbs);
  assertLength(input.lengthInches, needsLength);
  assertSpots(input.spotCount, needsSpots);
  const taggedTrout = species === "TROUT" && input.taggedTrout;
  const dqReason = input.dqReason?.trim() || null;
  const notes = input.notes?.trim() || null;
  if (input.disqualified && !dqReason) {
    throw new WeighInError("Add a reason when you disqualify a fish.");
  }

  const fishId = await prisma.$transaction(async (tx) => {
    let fish: WeighedFish;
    if (input.id) {
      const existing = await tx.weighedFish.findUnique({ where: { id: input.id } });
      if (!existing || existing.sessionId !== session.id) {
        throw new WeighInError("Fish not found in this session", 404);
      }
      if (existing.teamId !== team.id) {
        throw new WeighInError("That fish belongs to another team.");
      }
      const measurementChanged =
        existing.species !== species ||
        !milliEqual(existing.weightLbs, input.weightLbs) ||
        !milliEqual(existing.lengthInches, input.lengthInches) ||
        existing.spotCount !== input.spotCount ||
        existing.taggedTrout !== taggedTrout;
      if (measurementChanged) {
        const locked = await lockedStringerForFish(tx, existing.id);
        if (locked) {
          throw new WeighInError(
            "Unlock the stringer before changing a fish that is already on the board.",
            409,
          );
        }
      }
      fish = await tx.weighedFish.update({
        where: { id: existing.id },
        data: {
          species,
          weightLbs: input.weightLbs,
          lengthInches: input.lengthInches,
          spotCount: species === "REDFISH" ? input.spotCount : null,
          taggedTrout,
          disqualified: input.disqualified,
          dqReason: input.disqualified ? dqReason : null,
          notes,
          enteredByUserId: input.actorUserId,
        },
      });
    } else {
      const agg = await tx.weighedFish.aggregate({
        where: { sessionId: session.id },
        _max: { sequence: true },
      });
      fish = await tx.weighedFish.create({
        data: {
          sessionId: session.id,
          teamId: team.id,
          species,
          weightLbs: input.weightLbs,
          lengthInches: input.lengthInches,
          spotCount: species === "REDFISH" ? input.spotCount : null,
          taggedTrout,
          disqualified: input.disqualified,
          dqReason: input.disqualified ? dqReason : null,
          notes,
          weighedAt: new Date(),
          sequence: (agg._max.sequence ?? 0) + 1,
          enteredByUserId: input.actorUserId,
        },
      });
    }

    await recomputeFishLinks(tx, fish.id);
    await touchSession(tx, session);
    return fish.id;
  });

  const label =
    species === "TROUT" ? "trout" : species === "REDFISH" ? "redfish" : "catfish";
  const message = input.disqualified
    ? `Disqualified ${label}. The board will drop it on the next refresh.`
    : `Saved ${formatWeightLbs(input.weightLbs)} ${label}.`;
  return { fishId, message };
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function lockedStringerForFish(tx: Tx, fishId: string) {
  const asTrout = await tx.mainStringer.findFirst({
    where: { troutFishId: fishId, status: "LOCKED" },
  });
  if (asTrout) return asTrout;
  const slot = await tx.mainStringerFish.findUnique({
    where: { weighedFishId: fishId },
    include: { stringer: true },
  });
  if (slot?.stringer.status === "LOCKED") return slot.stringer;
  return null;
}

async function recomputeFishLinks(tx: Tx, fishId: string) {
  const fish = await tx.weighedFish.findUnique({
    where: { id: fishId },
    include: {
      team: { select: { sidePots: true } },
      sidePotEntries: true,
      troutSlot: { include: { redfish: { include: { weighedFish: true } }, troutFish: true } },
      redfishSlots: {
        include: {
          stringer: { include: { redfish: { include: { weighedFish: true } }, troutFish: true } },
        },
      },
    },
  });
  if (!fish) return;

  for (const entry of fish.sidePotEntries) {
    if (!isPaidPotId(entry.potId)) continue;
    const evaluation = evaluateSidePot(
      entry.potId,
      {
        species: fish.species,
        weightLbs: fish.weightLbs,
        lengthInches: fish.lengthInches,
        spotCount: fish.spotCount,
        disqualified: fish.disqualified,
        taggedTrout: fish.taggedTrout,
      },
      fish.team.sidePots,
    );
    await tx.sidePotEntry.update({
      where: { id: entry.id },
      data: {
        metricValue: evaluation.metricValue,
        metricLabel: evaluation.metricLabel,
        eligible: evaluation.eligible,
        ineligibleReason: evaluation.reason,
        weighedAt: fish.weighedAt,
      },
    });
  }

  const stringerIds = new Set<string>();
  if (fish.troutSlot) stringerIds.add(fish.troutSlot.id);
  for (const slot of fish.redfishSlots) stringerIds.add(slot.stringerId);
  for (const stringerId of stringerIds) {
    await recomputeStringerTotal(tx, stringerId);
  }
}

async function recomputeStringerTotal(tx: Tx, stringerId: string) {
  const stringer = await tx.mainStringer.findUnique({
    where: { id: stringerId },
    include: { troutFish: true, redfish: { include: { weighedFish: true } } },
  });
  if (!stringer) return;
  const reds: Array<SlotFish | null> = [null, null, null];
  for (const slot of stringer.redfish) {
    if (slot.slot >= 1 && slot.slot <= 3) {
      reds[slot.slot - 1] = toSlot(slot.weighedFish);
    }
  }
  const score = qualifyingStringerTotal({
    trout: stringer.troutFish ? toSlot(stringer.troutFish) : null,
    redfish: reds,
  });
  await tx.mainStringer.update({
    where: { id: stringerId },
    data: { totalWeightLbs: score.totalWeightLbs },
  });
}

export async function saveStringer(input: {
  sessionId: string;
  teamId: string;
  action: "assign" | "lock" | "unlock" | "dq";
  troutFishId?: string | null;
  redfish?: Array<{ slot: number; weighedFishId: string }>;
  unlockNote?: string | null;
  dqReason?: string | null;
}) {
  const session = await requireOpenSession(input.sessionId);
  const team = await prisma.team.findUnique({
    where: { id: input.teamId },
    select: { id: true, entryKind: true, teamName: true },
  });
  if (!team) throw new WeighInError("Team not found", 404);
  if (!canEnterMainStringer(team.entryKind)) {
    throw new WeighInError("Youth RowRide entries are not on the main stringer board.");
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.mainStringer.findUnique({
      where: { sessionId_teamId: { sessionId: session.id, teamId: team.id } },
      include: { redfish: true },
    });

    if (input.action === "unlock") {
      if (!existing || existing.status !== "LOCKED") {
        throw new WeighInError("That stringer is not locked.");
      }
      const note = input.unlockNote?.trim() ?? "";
      if (note.length < 3) {
        throw new WeighInError("Add a short note before unlocking a locked stringer.");
      }
      await tx.mainStringer.update({
        where: { id: existing.id },
        data: { status: "DRAFT", unlockNote: note },
      });
      await touchSession(tx, session);
      return;
    }

    if (input.action === "dq") {
      const reason = input.dqReason?.trim() ?? "";
      if (reason.length < 3) {
        throw new WeighInError("Add a reason before disqualifying a stringer.");
      }
      const stringer =
        existing ??
        (await tx.mainStringer.create({
          data: { sessionId: session.id, teamId: team.id, status: "DQ", dqReason: reason },
          include: { redfish: true },
        }));
      await tx.mainStringer.update({
        where: { id: stringer.id },
        data: { status: "DQ", dqReason: reason },
      });
      await touchSession(tx, session);
      return;
    }

    if (existing?.status === "LOCKED") {
      throw new WeighInError("Unlock the stringer before changing slots.", 409);
    }
    if (existing?.status === "DQ" && input.action !== "assign") {
      throw new WeighInError("This stringer is disqualified.");
    }

    const troutFishId =
      input.action === "lock"
        ? existing?.troutFishId ?? null
        : input.troutFishId ?? null;
    const redfish =
      input.action === "lock"
        ? (existing?.redfish ?? []).map((slot) => ({
            slot: slot.slot,
            weighedFishId: slot.weighedFishId,
          }))
        : input.redfish ?? [];

    const normalized = normalizeRedfishSlots(redfish);
    const fishIds = [
      ...(troutFishId ? [troutFishId] : []),
      ...normalized.map((slot) => slot.weighedFishId),
    ];
    const fishRows = fishIds.length
      ? await tx.weighedFish.findMany({ where: { id: { in: fishIds } } })
      : [];
    const byId = new Map(fishRows.map((fish) => [fish.id, fish]));
    for (const id of fishIds) {
      const fish = byId.get(id);
      if (!fish || fish.sessionId !== session.id || fish.teamId !== team.id) {
        throw new WeighInError("Pick fish that belong to this team in this session.");
      }
    }

    const trout = troutFishId ? toSlot(byId.get(troutFishId)!) : null;
    const redSlots: Array<SlotFish | null> = [null, null, null];
    for (const slot of normalized) {
      redSlots[slot.slot - 1] = toSlot(byId.get(slot.weighedFishId)!);
    }
    const validated = validateStringerAssignment({
      trout,
      redfish: redSlots,
      forLock: input.action === "lock",
    });
    if (!validated.ok) throw new WeighInError(validated.error);

    const stringer = existing
      ? existing
      : await tx.mainStringer.create({
          data: { sessionId: session.id, teamId: team.id, status: "DRAFT" },
          include: { redfish: true },
        });

    await tx.mainStringerFish.deleteMany({ where: { stringerId: stringer.id } });
    await tx.mainStringer.update({
      where: { id: stringer.id },
      data: {
        troutFishId: null,
        status: input.action === "lock" ? "LOCKED" : "DRAFT",
        lockedAt: input.action === "lock" ? new Date() : stringer.lockedAt,
        totalWeightLbs: validated.score.totalWeightLbs,
        dqReason: null,
      },
    });
    if (normalized.length) {
      await tx.mainStringerFish.createMany({
        data: normalized.map((slot) => ({
          stringerId: stringer.id,
          slot: slot.slot,
          weighedFishId: slot.weighedFishId,
        })),
      });
    }
    await tx.mainStringer.update({
      where: { id: stringer.id },
      data: { troutFishId },
    });
    await touchSession(tx, session);
  });

  if (input.action === "unlock") {
    return { message: `${team.teamName} is off the board until you lock again.` };
  }
  if (input.action === "dq") {
    return { message: `${team.teamName} disqualified.` };
  }

  const board = await getWeighInLeaderboard(session.id);
  const row = board.ranks.find((rank) => rank.teamId === team.id);
  const stored = await prisma.mainStringer.findUnique({
    where: { sessionId_teamId: { sessionId: session.id, teamId: team.id } },
    select: { totalWeightLbs: true, status: true },
  });
  const total = row?.totalWeightLbs ?? stored?.totalWeightLbs ?? 0;
  return {
    message: announceBoardPlace(row?.rank ?? null, total, stored?.status === "LOCKED"),
    rank: row?.rank ?? null,
    totalWeightLbs: total,
  };
}

export function toWeighError(err: unknown): { error: string; status: number } {
  if (err instanceof WeighInError) return { error: err.message, status: err.status };
  console.error(err);
  return { error: "Something went wrong", status: 500 };
}

function normalizeRedfishSlots(
  slots: Array<{ slot: number; weighedFishId: string }>,
): Array<{ slot: number; weighedFishId: string }> {
  const seenSlots = new Set<number>();
  const seenFish = new Set<string>();
  const normalized: Array<{ slot: number; weighedFishId: string }> = [];
  for (const slot of slots) {
    if (!slot.weighedFishId) continue;
    if (slot.slot < 1 || slot.slot > 3 || seenSlots.has(slot.slot)) {
      throw new WeighInError("Redfish slots are 1, 2, and 3.");
    }
    if (seenFish.has(slot.weighedFishId)) {
      throw new WeighInError("That fish is already on the stringer.");
    }
    seenSlots.add(slot.slot);
    seenFish.add(slot.weighedFishId);
    normalized.push({ slot: slot.slot, weighedFishId: slot.weighedFishId });
  }
  return normalized;
}

export async function saveSidePotEntry(input: {
  sessionId: string;
  potId: string;
  teamId: string;
  weighedFishId: string | null;
}) {
  const session = await requireOpenSession(input.sessionId);
  if (!isPaidPotId(input.potId)) {
    throw new WeighInError("Side pot must be trout, blackjack, or spots.");
  }
  const potId: PaidPotId = input.potId;
  const team = await prisma.team.findUnique({
    where: { id: input.teamId },
    select: { id: true, teamName: true, sidePots: true },
  });
  if (!team) throw new WeighInError("Team not found", 404);
  if (!teamBoughtSidePot(team.sidePots, potId)) {
    throw new WeighInError("This team did not buy that side pot.");
  }

  if (!input.weighedFishId) {
    await prisma.$transaction(async (tx) => {
      await tx.sidePotEntry.deleteMany({
        where: { sessionId: session.id, potId, teamId: team.id },
      });
      await touchSession(tx, session);
    });
    return { message: `Cleared ${potName(potId)} for ${team.teamName}.`, eligible: true };
  }

  const fish = await prisma.weighedFish.findUnique({ where: { id: input.weighedFishId } });
  if (!fish || fish.sessionId !== session.id || fish.teamId !== team.id) {
    throw new WeighInError("Pick a fish from this team in this session.");
  }
  if (potId === "trout" && fish.species !== "TROUT") {
    throw new WeighInError("The trout pot needs a spotted seatrout.");
  }
  if (potId !== "trout" && fish.species !== "REDFISH") {
    throw new WeighInError("Blackjack and spots need a redfish.");
  }
  if ((potId === "trout" || potId === "blackjack") && fish.lengthInches == null) {
    throw new WeighInError("Enter a length before assigning this side pot.");
  }
  if (potId === "spots" && fish.spotCount == null) {
    throw new WeighInError("Enter a spot count before assigning the spots pot.");
  }

  const evaluation = evaluateSidePot(
    potId,
    {
      species: fish.species,
      weightLbs: fish.weightLbs,
      lengthInches: fish.lengthInches,
      spotCount: fish.spotCount,
      disqualified: fish.disqualified,
      taggedTrout: fish.taggedTrout,
    },
    team.sidePots,
  );

  await prisma.$transaction(async (tx) => {
    await tx.sidePotEntry.upsert({
      where: {
        sessionId_potId_teamId: {
          sessionId: session.id,
          potId,
          teamId: team.id,
        },
      },
      create: {
        sessionId: session.id,
        potId,
        teamId: team.id,
        weighedFishId: fish.id,
        metricValue: evaluation.metricValue,
        metricLabel: evaluation.metricLabel,
        eligible: evaluation.eligible,
        ineligibleReason: evaluation.reason,
        weighedAt: fish.weighedAt,
      },
      update: {
        weighedFishId: fish.id,
        metricValue: evaluation.metricValue,
        metricLabel: evaluation.metricLabel,
        eligible: evaluation.eligible,
        ineligibleReason: evaluation.reason,
        weighedAt: fish.weighedAt,
      },
    });
    await touchSession(tx, session);
  });

  const name = potName(potId);
  const message = evaluation.eligible
    ? `${team.teamName} on ${name} — ${evaluation.metricLabel}`
    : `Saved, but ineligible for ${name}: ${evaluation.reason}`;
  return { message, eligible: evaluation.eligible, reason: evaluation.reason };
}

function potName(potId: PaidPotId): string {
  if (potId === "trout") return "heaviest trout";
  if (potId === "blackjack") return "blackjack";
  return "most spots";
}

export async function setWeighSession(input: {
  action: "create" | "open" | "close";
  sessionId?: string | null;
  label?: string | null;
}) {
  if (input.action === "create") {
    const label = input.label?.trim() || "Practice";
    const created = await prisma.$transaction(async (tx) => {
      await tx.weighSession.updateMany({
        where: { status: "OPEN" },
        data: { status: "CLOSED" },
      });
      return tx.weighSession.create({
        data: { label, status: "OPEN", startsAt: new Date() },
      });
    });
    return {
      session: toBoardSession(created),
      message: `Opened “${created.label}”. The TV boards are live.`,
    };
  }

  if (!input.sessionId) throw new WeighInError("Choose a weigh session.");
  const session = await prisma.weighSession.findUnique({ where: { id: input.sessionId } });
  if (!session) throw new WeighInError("Weigh session not found", 404);

  if (input.action === "close") {
    const closed = await prisma.weighSession.update({
      where: { id: session.id },
      data: { status: "CLOSED" },
    });
    return {
      session: toBoardSession(closed),
      message: `Closed “${closed.label}”. Ranks are frozen.`,
    };
  }

  const opened = await prisma.$transaction(async (tx) => {
    await tx.weighSession.updateMany({
      where: { status: "OPEN", NOT: { id: session.id } },
      data: { status: "CLOSED" },
    });
    return tx.weighSession.update({
      where: { id: session.id },
      data: { status: "OPEN" },
    });
  });
  return {
    session: toBoardSession(opened),
    message: `Opened “${opened.label}”. Live boards follow this session.`,
  };
}

function csvEscape(value: string | number | boolean | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export async function weighInResultsCsv(sessionId: string): Promise<{ filename: string; body: string }> {
  const session = await prisma.weighSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new WeighInError("Weigh session not found", 404);
  const inputs = await loadBoardInputs(session);
  const entries = await prisma.sidePotEntry.findMany({ where: { sessionId: session.id } });
  const standings = buildWeighInStandings(inputs);
  const rankByTeam = new Map(standings.ranks.map((row) => [row.teamId, row]));
  const headers = [
    "session",
    "teamName",
    "entryKind",
    "stringerStatus",
    "rank",
    "totalWeightLbs",
    "troutLbs",
    "redfish1Lbs",
    "redfish2Lbs",
    "redfish3Lbs",
    "lockedAt",
    "troutPot",
    "blackjackPot",
    "spotsPot",
  ];
  const lines = [headers.join(",")];
  for (const team of inputs.teams) {
    const stringer = inputs.stringers.find((row) => row.teamId === team.id);
    const rank = rankByTeam.get(team.id);
    const potCell = (potId: string) => {
      const entry = entries.find((row) => row.teamId === team.id && row.potId === potId);
      if (!entry) return "";
      return entry.eligible ? entry.metricLabel : `ineligible: ${entry.ineligibleReason ?? ""}`;
    };
    lines.push(
      [
        session.label,
        team.teamName,
        team.entryKind,
        stringer?.status ?? "",
        rank?.rank ?? "",
        rank?.totalWeightLbs ?? stringer?.totalWeightLbs ?? "",
        rank?.troutLbs ?? "",
        rank?.redfishLbs[0] ?? "",
        rank?.redfishLbs[1] ?? "",
        rank?.redfishLbs[2] ?? "",
        stringer?.lockedAt ?? "",
        potCell("trout"),
        potCell("blackjack"),
        potCell("spots"),
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  const slug = session.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    filename: `weigh-in-${slug || session.id}.csv`,
    body: lines.join("\n"),
  };
}
