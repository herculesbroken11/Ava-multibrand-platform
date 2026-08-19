# Phase 1 — Step 7: Anonymous conversation database + logging

**Status:** complete (19 Aug 2026)  
**Depends on:** [Phase 1 — Step 6](./PHASE-1-STEP-6.md)

This step did **not** add GA4, affiliate logic, a reporting dashboard, user accounts, saved conversations, cross-device history, a product database, a recommendation engine, domain-based brand routing, or production deploy.

---

## Goal

Add a lightweight PostgreSQL persistence layer that stores **anonymous** conversation data for later commercial and product analysis.

The database is **not** Ava’s memory and **not** a user-facing history store.

---

## sessionStorage vs anonymous database logging

| Layer | Purpose |
| --- | --- |
| Frontend `sessionStorage` | Current browser-session conversational memory: refresh, follow-ups, no accounts |
| PostgreSQL | Anonymous server-side business/research logging for later analysis |

Do **not** replace `sessionStorage` with PostgreSQL.

Do **not** restore old conversations to users from PostgreSQL.

The browser-generated `sessionId` (`convo_<uuid>`) is an opaque anonymous handle. It is not a user identity.

---

## Architecture

```
request
  ↓
search (when needed)
  ↓
Ava
  ↓
validated final result
  ↓
anonymous persistence (awaited)
  ↓
response
```

Logging sits **outside** Ava’s reasoning. Database rows are never injected into Ava prompts. Future recommendation/product engines must not treat this table as Ava’s knowledge base.

Conversation routes contain **no SQL**. Persistence goes:

`conversation service` → `ConversationLoggingService` → `ConversationLogRepository` → PostgreSQL

---

## Database architecture

Application boundary: **`DATABASE_URL`**.

The `pg` pool talks ordinary PostgreSQL. There is no Supabase client. The same schema can later be hosted by Supabase, AWS, Azure, Neon, Railway, or another PostgreSQL provider without rewriting conversation logic.

| Piece | Location |
| --- | --- |
| Connection pool | `backend/src/modules/database/database.ts` |
| Types | `database-types.ts` |
| Migrations | `backend/src/modules/database/migrations/` |
| Migrator | `migrate.ts` |
| Repository interface | `logging/conversation-repository.ts` + `logging-types.ts` |
| Postgres adapter | `postgres-conversation-repository.ts` |
| Logging orchestration | `logging-service.ts` |
| In-memory test adapter | `memory-conversation-repository.ts` |

---

## Schema

### `conversation_sessions`

| Column | Role |
| --- | --- |
| `id` | Server UUID primary key |
| `client_session_id` | Opaque frontend session id (max 128) |
| `brand_id` | Server-resolved brand (`productreviews`) |
| `domain` | Canonical domain from the backend brand registry (`productreviews.com.au`) |
| `started_at` | First logged turn |
| `last_activity_at` | Last logged turn (for later abandonment inference) |
| `turn_count` | Number of logged user→Ava exchanges |
| `follow_up_count` | `turn_count - 1` after each turn; initial question is not a follow-up |
| `created_at` / `updated_at` | Row timestamps |

Unique: `(brand_id, client_session_id)`.

Indexes: brand, last_activity_at (retention-ready).

### `conversation_turns`

| Column | Role |
| --- | --- |
| `id` | UUID |
| `session_id` | FK → sessions |
| `turn_number` | 1-based order inside the session |
| `user_message` | Latest user question (clipped to API max 1000) |
| `ava_response` | Ava text; null on failure before a reply |
| `structured_response` | JSONB of validated structured blocks |
| `ai_provider` / `ai_model` | e.g. `openai` / `gpt-4o-mini`, or `mock` / `mock` |
| `response_duration_ms` | See timing definition below |
| `request_status` | `success` \| `failed` |
| `error_code` | Safe API code only (`PROVIDER_TIMEOUT`, …) |
| `search_used` | boolean |
| `search_intent` / `search_status` / `search_provider` | Step 6 subset |
| `search_result_count` | integer |
| `sources` | JSONB of **trusted** `SourceReference` objects only |
| `created_at` | Turn timestamp |

Unique: `(session_id, turn_number)`.

Indexes: session_id, created_at, request_status.

JSONB is used for structured blocks and sources only — not the whole conversation as one blob.

---

## Session upsert

First logged turn for a `(brand_id, client_session_id)` inserts the session.

Later turns reuse it and update `last_activity_at`, `turn_count`, `follow_up_count`, `updated_at`.

Implementation: `INSERT … ON CONFLICT DO NOTHING`, then `SELECT … FOR UPDATE`, then increment counts in the same transaction. Concurrent requests serialize on the session row, so turn numbers cannot duplicate.

---

## Turn numbering

- First user→Ava exchange: **turn 1**
- Next: **turn 2**, etc.

Ordering does not rely on timestamps alone.

---

## Success logging

After Ava produces a validated response, the service stores session + turn, user message, Ava reply, structured blocks, provider/model, duration, success status, search metadata, and **backend-validated** sources.

Model-invented URLs already rejected in Step 6 are not persisted.

Full retrieved webpage text / SOURCE evidence blocks are **not** stored.

---

## Failure logging

If the request was accepted (brand + message valid) and Ava/search/provider fails, a failed turn is recorded when the database is available:

- `request_status = failed`
- `error_code` = existing safe API code
- `ava_response` = null

Not stored: stack traces, API keys, SDK bodies, SQL.

Malformed/abusive/validation/unknown-brand rejections are **not** logged as conversation turns.

---

## Search metadata

Stored conversation-level subset from Step 6:

`search_used`, `search_intent`, `search_status`, `search_provider`, `search_result_count`

Sources = trusted references returned to the frontend.

---

## Response timing

`response_duration_ms` is milliseconds from **after conversation-service validation** until the **validated Ava response is ready**.

Persistence time is not included. Values are milliseconds, never seconds.

---

## Provider / model metadata

Real AI turns store the configured provider and model (currently `openai` + `AI_MODEL`).

Mock conversations are identifiable: `ai_provider = mock`, `ai_model = mock`.

Credentials are never stored.

---

## Current session end / abandonment

There is no invented session-end event.

`started_at`, `last_activity_at`, `turn_count`, and `follow_up_count` are enough for later analysis to infer likely ending/abandonment. No abandonment job or dashboard in this step.

---

## Privacy / data minimisation

This is anonymous conversation storage, not user profiling.

Not collected / not in the schema:

- name, email, phone
- account / auth identities
- payment identifiers
- advertising identifiers
- persistent device IDs
- browser fingerprints
- IP addresses

No user/profile tables.

Users may voluntarily type personal information into free-text questions. The application does **not** create identity fields from that text. No automated PII classifier in Step 7.

---

## Database failure behaviour

If Ava succeeds and persistence fails:

1. Log a safe server-side `{ type: "conversation_persistence", status: "failed", code: "PERSISTENCE_FAILED" }` (no SQL, no connection string)
2. Still return the valid Ava response
3. Do not claim persistence succeeded

The write is **awaited**, then failure is handled, then the response is returned. Not fire-and-forget.

If Ava fails: attempt a failed-turn row if the database is healthy, then return the existing safe API error. A database error must not replace the provider error shown in Try again.

`DATABASE_ENABLED=false` uses a no-op logger and never opens a pool.

`DATABASE_ENABLED=true` without `DATABASE_URL` fails configuration/startup. There is no silent disable.

---

## Migration process

```bash
npm run db:migrate
```

Applies versioned SQL from `backend/src/modules/database/migrations/`, tracked in `schema_migrations`.

Current file: `001_conversation_logging.sql`.

Requires `DATABASE_ENABLED=true` and `DATABASE_URL`.

---

## Local PostgreSQL setup

Docker Compose (narrow: Postgres only):

```bash
npm run db:up          # docker compose up -d postgres
# set backend DATABASE_ENABLED=true and DATABASE_URL
npm run db:migrate
npm run dev
npm run db:down        # docker compose stop postgres
```

Example (not production) URL:

`postgresql://ava:ava@127.0.0.1:5432/productreviews`

The frontend never connects to PostgreSQL.

Automated tests start a real PostgreSQL cluster via `embedded-postgres` (not mocks) so schema and concurrency are verified without Docker.

---

## Environment variables

```
DATABASE_ENABLED=false
DATABASE_URL=postgresql://ava:ava@127.0.0.1:5432/productreviews
DATABASE_POOL_MAX=10
```

| Variable | Notes |
| --- | --- |
| `DATABASE_ENABLED` | `true` / `false`. Default false for local UI/mock work |
| `DATABASE_URL` | Required when enabled. `postgres://` or `postgresql://` only |
| `DATABASE_POOL_MAX` | Pooled connections, default 10, max 50 |

Do not commit real credentials. Do not log `DATABASE_URL`. Do not put a `NEXT_PUBLIC_` database URL on the frontend.

---

## Retention-policy status

**Retention duration pending client/policy confirmation.**

The schema is ready for later retention on `created_at` / `last_activity_at`. No automatic deletion in Step 7.

Suggested client question (business, not technology):

> As we’re now implementing the anonymous conversation storage included in Phase 1, one item I’ll need to confirm before production is the data-retention period. Do you have a preferred period for keeping anonymous Ava conversations, or would you like me to recommend a practical retention policy for your review?

---

## Health check

`GET /api/v1/health` may include:

```json
"database": { "enabled": false, "reachable": false }
```

When enabled, `reachable` is a `SELECT 1` ping. Process `status` stays `"ok"` if logging is down so Ava is not taken offline.

Not exposed: host, username, password, connection string.

---

## Test results

**85 passed**, 0 failed.

Includes:

| ID | Case | Coverage |
| --- | --- | --- |
| A | First success → session + turn 1 | memory + Postgres |
| B | Same client session → turn 2 | memory + Postgres |
| C | `follow_up_count` | memory + Postgres |
| D | Different client session | memory + Postgres |
| E | Different brand IDs do not collide | memory + Postgres |
| F | Provider / model / duration | memory + Postgres |
| G | Search metadata + validated sources | memory + Postgres |
| H | Invented URL not stored | memory + Postgres |
| I | Provider failure → safe failed turn | memory + Postgres |
| J | DB down after Ava still returns the reply | service + throwing repo |
| K | No SQL/connection leak to caller | service + throwing repo |
| L | `DATABASE_ENABLED=false` needs no database | env + no-op logger |
| M | `DATABASE_ENABLED=true` without URL fails config | env |
| N | Concurrent turns, unique turn numbers | memory + Postgres |
| O | No IP/name/email/profile columns | live schema |
| P | Migration creates required tables; rerun is idempotent | live PostgreSQL |

---

## Frontend regression

No conversation UI redesign. No login, history, or account interface.

Existing behaviour remains: landing, Ask Ava submit, suggested questions, normal replies, sources, follow-ups, comparison tables, retry/error, refresh/`sessionStorage`.

Viewports unchanged: **1440×900**, **768×1024**, **390×844**.

---

## Files created / changed

**Created**

- `backend/src/modules/database/database.ts`
- `backend/src/modules/database/database-types.ts`
- `backend/src/modules/database/migrate.ts`
- `backend/src/modules/database/migrations/001_conversation_logging.sql`
- `backend/src/modules/logging/logging-types.ts`
- `backend/src/modules/logging/conversation-repository.ts`
- `backend/src/modules/logging/postgres-conversation-repository.ts`
- `backend/src/modules/logging/memory-conversation-repository.ts`
- `backend/src/modules/logging/logging-service.ts`
- `backend/src/modules/logging/get-logging-service.ts`
- `backend/src/modules/ava/ava-telemetry.ts`
- `backend/src/config/env.test.ts`
- `backend/src/modules/logging/*.test.ts`
- `docker-compose.yml`
- `docs/PHASE-1-STEP-7.md`

**Changed**

- `backend/src/config/env.ts`, `backend/.env.example`
- `backend/src/modules/conversation/service.ts`
- `backend/src/modules/ava/orchestrator.ts` (telemetry only; no SQL)
- `backend/src/modules/health/routes.ts`
- `backend/src/app.ts` (pool shutdown)
- `backend/src/modules/logging/index.ts`
- `shared/src/index.ts` (optional health.database)
- `backend/package.json`, root `package.json`
- `.gitignore`

---

## Build / lint / typecheck / tests

| Check | Result |
| --- | --- |
| `npm run build` | pass (backend `tsc --noEmit`, frontend Next.js 16.3.1 production build) |
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm run test` | **85 passed**, including live PostgreSQL migration + repository tests |

---

## Intentionally deferred

- GA4 runtime
- Production rate limiting / cost budgets
- Automatic commercial / affiliate / category analysis
- Admin / analytics / conversation-viewer dashboards
- User accounts, saved history, cross-device memory
- Returning-user identification
- Product database / recommendation engine
- Domain-based hostname routing
- Production deployment
- Automatic data deletion (awaiting retention decision)
