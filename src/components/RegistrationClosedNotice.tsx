import Link from "next/link";
import {
  publicRegistrationClosedCopy,
  type PublicRegistrationGates,
} from "@/lib/registration-policy";

export function RegistrationClosedNotice({
  openByDate,
  openByCapacity,
  showRulesLink = true,
}: PublicRegistrationGates & { showRulesLink?: boolean }) {
  const copy = publicRegistrationClosedCopy({ openByDate, openByCapacity });

  return (
    <div className="border border-dashed border-wave/30 bg-mist/70 px-6 py-10 text-center">
      <h2 className="font-display text-2xl uppercase text-wave">{copy.title}</h2>
      <p className="mt-3 text-ink/70">{copy.body}</p>
      {showRulesLink ? (
        <p className="mt-4">
          <Link
            href="/rules#registration-deadline"
            className="font-semibold text-sea underline-offset-4 hover:underline"
          >
            Registration deadline in the rules →
          </Link>
        </p>
      ) : null}
    </div>
  );
}
