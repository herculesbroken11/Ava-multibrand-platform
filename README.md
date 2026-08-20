# ProductReviews.com.au

Configurable AVA platform. **ProductReviews.com.au is the only production launch brand.**

```
frontend/   Next.js 16 UI (http://localhost:3000)
backend/    Fastify API (http://localhost:4000)
shared/     Serializable API contracts (@product-reviews/contracts)
docs/       Phase 1 step records and launch checklists
```

Phase 1 Steps 1–10 are complete. This repository is **not** a production deployment.

## Local run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Health: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health).

Copy `frontend/.env.example` → `frontend/.env` and `backend/.env.example` → `backend/.env` only if you need to override defaults. Local defaults use mock AI/search and do not require a paid key.

## Workspace scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Frontend + backend together |
| `npm run build` | Backend typecheck + Next.js production build |
| `npm run lint` | Frontend ESLint + backend `tsc` |
| `npm run typecheck` | shared, backend, and frontend `tsc --noEmit` |
| `npm run test` | Backend tests (no paid provider calls) |
| `npm run validate:brands` | Frontend + backend brand configuration |
| `npm run validate:production` | Production readiness (PASS / WARNING / BLOCKER) |
| `npm run db:up` | Local Postgres via Docker Compose |
| `npm run db:migrate` | Apply backend SQL migrations |
| `npm run db:down` | Stop local Postgres |

`validate:production` does **not** call OpenAI or search. It is expected to report blockers until client-owned production credentials, legal copy, and hosting values exist.

## Brand content

Landing copy, colours, images, legal page structure, and Ava public instructions live in `frontend/src/brands/`. Shared UI in `frontend/src/components/` reads `BrandConfig` only.

- Production brand: `frontend/src/brands/productreviews.ts`
- Approved copy lock: `frontend/src/brands/productreviews-approved-copy.ts`
- Test fixture only: `frontend/src/brands/testbrand.ts` (`testbrand.local` — not a public site)

```bash
npm run validate:brands
```

Unknown production hostnames do not fall back to ProductReviews. `DEFAULT_DEV_BRAND` is development/test only.

## Environment

Templates (no secrets):

| File | Use |
| --- | --- |
| `frontend/.env.example` | Local public values |
| `backend/.env.example` | Local server values |
| `frontend/.env.production.example` | Production public values |
| `backend/.env.production.example` | Production server values |

**Frontend public (browser):** `NEXT_PUBLIC_API_BASE_URL`, analytics flags/IDs, `DEFAULT_DEV_BRAND`, `TRUST_FORWARDED_HOST`.

**Backend secrets (server only):** `AI_API_KEY`, `DATABASE_URL`. Never prefix these with `NEXT_PUBLIC_`. Never commit them.

### AI and search

| Variable | Local default | Production requirement |
| --- | --- | --- |
| `AI_PROVIDER` | `mock` | `openai` (client commercial account) |
| `AI_API_KEY` | empty | present on the server |
| `AI_MODEL` | `gpt-4o-mini` | present |
| `SEARCH_PROVIDER` | `mock` | `openai` (or a later explicitly approved provider) |

Mock AI or mock search is not production-ready.

### Database

Anonymous conversation logging (not Ava’s memory, not the frontend).

- Production: `DATABASE_ENABLED=true` and a postgres `DATABASE_URL`
- `DATABASE_POOL_MAX` must be 1–50
- Retention: `CONVERSATION_RETENTION_DAYS` stays empty until the client approves a period. Automatic deletion is **not** enabled.

```bash
npm run db:up
npm run db:migrate
```

### Analytics

Off by default (`NEXT_PUBLIC_ANALYTICS_ENABLED=false`). The app works without it. If enabled, supply a valid `NEXT_PUBLIC_GA_MEASUREMENT_ID` (`G-…`) or `NEXT_PUBLIC_GTM_ID` (`GTM-…`). Conversation text is never sent to GA4/GTM.

### Rate limiting and concurrency

Conversation POST is rate-limited (`RATE_LIMIT_ENABLED`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`). In-flight OpenAI/search calls are bounded (`AI_MAX_CONCURRENT_REQUESTS`, `SEARCH_MAX_CONCURRENT_REQUESTS`). Defaults are not a capacity plan. Health is never limited.

### Hosts and proxy

Expected production CORS:

```
FRONTEND_ORIGIN=https://productreviews.com.au
FRONTEND_ORIGINS=https://productreviews.com.au,https://www.productreviews.com.au
```

Leave `TRUST_PROXY` and `TRUST_FORWARDED_HOST` **false** unless a trusted reverse proxy overwrites forwarded headers.

Production frontend must not use `http://localhost:4000`. Set `NEXT_PUBLIC_API_BASE_URL` to the chosen HTTPS API origin when hosting is decided.

## Production validation

```bash
npm run validate:production
```

Reports `PASS`, `WARNING`, and `BLOCKER`. Exits non-zero when blockers remain. Does not print secrets.

Launch policy treats placeholder legal pages, missing contact email, and an unconfirmed “Help make Ava smarter” destination as blockers.

Client-facing remaining inputs: [docs/CLIENT-PRODUCTION-INPUTS.md](docs/CLIENT-PRODUCTION-INPUTS.md)

Manual live AI/search checks: [docs/PRODUCTION-SMOKE-TEST.md](docs/PRODUCTION-SMOKE-TEST.md)

## Deployment prerequisites (not done in this repo step)

- Client-owned OpenAI credentials
- Production Postgres URL and migrations applied
- HTTPS frontend + HTTPS API origins
- DNS for `productreviews.com.au` and `www`
- Final legal and contact content in BrandConfig
- Explicit decision on analytics / retention

Do not deploy until `validate:production` is ready and the manual smoke test has been run on purpose.
