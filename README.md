# Jen's 40th Birthday Fishing Tournament

Registration + admin console for the Oct 10, 2026 tournament in Rockport, TX (Boatmens at Cove Harbor Marina).

## Features

- Public landing page and team registration (AI team-name suggestions after sign-in)
- Teams of 2–4 anglers; guided (optional captain) or non-guided (optional primary contact)
- $75 per adult angler; youth roster seats do not add entry; Venmo payment link + QR (`public/venmo-qr.png`)
- Fishing license confirmation checkbox
- Soft cap of 25 teams; public registration closes Oct 1, 2026
- Signed-in Teams directory of registered boats and roster names
- Catch log: anglers photograph fish; AI estimates breed (Redfish, Trout, Black drum, Hardhead catfish, Gafftop, or Unknown), length, and weight; board grouped by angler
- Catch alerts: in-app notification bell + optional browser notifications on `/catches`
- Comments on each catch photo
- Email + password accounts with confirmation; Google and Facebook sign-in when those env vars are set. Social accounts are verified immediately. Any confirmed user posts catches and comments as themselves
- Registration welcome email (registrant only) confirms the team, Venmo **Jennski** for entry with the amount due, and links to My Team (`/team`) to invite/share crew. Join the boat emails to rostered anglers stay separate. Unlock + invite links remain on `/register/success` if mail fails.
- Adding an angler email on register or Invite sends a Join the boat email. After they join they have full site access (team + Livewell post). Join is not captain and not the paid roster. Name-only adult seats create an account from the shared invite link. Youth seats stay parent-login. Everyone who uses the site signs in — there is no event PIN.
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

`/register/success` still shows the teammate invite and Open my team (create-account) links, so those do not depend on mail.

**Resend domain (ops):** account and registration emails need a verified sending domain. `officialishfishingtournament.com` must be added and verified in Resend; the app will not invent a From domain or fall back to Resend’s onboarding address (that address only delivers to the account owner). Until the domain is verified, expect provider 403s — the success page reports that mail did not send and still shows the links.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Local Docker Postgres or Neon connection string |
| `ADMIN_EMAIL` | Account email that is promoted to admin on signup/login |
| `SESSION_SECRET` | Cookie signing secret (32+ characters) |
| `RESEND_API_KEY` | Sends account confirm/reset, registration welcome, and Join the boat emails |
| `EMAIL_FROM` / `RESEND_FROM` | Optional From: header for Resend |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token; omit locally to store uploads under `public/uploads/catches` |
| `VENMO_URL` | Optional Venmo payment link override |
| `OPENAI_API_KEY` | Server-only. Enables Livewell fish estimates and team-name suggestions. **Set this on the Vercel Production env for `jenns-40th`**, then redeploy. Missing key: catch still logs as Unknown with **blank** size/weight and “Estimate unavailable because AI isn’t configured” (never a fake 18" / 3.5 lb) |
| `OPENAI_VISION_MODEL` | Optional; defaults to `gpt-4o-mini` (must support vision / image_url) |
| `OPENAI_TEAM_NAME_MODEL` | Optional; defaults to vision model or `gpt-4o-mini` |
| `NEXT_PUBLIC_APP_URL` | Optional canonical site URL for metadata and magic links |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional. Shows “Continue with Google” on the shared login form |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Optional. Shows “Continue with Facebook” on the shared login form |

Google / Facebook redirect URIs the app serves:

- `http://localhost:3000/api/auth/oauth/{google|facebook}/callback`
- `https://officialishfishingtournament.com/api/auth/oauth/{google|facebook}/callback`

Leave those env vars empty to keep email/password only. Production applies the `OAuthAccount` / nullable `passwordHash` migration on the next Vercel build (`prisma migrate deploy` is already in `npm run build`).

### Vercel: Livewell AI estimates

On [Vercel → Project → Settings → Environment Variables](https://vercel.com/docs/environment-variables), Production needs these **names** (values are secrets — set them in the dashboard, never commit them):

1. `OPENAI_API_KEY` — server secret for `POST /api/catches` vision estimates (same key team-name suggestions use). Do not prefix with `NEXT_PUBLIC_`. Must be present on the **Production** environment (Preview is separate). Redeploy after adding or rotating.
2. `BLOB_READ_WRITE_TOKEN` — usually injected when a Blob store is linked. Used to host the catch photo. Vision now inlines a modest JPEG data URL when the upload is small enough; the Blob URL is only a fallback for oversized files.

Optional: `OPENAI_VISION_MODEL` if you want something other than `gpt-4o-mini` (must support vision / `image_url`).

A missing `OPENAI_API_KEY` is not an infinite “Estimating with AI…” spinner. The catch still logs. Guests see **Estimate unavailable because AI isn’t configured** and **blank** length/weight — not a pretend 18" / 3.5 lb guess. Timeouts, HEIC skip, and provider errors each get their own guest-safe note.

**Production (`jenns-40th`):** set `OPENAI_API_KEY` on the Vercel Production environment, then redeploy. Do not commit the value. Without that key every Livewell upload takes the fallback path.

Vision `breed` is locked to **Redfish**, **Trout**, **Black drum**, **Hardhead catfish**, **Gafftop**, or **Unknown**. Unusable photos and estimate failures use Unknown — never a freeform “unidentified gulf fish”. Size/weight are omitted unless the model actually returned numbers.

### Venmo

The app defaults to Venmo handle `Jennski` (`https://venmo.com/u/Jennski`) with QR at `public/venmo-qr.png`. Leave `VENMO_URL` empty unless you need a full custom payment URL override.

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
| `npm test` | Token, invite-code, and auth unit tests |
