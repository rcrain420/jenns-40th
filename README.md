# Jen's 40th Birthday Fishing Tournament

Registration + admin console for the Oct 10, 2026 tournament in Rockport, TX (Boatmens at Cove Harbor Marina).

## Features

- Public landing page and team registration (AI team-name suggestions after sign-in)
- Teams of 2–4 anglers; guided (captain) or non-guided (primary contact)
- $75 per fishing angler; Venmo payment link + QR (`public/venmo-qr.png`)
- Fishing license confirmation checkbox
- Soft cap of 25 teams; public registration closes Oct 1, 2026
- Catch log: anglers photograph fish; AI estimates breed, length, and weight; board grouped by angler
- Catch alerts: in-app notification bell + optional browser notifications on `/catches`
- Comments on each catch photo
- Email + password accounts with confirmation; Google and Facebook sign-in when those env vars are set. Social accounts are verified immediately. Any confirmed user posts catches and comments as themselves
- Registration confirmation email includes a one-tap magic link that unlocks the event session (PIN is the fallback). The same unlock + invite links are on `/register/success` so a dead mailer does not block the flow.
- Adding an angler email on register or Invite sends a Join the boat email. After they join they have full site access (team + Livewell post) without a second unlock, PIN, or extra email confirm. Join is not captain and not the paid roster. Name-only seats still use the shared invite link or event PIN.
- Admin console: dashboard, search/filter, edit/delete, mark paid, CSV export (admin role on a user account)

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + Postgres (Docker locally, Neon in production)
- Vercel Blob for catch photos in production
- Deploy target: Vercel

## Local setup

```bash
npm install
cp .env.example .env
npm run db:up
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Create an account at [http://localhost:3000/login](http://localhost:3000/login). Confirmation emails need `RESEND_API_KEY`; in local dev the server also prints a confirm link.

Sign up with `ADMIN_EMAIL` to get the admin console: [http://localhost:3000/admin](http://localhost:3000/admin)

Set `EVENT_PIN` in `.env` to exercise the event-unlock fallback. Registration confirmation emails include a magic link that sets the same event session cookie. `/register/success` also shows that unlock link next to the teammate invite, so unlock does not depend on mail.

**Resend domain (ops):** account and registration emails need a verified sending domain. `officialishfishingtournament.com` must be added and verified in Resend; the app will not invent a From domain or fall back to Resend’s onboarding address (that address only delivers to the account owner). Until the domain is verified, expect provider 403s — the success page reports that mail did not send and still shows the links.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Local Docker Postgres or Neon connection string |
| `ADMIN_EMAIL` | Account email that is promoted to admin on signup/login |
| `SESSION_SECRET` | Cookie signing secret (32+ characters) |
| `EVENT_PIN` | Optional fallback PIN for the event-unlock cookie |
| `RESEND_API_KEY` | Sends account confirm/reset and registration unlock emails |
| `EMAIL_FROM` / `RESEND_FROM` | Optional From: header for Resend |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token; omit locally to store uploads under `public/uploads/catches` |
| `VENMO_URL` | Optional Venmo payment link override |
| `OPENAI_API_KEY` | Optional; enables AI fish estimates and team-name suggestions |
| `OPENAI_VISION_MODEL` | Optional; defaults to `gpt-4o-mini` |
| `OPENAI_TEAM_NAME_MODEL` | Optional; defaults to vision model or `gpt-4o-mini` |
| `NEXT_PUBLIC_APP_URL` | Optional canonical site URL for metadata and magic links |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional. Shows “Continue with Google” on the shared login form |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Optional. Shows “Continue with Facebook” on the shared login form |

Google / Facebook redirect URIs the app serves:

- `http://localhost:3000/api/auth/oauth/{google|facebook}/callback`
- `https://officialishfishingtournament.com/api/auth/oauth/{google|facebook}/callback`

Leave those env vars empty to keep email/password only. Production applies the `OAuthAccount` / nullable `passwordHash` migration on the next Vercel build (`prisma migrate deploy` is already in `npm run build`).

### Venmo

The app defaults to Venmo handle `@Officialish-Tournament` with QR at `public/venmo-qr.png`. Leave `VENMO_URL` empty unless you need a full custom payment URL override.

## Production (Vercel + Neon + Blob)

**Live:** [https://jenns-40th.vercel.app](https://jenns-40th.vercel.app)  
**Custom domain:** [https://officialishfishingtournament.com](https://officialishfishingtournament.com) (point DNS at Vercel)

Project: `acrainccg-6094s-projects/jenns-40th` (Neon + Blob linked; env vars set in Vercel).

DNS at GoDaddy (Domaincontrol) — recommended:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `335fa09b125c25c4.vercel-dns-017.com` |

(Or switch nameservers to `ns1.vercel-dns.com` / `ns2.vercel-dns.com`.)

Redeploy:

```bash
npx vercel --prod
```

Local Postgres via Docker:

```bash
npm run db:up
# DATABASE_URL=postgresql://postgres:postgres@localhost:5433/jenns40th
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Generate Prisma client, migrate deploy, production build |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:up` | Start local Postgres (Docker) |
| `npm run db:wipe -- --yes` | Empty teams/users/anglers on the `.env` `DATABASE_URL` (Neon only; add `--local` for Docker) |
| `npm test` | Token, magic-link, and PIN unlock unit tests |
