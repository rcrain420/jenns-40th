# Jen's 40th Birthday Fishing Tournament

Registration + admin console for the Oct 10, 2026 tournament in Rockport, TX (Boatmens at Cove Harbor Marina).

## Features

- Public landing page and team registration (optional AI team-name suggestions)
- Teams of 2–4 anglers; guided (captain) or non-guided (primary contact)
- $75 per fishing angler; Venmo payment link + QR (`public/venmo-qr.png`)
- Fishing license confirmation checkbox
- Soft cap of 25 teams; public registration closes Oct 1, 2026
- Catch log: anglers photograph fish; AI estimates breed, length, and weight; board grouped by angler
- Catch alerts: in-app notification bell + optional browser notifications on `/catches`
- Comments on each catch photo
- Shared event PIN gates catch uploads, comments, and AI name suggestions (fallback)
- Registration confirmation email includes a one-tap magic link that unlocks the same event session
- Admin console: dashboard, search/filter, edit/delete, mark paid, CSV export

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

Default admin password (from `.env`): `changeme`  
Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

Set `EVENT_PIN` in `.env` to exercise the catch/comment/AI unlock flow. Without it, those writes stay open in development only. Registration confirmation emails include a magic link that sets the same event session cookie; the PIN remains the fallback.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Local Docker Postgres or Neon connection string |
| `ADMIN_PASSWORD` | Shared organizer password |
| `SESSION_SECRET` | Cookie signing secret (32+ characters) |
| `EVENT_PIN` | Shared PIN for catch uploads, comments, and AI suggestions (required in production) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token; omit locally to store uploads under `public/uploads/catches` |
| `VENMO_URL` | Optional Venmo payment link override |
| `OPENAI_API_KEY` | Optional; enables AI fish estimates and team-name suggestions |
| `OPENAI_VISION_MODEL` | Optional; defaults to `gpt-4o-mini` |
| `OPENAI_TEAM_NAME_MODEL` | Optional; defaults to vision model or `gpt-4o-mini` |
| `NEXT_PUBLIC_APP_URL` | Optional canonical site URL for metadata and magic links |
| `RESEND_API_KEY` | Optional; sends registration confirmation + unlock emails |
| `RESEND_FROM` | Optional Resend from address (verified domain) |

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
| `npm test` | Token, magic-link, and PIN unlock unit tests |
