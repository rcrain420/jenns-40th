import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/components/PageShell";
import { EVENT } from "@/lib/config";

export const metadata: Metadata = {
  title: `Tournament rules · ${EVENT.shortName}`,
  description: `The Official-Ish Rules for ${EVENT.name} at ${EVENT.venue}.`,
};

const TOC = [
  { id: "who-can-fish", number: 1, title: "Who Can Fish?" },
  { id: "guided-and-diy", number: 2, title: "Guided and DIY Teams" },
  { id: "captains-meeting", number: 3, title: "Captain’s Meeting" },
  { id: "keep-it-legal", number: 4, title: "Keep It Legal" },
  { id: "how-you-can-catch-them", number: 5, title: "How You Can Catch Them" },
  {
    id: "boats-wade-fishing",
    number: 6,
    title: "Boats, Wade Fishing and Fishing Areas",
  },
  { id: "safety-first", number: 7, title: "Safety First—Seriously" },
  { id: "catch-your-own-fish", number: 8, title: "Catch Your Own Fish" },
  { id: "main-stringer", number: 9, title: "The Main Stringer" },
  {
    id: "side-pots",
    number: 10,
    title: "Side Pots and Bonus Categories",
  },
  { id: "bring-us-a-real-fish", number: 11, title: "Bring Us a Real Fish" },
  {
    id: "choose-your-fish",
    number: 12,
    title: "Choose Your Fish Before Weigh-In",
  },
  {
    id: "official-measuring",
    number: 13,
    title: "Official Measuring and Weighing",
  },
  {
    id: "two-pm-deadline",
    number: 14,
    title: "The Very Important 2:00 p.m. Deadline",
  },
  { id: "breaking-a-tie", number: 15, title: "Breaking a Tie" },
  { id: "dont-be-that-team", number: 16, title: "Don’t Be That Team" },
  {
    id: "pictures",
    number: 17,
    title: "Pictures or It Didn’t Happen",
  },
  { id: "final-word", number: 18, title: "The Final Word" },
] as const;

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-t border-dashed border-wave/25 pt-8"
    >
      <h2 className="font-display text-2xl uppercase tracking-wide text-wave md:text-3xl">
        <span className="text-sun">{number}.</span> {title}
      </h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-ink/85 md:text-lg">
        {children}
      </div>
    </section>
  );
}

function Subhead({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-display text-lg uppercase tracking-wide text-sea md:text-xl">
      {children}
    </h3>
  );
}

function RuleList({ items }: { items: string[] }) {
  return (
    <ol className="list-decimal space-y-3 pl-5 marker:font-semibold marker:text-sun">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}

export default function RulesPage() {
  return (
    <PageShell
      wide
      title="The Official-Ish Rules"
      description={
        <>
          Jenn&apos;s 40th Birthday Fishing Tournament · Saturday, October 10,
          2026 · {EVENT.venue}
        </>
      }
    >
      <article className="space-y-10">
        <header className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="section-banner">Rules</span>
            <span className="stamp text-sun">Play fair</span>
          </div>

          <h2 className="font-display text-2xl uppercase leading-tight text-wave md:text-3xl">
            Jenn&apos;s 40th Birthday Fishing Tournament
          </h2>

          <dl className="grid gap-3 border border-wave/15 bg-mist/50 px-4 py-5 text-sm md:grid-cols-2 md:px-5 md:text-base">
            <div>
              <dt className="font-semibold uppercase tracking-[0.1em] text-wave/60">
                Tournament name
              </dt>
              <dd className="mt-1">{EVENT.name}</dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-[0.1em] text-wave/60">
                Tournament date
              </dt>
              <dd className="mt-1">Saturday, October 10, 2026</dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-[0.1em] text-wave/60">
                Headquarters &amp; weigh-in
              </dt>
              <dd className="mt-1">
                {EVENT.venue}, {EVENT.city}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-[0.1em] text-wave/60">
                Fishing hours
              </dt>
              <dd className="mt-1">Sunrise to 2:00 p.m.</dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-[0.1em] text-wave/60">
                Weigh-in hours
              </dt>
              <dd className="mt-1">12:00 p.m. to 2:00 p.m.</dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-[0.1em] text-wave/60">
                Captain&apos;s meeting
              </dt>
              <dd className="mt-1">
                Friday, October 9, 2026, at 7:00 p.m. at {EVENT.venue}
              </dd>
            </div>
          </dl>

          <p>
            The goal is simple: catch fish, celebrate Jenn, talk a little trash
            and have a great time.
          </p>
          <p>
            We want this tournament to be competitive, fair and fun. Please read
            the rules so nobody has to argue over a redfish while Jenn is trying
            to enjoy her birthday.
          </p>

          <nav
            aria-label="Rules table of contents"
            className="border border-wave/15 bg-mist/50 px-4 py-5 md:px-5"
          >
            <p className="font-display text-sm uppercase tracking-[0.14em] text-wave">
              Table of contents
            </p>
            <ol className="mt-4 columns-1 gap-x-8 sm:columns-2">
              {TOC.map((item) => (
                <li key={item.id} className="mb-2 break-inside-avoid">
                  <a
                    href={`#${item.id}`}
                    className="group inline-flex gap-2 text-sm text-ink/80 transition hover:text-sea md:text-base"
                  >
                    <span className="font-semibold text-sun">
                      {item.number}.
                    </span>
                    <span className="underline-offset-4 group-hover:underline">
                      {item.title}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </header>

        <Section id="who-can-fish" number={1} title="Who Can Fish?">
          <RuleList
            items={[
              "All anglers must be officially registered before fishing begins. No surprise substitutes, mysterious cousins or last-minute ringers.",
              "Each participant must sign the tournament participation waiver before fishing. A parent or legal guardian must sign for every participant under 18.",
              "Each team must name one person as its captain. Choose wisely. This is the person we will contact when somebody forgets what time weigh-in closes.",
              "Teams may have up to four registered anglers.",
              "Only registered anglers may catch fish entered in the main tournament, paid side pots or bonus categories.",
              "Unsafe behavior, cheating, serious rule-breaking or acting like a complete jackass may result in an entry being refused or revoked.",
            ]}
          />
        </Section>

        <Section id="guided-and-diy" number={2} title="Guided and DIY Teams">
          <p>Both guided and non-guided teams are welcome.</p>
          <Subhead>Guided Teams</Subhead>
          <p>
            A licensed fishing guide or charter captain may operate the boat and
            assist the team.
          </p>
          <p>
            Unless the guide is also registered as an angler, the guide may not
            catch or contribute fish to the team&apos;s tournament entries.
          </p>
          <p>
            In other words, the guide can put you on the fish, but the registered
            anglers still have to catch them.
          </p>
          <Subhead>Non-Guided Teams</Subhead>
          <p>
            Non-guided teams may not receive professional guiding services during
            official tournament fishing hours.
          </p>
          <p>
            Guided and non-guided teams will compete together unless separate
            divisions are announced before the tournament.
          </p>
        </Section>

        <Section id="captains-meeting" number={3} title="Captain’s Meeting">
          <p>At least one representative from every team must attend the captain&apos;s meeting:</p>
          <div className="border border-wave/15 bg-mist/60 px-4 py-4">
            <p className="font-accent text-2xl leading-none text-sun md:text-3xl">
              {EVENT.venue}
            </p>
            <p className="mt-2 font-semibold text-wave">
              Friday, October 9, 2026, at 7:00 p.m.
            </p>
            <p className="mt-1 text-sm text-ink/65">{EVENT.address}</p>
          </div>
          <p>
            This is where we will cover the final details, answer questions,
            clarify boundaries and pretend everyone is going to get a full night
            of sleep.
          </p>
          <p>
            Paid side pots can be selected during online registration or at the
            captain&apos;s meeting. All side-pot payments must be completed
            through Venmo no later than the captain&apos;s meeting.
          </p>
          <p>
            Once the captain&apos;s meeting closes, the paid side pots are closed.
            No side-pot entries or payments will be accepted on tournament day.
          </p>
          <p>
            Any weather updates, boundary clarifications, rule changes or
            additional instructions announced at the captain&apos;s meeting become
            part of the official rules.
          </p>
        </Section>

        <Section id="keep-it-legal" number={4} title="Keep It Legal">
          <p>
            All participants must follow current Texas Parks and Wildlife
            Department regulations and all applicable federal, state and local
            laws.
          </p>
          <p>
            Every angler who is required to have a Texas fishing license and
            saltwater endorsement must have them while participating.
          </p>
          <p>
            All fish entered must meet the legal size, bag and possession limits
            in effect on tournament day.
          </p>
          <p>
            Nothing in these rules gives anyone permission to break the law.
          </p>
          <p>
            Basically, make sure your fish, your license and your boat are legal
            before bringing any of them near the weigh-in.
          </p>
        </Section>

        <Section id="how-you-can-catch-them" number={5} title="How You Can Catch Them">
          <RuleList
            items={[
              "Tournament fish must be caught using a conventional rod, reel, line and hook.",
              "Each angler may actively fish with only one rod at a time. You may bring your entire garage full of rods, but you only get to fish one at a time.",
              "Live bait, dead bait and artificial lures are all allowed.",
              "Cast nets may be used to catch legal bait. They may not be used to catch tournament fish.",
              "No gigging, bow fishing, snagging, netting tournament fish or other creative methods that do not involve catching the fish with a rod and reel.",
              "Tournament fish must be hooked during official fishing hours.",
            ]}
          />
        </Section>

        <Section id="boats-wade-fishing" number={6} title="Boats, Wade Fishing and Fishing Areas">
          <RuleList
            items={[
              "Fishing is allowed only in public waters that tournament participants may legally access.",
              "Each team must fish from one boat during tournament hours. Team members may not split up and fish from multiple boats.",
              "Wade fishing is allowed when the fishing area is accessed using the team's boat.",
              "Wade fishermen must remain within sight or normal communication distance of their team and boat. Do not disappear into the horizon and become a missing-person situation.",
              "Teams may not reserve, block, claim or prevent another team from fishing a public area.",
              "Give other boats and wade fishermen a safe and respectful amount of space. Nobody owns the bay—not even the person who arrived six minutes before you.",
              "Any fishing boundaries or restricted areas will be announced at the captain's meeting.",
            ]}
          />
        </Section>

        <Section id="safety-first" number={7} title="Safety First—Seriously">
          <p>
            Every participant is responsible for evaluating the weather, water
            conditions and personal ability before deciding whether to fish.
          </p>
          <p>
            All boats must meet United States Coast Guard and Texas Parks and
            Wildlife Department safety requirements.
          </p>
          <p>Participants are strongly encouraged to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Wear a Coast Guard-approved personal flotation device while the
              boat is underway.
            </li>
            <li>Attach the engine kill switch to the boat operator.</li>
            <li>
              Carry working navigation lights, communication equipment and
              emergency supplies.
            </li>
            <li>
              Avoid unsafe boat operation during thunderstorms, high winds or
              poor visibility.
            </li>
          </ul>
          <p>
            No fish, prize, side pot, fishing spot or bragging right is worth
            someone getting hurt.
          </p>
          <p>Be smart. Come back safely.</p>
        </Section>

        <Section id="catch-your-own-fish" number={8} title="Catch Your Own Fish">
          <RuleList
            items={[
              "Every fish entered must have been caught by a registered member of the team submitting it.",
              "Fish may not be shared, transferred, purchased, borrowed, traded or pooled between teams.",
              "Fish caught before official tournament hours may not be submitted.",
              "Nobody outside the registered team may catch or provide fish for the team.",
              "Breaking this rule may disqualify the entire team.",
            ]}
          />
          <p>
            Your fish must be your fish. This is not a seafood exchange program.
          </p>
        </Section>

        <Section id="main-stringer" number={9} title="The Main Stringer">
          <p>
            The main tournament winner will be determined by the heaviest legal
            stringer consisting of up to:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Three legal redfish; and</li>
            <li>One legal spotted seatrout.</li>
          </ul>
          <p>Each team may submit only one main tournament stringer.</p>
          <p>
            A complete four-fish stringer is <strong>not required</strong>. Teams
            may weigh fewer than four fish, and placement will be determined by
            the greatest total qualifying weight.
          </p>
          <p>
            All fish must comply with the Texas Parks and Wildlife Department
            size, bag and possession limits in effect on tournament day.
          </p>
          <p>
            A fish entered in a paid side pot or bonus category may also be
            included in the main stringer, provided it is otherwise eligible.
          </p>
        </Section>

        <Section id="side-pots" number={10} title="Side Pots and Bonus Categories">
          <p>There will be three optional paid side pots.</p>
          <p>
            Each paid side pot costs <strong>$50 per team, per category</strong>.
          </p>
          <p>
            Teams may enter one, two or all three. Go all-in, choose your favorite
            or protect your Venmo balance.
          </p>
          <p>
            Side pots can be selected during online registration or at the
            captain&apos;s meeting on Friday, October 9, 2026. All side-pot
            payments must be completed through Venmo by the end of the
            captain&apos;s meeting.
          </p>
          <p>
            No side-pot entries or payments will be accepted after the
            captain&apos;s meeting closes or on tournament day.
          </p>
          <p>
            Side-pot fish may also be included in the team&apos;s main tournament
            stringer when otherwise eligible.
          </p>

          <div className="space-y-6 border border-wave/15 bg-mist/40 px-4 py-5 md:px-5">
            <div>
              <Subhead>Paid Side Pot: Heaviest Spotted Seatrout</Subhead>
              <div className="mt-3 space-y-3">
                <p>
                  The heaviest legal spotted seatrout measuring between 15 and 20
                  inches wins.
                </p>
                <p>
                  Trout retained using a Spotted Seatrout Tag or Bonus Spotted
                  Seatrout Tag are not eligible for the tournament stringer or
                  side pot.
                </p>
                <p>
                  In the event of a tie, the fish weighed first wins. There are
                  benefits to not waiting until 1:59 p.m.
                </p>
              </div>
            </div>

            <div>
              <Subhead>Paid Side Pot: Blackjack Redfish</Subhead>
              <div className="mt-3 space-y-3">
                <p>
                  The legal redfish measuring closest to 21 inches without going
                  over wins.
                </p>
                <p>
                  Think <em>The Price Is Right</em>, except with redfish.
                </p>
                <p>
                  A redfish measuring more than 21 inches is not eligible for the
                  Blackjack side pot.
                </p>
                <p>
                  If two fish have the same measurement, the heavier fish wins. If
                  they also weigh the same, the fish weighed first wins.
                </p>
              </div>
            </div>

            <div>
              <Subhead>Paid Side Pot: Most Spots</Subhead>
              <div className="mt-3 space-y-3">
                <p>
                  The legal redfish with the greatest number of natural tail spots
                  wins.
                </p>
                <p>
                  Only clearly defined, natural spots located on the tail or tail
                  base will be counted.
                </p>
                <p>
                  The Weighmaster has final authority over whether a marking
                  qualifies as a spot. Arguing that a piece of mud looks like a
                  spot will not help.
                </p>
                <p>
                  If two fish have the same number of spots, the heavier fish
                  wins. If they also weigh the same, the fish weighed first wins.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Subhead>Free Youth Division</Subhead>
            <p>There is no entry fee for the Youth Division.</p>
            <p>
              The Youth Division is open to registered anglers who are 17 years
              old or younger.
            </p>
            <p>
              The heaviest qualifying fish caught by a registered youth angler
              wins.
            </p>
            <p>
              For this category, a qualifying fish must be legal, caught during
              tournament hours, presented whole and accepted by the Weighmaster.
            </p>
            <p>
              The youth angler must personally hook the fish and actively
              participate in landing it. Adults may help keep everyone safe, but
              the child needs to do the fishing.
            </p>
            <p>
              The Youth Division prize will be provided by Jenn and Aaron and will
              not come from paid side-pot money.
            </p>
            <p>
              Youth anglers may also compete in the paid side pots as members of
              their registered team.
            </p>
          </div>

          <div className="space-y-3">
            <Subhead>Birthday Trash Fish Prize</Subhead>
            <p className="font-semibold text-wave">Heaviest Saltwater Catfish</p>
            <p>There is no entry fee for the Birthday Trash Fish category.</p>
            <p>
              The heaviest legal <strong>gafftopsail catfish or hardhead catfish</strong>{" "}
              wins.
            </p>
            <p>Yes, we are rewarding the fish that usually ruins your day.</p>
            <p>
              The fish must comply with current Texas Parks and Wildlife
              Department regulations.
            </p>
            <p>
              The prize will be provided by Jenn and Aaron and will not come from
              paid side-pot money.
            </p>
            <p>
              A team does not have to enter any paid side pots to compete for the
              Birthday Trash Fish prize.
            </p>
          </div>
        </Section>

        <Section id="bring-us-a-real-fish" number={11} title="Bring Us a Real Fish">
          <RuleList
            items={[
              "All fish must be fresh, unfrozen and caught during official tournament hours.",
              "Fish must be presented whole and in an edible condition.",
              "Frozen, spoiled, mutilated, gutted or altered fish will be rejected.",
              "No trimmed tails, intentionally damaged noses, hidden weights or other alterations intended to affect a fish's length or weight.",
              "Tournament officials may inspect any fish for tampering.",
              "Intentionally submitting an altered fish will result in disqualification.",
            ]}
          />
          <p>
            Do not stuff anything inside a fish that did not arrive there
            naturally. We cannot believe this rule needs to exist, but fishing
            tournaments have taught us otherwise.
          </p>
        </Section>

        <Section id="choose-your-fish" number={12} title="Choose Your Fish Before Weigh-In">
          <p>
            Teams are responsible for measuring and selecting their fish before
            presenting them for official weigh-in.
          </p>
          <p>
            We will not provide a separate scale for teams to compare fish or
            decide which ones to submit.
          </p>
          <p>
            Once a fish is presented and placed on the official scale, it becomes
            the team&apos;s official entry and may not be exchanged for another
            fish.
          </p>
          <p>
            A fish that is disqualified after being presented to the Weighmaster
            may not be replaced.
          </p>
          <p>
            Measure twice. Choose carefully. Then approach the scale with
            confidence.
          </p>
        </Section>

        <Section id="official-measuring" number={13} title="Official Measuring and Weighing">
          <RuleList
            items={[
              "Fish will be measured using the tournament's official measuring board.",
              "Fish will be weighed using the tournament's official scale.",
              "Tournament officials will determine the required measuring method, including mouth placement and tail position.",
              "Official weights will be recorded exactly as displayed by the tournament scale.",
              "The Weighmaster has final authority over species identification, fish condition, measurement, spot count and official weight.",
            ]}
          />
          <p>
            The official scale is the official scale. Your bathroom scale,
            fish-grip scale and uncle&apos;s estimate do not overrule it.
          </p>
        </Section>

        <Section id="two-pm-deadline" number={14} title="The Very Important 2:00 p.m. Deadline">
          <p>
            The official weigh-in will take place at {EVENT.venue}.
          </p>
          <p>
            The scales will open at <strong>12:00 p.m.</strong> on Saturday,
            October 10, 2026.
          </p>
          <p>
            Fishing ends promptly at <strong>2:00 p.m.</strong>
          </p>
          <p>No fish hooked after 2:00 p.m. may be submitted.</p>
          <p>
            Every team wishing to weigh fish must be physically checked in and
            standing in the official weigh-in line, with its fish in its
            possession, no later than <strong>2:00 p.m.</strong>
          </p>
          <p>
            Teams that are in line by 2:00 p.m. may complete their weigh-in.
          </p>
          <p>Teams entering the line after 2:00 p.m. may not weigh fish.</p>
          <p>
            Being near Boatmen&apos;s does not count. Being at the dock does not
            count. Being in the parking lot does not count. Flying toward the
            weigh-in while yelling, &ldquo;We&apos;re right here!&rdquo; does not
            count.
          </p>
          <p>
            Telephone calls, text messages, photographs, traffic, boat trouble or
            evidence that your team is approaching the marina will not satisfy
            the deadline.
          </p>
          <p>
            There will be <strong>no exceptions</strong> to the 2:00 p.m.
            weigh-in deadline.
          </p>
        </Section>

        <Section id="breaking-a-tie" number={15} title="Breaking a Tie">
          <p>
            Unless a category has its own tie-breaking rule, a tie in weight will
            be awarded to the team whose qualifying fish or stringer was
            officially weighed first.
          </p>
          <p>
            The specific tie-breaking rules listed under each paid side pot will
            control for that category.
          </p>
          <p>Another good reason not to wait until the final minute.</p>
        </Section>

        <Section id="dont-be-that-team" number={16} title="Don’t Be That Team">
          <p>
            Everyone must behave safely, honestly and respectfully.
          </p>
          <p>
            Threats, fighting, harassment, reckless boat operation, cheating,
            interfering with another team or other conduct harmful to the
            tournament may result in immediate removal and disqualification.
          </p>
          <p>
            Competitive banter is welcome. Actual hostility is not.
          </p>
          <p>
            This is a birthday tournament. Fish hard, laugh often and remember
            that everyone still has to hang out together afterward.
          </p>
        </Section>

        <Section id="pictures" number={17} title="Pictures or It Didn’t Happen">
          <p>
            Tournament officials may request photographs or video showing a fish,
            angler, boat or catch when reasonably necessary to verify compliance
            with the rules.
          </p>
          <p>Please smile—even if your fish is small.</p>
          <p>
            Pictures, updates and competitive banter are welcome and may be
            uploaded through the tournament app.
          </p>
        </Section>

        <Section id="final-word" number={18} title="The Final Word">
          <p>The Weighmaster has final authority over:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Fish identification;</li>
            <li>Fish condition;</li>
            <li>Official measurements;</li>
            <li>Spot counts; and</li>
            <li>Official weights.</li>
          </ul>
          <p>All decisions are final.</p>
          <p className="font-accent text-3xl leading-snug text-sun md:text-4xl">
            Celebrate Jenn, be safe, catch some fish and have a damn good time.
          </p>
        </Section>

        <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-dashed border-wave/25 pt-8">
          <Link
            href="/register"
            className="font-display text-sm uppercase tracking-[0.14em] text-sea underline-offset-4 hover:underline"
          >
            Register your team →
          </Link>
          <Link
            href="/guides"
            className="font-display text-sm uppercase tracking-[0.14em] text-sea underline-offset-4 hover:underline"
          >
            Find a Rockport guide →
          </Link>
        </div>
      </article>
    </PageShell>
  );
}
