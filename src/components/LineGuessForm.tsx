"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  LINE_GUESS_DONATE_LABEL,
  LINE_GUESS_DONATE_URL,
  LINE_GUESS_FEET_PATTERN,
  LINE_GUESS_MAX_FEET,
  formatGuessFeet,
  lineGuessEntriesPath,
} from "@/lib/line-guess-format";

type FieldErrors = Record<string, string[] | undefined>;

type SavedGuess = {
  name: string;
  guessFeet: number;
};

async function readError(res: Response): Promise<{
  error: string;
  fieldErrors: FieldErrors;
}> {
  try {
    const data = (await res.json()) as {
      error?: string;
      fieldErrors?: FieldErrors;
    };
    return {
      error: data.error || "Could not save the guess",
      fieldErrors: data.fieldErrors ?? {},
    };
  } catch {
    return { error: "Could not save the guess", fieldErrors: {} };
  }
}

export function LineGuessForm({ token }: { token: string }) {
  const thanksRef = useRef<HTMLHeadingElement>(null);
  const [name, setName] = useState("");
  const [guess, setGuess] = useState("");
  const [note, setNote] = useState("");
  const [paidClaimed, setPaidClaimed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState<SavedGuess | null>(null);

  useEffect(() => {
    if (!saved) return;
    thanksRef.current?.focus();
  }, [saved]);

  function resetForm() {
    setName("");
    setGuess("");
    setNote("");
    setPaidClaimed(false);
    setFormError(null);
    setFieldErrors({});
    setSaved(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);
    setFieldErrors({});

    const trimmedGuess = guess.trim();
    if (!LINE_GUESS_FEET_PATTERN.test(trimmedGuess)) {
      setFieldErrors({ guessFeet: ["Enter the guess in feet"] });
      setFormError("Check the form and try again");
      return;
    }
    const guessFeet = Number(trimmedGuess);
    if (guessFeet <= 0 || guessFeet > LINE_GUESS_MAX_FEET) {
      setFieldErrors({
        guessFeet: [
          guessFeet <= 0
            ? "Guess must be more than 0 feet"
            : "That guess is too large",
        ],
      });
      setFormError("Check the form and try again");
      return;
    }
    if (!paidClaimed) {
      setFieldErrors({
        paidClaimed: [`Check “${LINE_GUESS_DONATE_LABEL}” before saving`],
      });
      setFormError("Check the form and try again");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(lineGuessEntriesPath(token), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          guessFeet,
          paidClaimed: true,
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const failure = await readError(res);
        setFormError(failure.error);
        setFieldErrors(failure.fieldErrors);
        return;
      }
      const data = (await res.json()) as { name?: string; guessFeet?: number };
      setSaved({
        name: data.name || name.trim(),
        guessFeet: typeof data.guessFeet === "number" ? data.guessFeet : guessFeet,
      });
    } catch {
      setFormError("Could not reach the server. Your guess was not saved.");
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <div className="space-y-4">
        <h2
          ref={thanksRef}
          tabIndex={-1}
          className="font-display text-3xl text-wave outline-none"
        >
          Guess saved
        </h2>
        <p className="text-lg text-ink">
          {saved.name} · {formatGuessFeet(saved.guessFeet)}
        </p>
        <p className="text-ink/80">
          Thanks for donating to Cancer Care Alliance. Your guess is in the jar.
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="btn-bay btn-bay-navy w-full"
        >
          Next guest
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-lg bg-sun/10 px-4 py-4">
        <a
          href={LINE_GUESS_DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          className="btn-bay btn-bay-red w-full flex-col gap-0.5 py-4 leading-none"
        >
          Donate $40
          <span className="mt-1 font-label text-[0.7rem] tracking-[0.16em]">
            Cancer Care Alliance
          </span>
        </a>
        <p id="line-guess-donate-help" className="mt-3 text-center text-sm text-ink/70">
          Classy campaign. $40 minimum. Opens in a new tab.
        </p>
      </div>

      <div>
        <label htmlFor="line-guess-name" className="block text-sm font-semibold text-wave">
          Name
        </label>
        <input
          id="line-guess-name"
          name="name"
          autoComplete="name"
          required
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 text-base outline-none ring-foam/40 focus:ring-2"
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? "line-guess-name-error" : undefined}
        />
        {fieldErrors.name?.[0] ? (
          <p id="line-guess-name-error" className="mt-1 text-sm text-alert">
            {fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="line-guess-feet" className="block text-sm font-semibold text-wave">
          Guess in feet
        </label>
        <input
          id="line-guess-feet"
          name="guessFeet"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          required
          maxLength={9}
          placeholder="247.5"
          value={guess}
          onChange={(event) => setGuess(event.target.value)}
          className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 text-base outline-none ring-foam/40 focus:ring-2"
          aria-invalid={fieldErrors.guessFeet ? true : undefined}
          aria-describedby={
            fieldErrors.guessFeet ? "line-guess-feet-error" : "line-guess-feet-help"
          }
        />
        <p id="line-guess-feet-help" className="mt-1 text-sm text-ink/55">
          Positive number. Decimals are fine, like 247.5.
        </p>
        {fieldErrors.guessFeet?.[0] ? (
          <p id="line-guess-feet-error" className="mt-1 text-sm text-alert">
            {fieldErrors.guessFeet[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="line-guess-note" className="block text-sm font-semibold text-wave">
          Note <span className="font-normal text-ink/55">(optional)</span>
        </label>
        <textarea
          id="line-guess-note"
          name="note"
          rows={2}
          maxLength={240}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-3 text-base outline-none ring-foam/40 focus:ring-2"
        />
        {fieldErrors.note?.[0] ? (
          <p className="mt-1 text-sm text-alert">{fieldErrors.note[0]}</p>
        ) : null}
      </div>

      <label className="flex items-start gap-3 py-1 text-base text-ink">
        <input
          type="checkbox"
          name="paidClaimed"
          required
          checked={paidClaimed}
          onChange={(event) => setPaidClaimed(event.target.checked)}
          className="mt-1 h-6 w-6 shrink-0 accent-[var(--sun)]"
          aria-invalid={fieldErrors.paidClaimed ? true : undefined}
        />
        <span>{LINE_GUESS_DONATE_LABEL}</span>
      </label>
      {fieldErrors.paidClaimed?.[0] ? (
        <p className="-mt-3 text-sm text-alert">{fieldErrors.paidClaimed[0]}</p>
      ) : null}

      {formError ? (
        <p role="alert" className="rounded-md bg-alert/10 px-3 py-2 text-sm text-alert">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="btn-bay btn-bay-navy w-full disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save my guess"}
      </button>
    </form>
  );
}
