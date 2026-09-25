"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PAID_SIDE_POTS } from "@/lib/config";
import { buildWeighInStandings, type WeighAdminData } from "@/lib/weigh-board";
import {
  canEnterMainStringer,
  formatWeightLbs,
  teamBoughtSidePot,
} from "@/lib/weigh-scoring";

type Species = "TROUT" | "REDFISH" | "CATFISH";

const SPECIES: Array<{ id: Species; label: string }> = [
  { id: "TROUT", label: "Trout" },
  { id: "REDFISH", label: "Redfish" },
  { id: "CATFISH", label: "Catfish" },
];

function boardHref(path: string, sessionId?: string) {
  if (!sessionId) return path;
  return `${path}?session=${encodeURIComponent(sessionId)}`;
}

export function WeighInConsole({ data }: { data: WeighAdminData }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [species, setSpecies] = useState<Species>("REDFISH");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [spots, setSpots] = useState("");
  const [tagged, setTagged] = useState(false);
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [unlockNote, setUnlockNote] = useState("");
  const [dqReason, setDqReason] = useState("");
  const [practiceLabel, setPracticeLabel] = useState("Practice");
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const session = data.sessions.find((row) => row.id === data.activeSessionId) ?? null;
  const open = session?.status === "OPEN";
  const standings = useMemo(
    () =>
      buildWeighInStandings({
        session,
        teams: data.teams,
        fish: data.fish,
        stringers: data.stringers,
      }),
    [session, data.teams, data.fish, data.stringers],
  );

  const boats = data.teams.filter((team) => canEnterMainStringer(team.entryKind));
  const youth = data.teams.filter((team) => !canEnterMainStringer(team.entryKind));
  const needle = query.trim().toLowerCase();
  const match = (name: string) => !needle || name.toLowerCase().includes(needle);
  const team = data.teams.find((row) => row.id === teamId) ?? null;
  const stringer = data.stringers.find((row) => row.teamId === teamId) ?? null;
  const teamFish = data.fish.filter((fish) => fish.teamId === teamId);
  const place = standings.ranks.find((row) => row.teamId === teamId);
  const locked = stringer?.status === "LOCKED";

  async function post(url: string, body: unknown): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(payload.error ?? "Could not save");
        return false;
      }
      setToast(payload.message ?? "Saved");
      window.setTimeout(() => setToast(null), 8000);
      router.refresh();
      return true;
    } catch {
      setError("Network error. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveFish(event: FormEvent) {
    event.preventDefault();
    if (!session || !team) return;
    const ok = await post("/api/admin/weigh-in/fish", {
      id: editingId,
      sessionId: session.id,
      teamId: team.id,
      species,
      weightLbs: weight,
      lengthInches: length || null,
      spotCount: species === "REDFISH" ? spots : null,
      taggedTrout: species === "TROUT" && tagged,
      disqualified: false,
      notes,
    });
    if (!ok) return;
    setWeight("");
    setLength("");
    setSpots("");
    setNotes("");
    setTagged(false);
    setEditingId(null);
  }

  function loadFish(fishId: string) {
    const fish = teamFish.find((row) => row.id === fishId);
    if (!fish) return;
    setEditingId(fish.id);
    setSpecies(fish.species as Species);
    setWeight(String(fish.weightLbs));
    setLength(fish.lengthInches == null ? "" : String(fish.lengthInches));
    setSpots(fish.spotCount == null ? "" : String(fish.spotCount));
    setTagged(fish.taggedTrout);
    setNotes(fish.notes ?? "");
  }

  async function assignSlot(fishId: string, slot: "trout" | 1 | 2 | 3) {
    if (!session || !team || locked) return;
    let troutFishId = stringer?.troutFishId ?? null;
    let redfish = [...(stringer?.redfish ?? [])];
    if (slot === "trout") {
      if (troutFishId === fishId) troutFishId = null;
      else {
        troutFishId = fishId;
        redfish = redfish.filter((row) => row.weighedFishId !== fishId);
      }
    } else if (redfish.some((row) => row.slot === slot && row.weighedFishId === fishId)) {
      redfish = redfish.filter((row) => row.slot !== slot);
    } else {
      redfish = redfish.filter((row) => row.slot !== slot && row.weighedFishId !== fishId);
      redfish.push({ slot, weighedFishId: fishId });
      if (troutFishId === fishId) troutFishId = null;
    }
    await post("/api/admin/weigh-in/stringer", {
      action: "assign",
      sessionId: session.id,
      teamId: team.id,
      troutFishId,
      redfish,
    });
  }

  async function togglePot(fishId: string, potId: string) {
    if (!session || !team) return;
    const current = data.sidePotEntries.find(
      (entry) => entry.teamId === team.id && entry.potId === potId,
    );
    await post("/api/admin/weigh-in/side-pot", {
      sessionId: session.id,
      teamId: team.id,
      potId,
      weighedFishId: current?.weighedFishId === fishId ? null : fishId,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-label text-xs tracking-[0.14em] text-ink/50">Weighmaster</p>
          <h1 className="font-display text-3xl text-wave md:text-4xl">Official weigh-in</h1>
          <p className="mt-1 max-w-xl text-ink/65">
            Scale weights only. Livewell photos and the Brag Board stay for fun and never
            post here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="rounded-md px-3 py-2 text-sm text-ink/60 hover:text-ink">
            Teams
          </Link>
          {session ? (
            <a
              href={`/api/admin/weigh-in/export?session=${session.id}`}
              className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold"
            >
              Export CSV
            </a>
          ) : null}
          <a
            href={boardHref("/leaderboard/weigh-in", session?.id)}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-wave px-3 py-2 text-sm font-semibold text-salt"
          >
            Weigh-in board
          </a>
          <a
            href={boardHref("/leaderboard/side-pots", session?.id)}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-wave px-3 py-2 text-sm font-semibold text-salt"
          >
            Side pot board
          </a>
          <a
            href={boardHref("/leaderboard/weigh-in/tv", session?.id)}
            target="_blank"
            rel="noreferrer"
            className="rounded-md px-3 py-2 text-sm text-ink/55 underline-offset-2 hover:text-ink hover:underline"
          >
            Cast weigh-in
          </a>
          <a
            href={boardHref("/leaderboard/side-pots/tv", session?.id)}
            target="_blank"
            rel="noreferrer"
            className="rounded-md px-3 py-2 text-sm text-ink/55 underline-offset-2 hover:text-ink hover:underline"
          >
            Cast side pots
          </a>
        </div>
      </div>

      <section className="rounded-lg border border-[var(--line)] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-label text-xs text-ink/50">Session</p>
            <p className="font-display text-2xl text-wave">
              {session ? session.label : "No session yet"}
            </p>
            <p className="text-sm text-ink/60">
              {session?.status === "OPEN"
                ? "Open. The weigh-in and side pot pages refresh every few seconds. Closing freezes the ranks."
                : "Closed. Open it when the scales start so the public boards go live."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {session && !open ? (
              <button
                type="button"
                disabled={busy}
                className="rounded-md bg-sun px-4 py-3 text-sm font-semibold text-paper disabled:opacity-50"
                onClick={() =>
                  void post("/api/admin/weigh-in/session", {
                    action: "open",
                    sessionId: session.id,
                  })
                }
              >
                Open weigh-in
              </button>
            ) : null}
            {session && open ? (
              <button
                type="button"
                disabled={busy}
                className="rounded-md border border-[var(--line)] px-4 py-3 text-sm font-semibold disabled:opacity-50"
                onClick={() =>
                  void post("/api/admin/weigh-in/session", {
                    action: "close",
                    sessionId: session.id,
                  })
                }
              >
                Close session
              </button>
            ) : null}
          </div>
        </div>
        {data.sessions.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.sessions.map((row) => (
              <Link
                key={row.id}
                href={`/admin/weigh-in?session=${row.id}`}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  row.id === session?.id ? "bg-wave text-salt" : "bg-mist text-wave"
                }`}
              >
                {row.label} · {row.status}
              </Link>
            ))}
          </div>
        ) : null}
        <form
          className="mt-4 flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void post("/api/admin/weigh-in/session", {
              action: "create",
              label: practiceLabel,
            });
          }}
        >
          <label className="text-sm text-ink/70">
            New session label
            <input
              value={practiceLabel}
              onChange={(event) => setPracticeLabel(event.target.value)}
              className="mt-1 block rounded-md border border-[var(--line)] px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Open a different session
          </button>
        </form>
      </section>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="space-y-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search boat"
            className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 text-base"
          />
          <TeamList
            title="Boats"
            teams={boats.filter((row) => match(row.teamName))}
            selectedId={teamId}
            onSelect={setTeamId}
          />
          <TeamList
            title="RowRide side pots"
            teams={youth.filter((row) => match(row.teamName) && row.sidePots.length > 0)}
            selectedId={teamId}
            onSelect={setTeamId}
          />
          <p className="text-xs text-ink/50">
            {standings.boatsRemaining.length} boats still to weigh · {standings.onTheScale.length} on
            the scale
          </p>
        </aside>

        <section className="space-y-4">
          {!team || !session ? (
            <p className="rounded-lg bg-white p-6 text-ink/60">Pick a team to enter fish.</p>
          ) : (
            <>
              <div className="rounded-lg border border-[var(--line)] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-3xl text-wave">{team.teamName}</h2>
                    <p className="text-sm text-ink/60">
                      {canEnterMainStringer(team.entryKind)
                        ? "Main stringer: 1 trout + up to 3 redfish"
                        : "RowRide — side pots only, not the main stringer"}
                      {place ? ` · #${place.rank} on the board` : ""}
                      {stringer ? ` · ${stringer.status} · ${formatWeightLbs(stringer.totalWeightLbs)}` : ""}
                    </p>
                  </div>
                  {canEnterMainStringer(team.entryKind) ? (
                    <div className="flex flex-col items-stretch gap-2">
                      {!locked ? (
                        <button
                          type="button"
                          disabled={busy || !open}
                          className="rounded-md bg-sun px-4 py-3 text-sm font-semibold text-paper disabled:opacity-50"
                          onClick={() =>
                            void post("/api/admin/weigh-in/stringer", {
                              action: "lock",
                              sessionId: session.id,
                              teamId: team.id,
                            })
                          }
                        >
                          Lock stringer
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <input
                            value={unlockNote}
                            onChange={(event) => setUnlockNote(event.target.value)}
                            placeholder="Why unlock?"
                            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            disabled={busy}
                            className="rounded-md border border-[var(--line)] px-3 py-2 text-sm font-semibold"
                            onClick={() =>
                              void post("/api/admin/weigh-in/stringer", {
                                action: "unlock",
                                sessionId: session.id,
                                teamId: team.id,
                                unlockNote,
                              })
                            }
                          >
                            Unlock
                          </button>
                        </div>
                      )}
                      <input
                        value={dqReason}
                        onChange={(event) => setDqReason(event.target.value)}
                        placeholder="DQ reason"
                        className="rounded-md border border-[var(--line)] px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-md px-3 py-2 text-sm text-alert"
                        onClick={() =>
                          void post("/api/admin/weigh-in/stringer", {
                            action: "dq",
                            sessionId: session.id,
                            teamId: team.id,
                            dqReason,
                          })
                        }
                      >
                        DQ stringer
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <form onSubmit={(event) => void saveFish(event)} className="rounded-lg bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-xl text-wave">
                    {editingId ? "Correct this fish" : "Add fish"}
                  </h3>
                  {editingId ? (
                    <button
                      type="button"
                      className="text-sm text-ink/60"
                      onClick={() => {
                        setEditingId(null);
                        setWeight("");
                        setLength("");
                        setSpots("");
                        setNotes("");
                        setTagged(false);
                      }}
                    >
                      New fish
                    </button>
                  ) : null}
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {SPECIES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSpecies(option.id)}
                      className={`rounded-md px-4 py-3 text-sm font-semibold ${
                        species === option.id ? "bg-wave text-salt" : "bg-mist text-wave"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <NumberField label="Weight (lb)" value={weight} onChange={setWeight} />
                  <NumberField
                    label="Length (in)"
                    value={length}
                    onChange={setLength}
                    required={species !== "CATFISH"}
                  />
                  {species === "REDFISH" ? (
                    <NumberField label="Spots" value={spots} onChange={setSpots} integer />
                  ) : (
                    <span />
                  )}
                </div>
                {species === "TROUT" ? (
                  <label className="mt-3 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tagged}
                      onChange={(event) => setTagged(event.target.checked)}
                    />
                    Tagged or bonus trout (ineligible)
                  </label>
                ) : null}
                <label className="mt-3 block text-sm text-ink/70">
                  Notes
                  <input
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy || !open}
                  className="mt-4 rounded-md bg-wave px-5 py-3 text-sm font-semibold text-salt disabled:opacity-50"
                >
                  {editingId ? "Update fish" : "Save fish"}
                </button>
                {!open ? (
                  <p className="mt-2 text-sm text-alert">Open the session before entering fish.</p>
                ) : null}
              </form>

              <ul className="space-y-3">
                {teamFish.map((fish) => {
                  const bought = PAID_SIDE_POTS.filter((pot) =>
                    teamBoughtSidePot(team.sidePots, pot.id),
                  );
                  return (
                    <li key={fish.id} className="rounded-lg border border-[var(--line)] bg-white p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-display text-2xl text-wave">
                          {fish.species} · {formatWeightLbs(fish.weightLbs)}
                          {fish.lengthInches != null ? ` · ${fish.lengthInches} in` : ""}
                          {fish.spotCount != null ? ` · ${fish.spotCount} spots` : ""}
                          {fish.taggedTrout ? " · tagged" : ""}
                          {fish.disqualified ? " · DQ" : ""}
                        </p>
                        <button type="button" className="text-sm underline" onClick={() => loadFish(fish.id)}>
                          Correct
                        </button>
                      </div>
                      {fish.dqReason ? <p className="text-sm text-alert">{fish.dqReason}</p> : null}
                      {canEnterMainStringer(team.entryKind) ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <SlotButton
                            label="Trout"
                            active={stringer?.troutFishId === fish.id}
                            disabled={busy || locked || !open || fish.species !== "TROUT"}
                            onClick={() => void assignSlot(fish.id, "trout")}
                          />
                          {([1, 2, 3] as const).map((slot) => (
                            <SlotButton
                              key={slot}
                              label={`Red ${slot}`}
                              active={stringer?.redfish.some(
                                (row) => row.slot === slot && row.weighedFishId === fish.id,
                              )}
                              disabled={busy || locked || !open || fish.species !== "REDFISH"}
                              onClick={() => void assignSlot(fish.id, slot)}
                            />
                          ))}
                        </div>
                      ) : null}
                      {bought.length ? (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {bought.map((pot) => {
                            const entry = data.sidePotEntries.find(
                              (row) => row.teamId === team.id && row.potId === pot.id,
                            );
                            const onThis = entry?.weighedFishId === fish.id;
                            return (
                              <label key={pot.id} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={Boolean(onThis)}
                                  disabled={busy || !open}
                                  onChange={() => void togglePot(fish.id, pot.id)}
                                />
                                {pot.name}
                                {onThis && entry && !entry.eligible ? (
                                  <span className="text-alert">{entry.ineligibleReason}</span>
                                ) : null}
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-ink/50">No paid side pots on this team.</p>
                      )}
                      {!fish.disqualified ? (
                        <button
                          type="button"
                          className="mt-3 text-sm text-alert"
                          disabled={busy || !open}
                          onClick={() => {
                            const reason = window.prompt("DQ reason");
                            if (!reason?.trim()) return;
                            void post("/api/admin/weigh-in/fish", {
                              id: fish.id,
                              sessionId: session.id,
                              teamId: team.id,
                              species: fish.species,
                              weightLbs: fish.weightLbs,
                              lengthInches: fish.lengthInches,
                              spotCount: fish.spotCount,
                              taggedTrout: fish.taggedTrout,
                              disqualified: true,
                              dqReason: reason,
                              notes: fish.notes,
                            });
                          }}
                        >
                          DQ this fish
                        </button>
                      ) : null}
                    </li>
                  );
                })}
                {teamFish.length === 0 ? (
                  <li className="text-sm text-ink/50">No official fish for this team yet.</li>
                ) : null}
              </ul>
            </>
          )}
        </section>
      </div>

      {error ? (
        <p className="fixed bottom-4 left-1/2 z-50 max-w-lg -translate-x-1/2 rounded-md bg-alert px-4 py-3 text-center text-paper">
          {error}
        </p>
      ) : null}
      {toast && !error ? (
        <p className="fixed bottom-4 left-1/2 z-50 max-w-lg -translate-x-1/2 rounded-md bg-wave px-5 py-4 text-center font-display text-2xl text-salt">
          {toast}
        </p>
      ) : null}
    </div>
  );
}

function TeamList({
  title,
  teams,
  selectedId,
  onSelect,
}: {
  title: string;
  teams: Array<{ id: string; teamName: string }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="font-label text-xs text-ink/50">{title}</h2>
      <ul className="mt-1 max-h-72 space-y-1 overflow-auto">
        {teams.map((team) => (
          <li key={team.id}>
            <button
              type="button"
              onClick={() => onSelect(team.id)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold ${
                team.id === selectedId ? "bg-wave text-salt" : "bg-white text-wave hover:bg-mist"
              }`}
            >
              {team.teamName}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  integer = false,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  integer?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-ink/70">
      {label}
      <input
        inputMode={integer ? "numeric" : "decimal"}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-[var(--line)] px-3 py-2 font-display text-4xl text-wave"
      />
    </label>
  );
}

function SlotButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-40 ${
        active ? "bg-sun text-paper" : "bg-mist text-wave"
      }`}
    >
      {label}
    </button>
  );
}
