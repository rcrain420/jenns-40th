import {
  boatRosterStatusLabel,
  buildBoatRoster,
  type BoatRosterStatus,
} from "./join-the-boat";

export type DirectoryAngler = {
  name: string;
  status: BoatRosterStatus;
  statusLabel: string | null;
};

export type DirectoryTeam = {
  id: string;
  teamName: string;
  isOwn: boolean;
  anglers: DirectoryAngler[];
};

/** Joined/Pending when we already track them. Youth label is existing, not new. */
export function directoryStatusLabel(
  status: BoatRosterStatus,
): string | null {
  if (status === "joined" || status === "pending" || status === "youth") {
    return boatRosterStatusLabel(status);
  }
  return null;
}

export function toDirectoryTeam(input: {
  id: string;
  teamName: string;
  ownTeamId?: string | null;
  anglers: Array<{
    fullName: string;
    email?: string | null;
    isYouth?: boolean | null;
  }>;
  members: Array<{ name: string; email: string }>;
}): DirectoryTeam {
  const rows = buildBoatRoster({
    anglers: input.anglers,
    members: input.members,
  });
  return {
    id: input.id,
    teamName: input.teamName,
    isOwn: Boolean(input.ownTeamId && input.id === input.ownTeamId),
    anglers: rows.map((row) => ({
      name: row.name,
      status: row.status,
      statusLabel: directoryStatusLabel(row.status),
    })),
  };
}
