# Phase 1 — Step 8: Analytics + rate limiting + usage/cost controls + operational hardening

**Status:** complete (19 Aug 2026)  
**Depends on:** [Phase 1 — Step 7](./PHASE-1-STEP-7.md)

This step did **not** add affiliate implementation, automated monetisation analysis, a product database, a recommendation engine, domain-based multi-brand routing, final legal content, or production deployment.

---

## Goals

- Collect **behavioural** GA4 events through normal web tagging (Google tag or Tag Manager), not Measurement Protocol as the primary path.
- Never send the user question or Ava’s answer to GA4. Conversation text stays in PostgreSQL (Step 7).
- Rate-limit conversation POSTs with `@fastify/rate-limit` (Fastify 5 / plugin 10.x).
- Bound in-flight OpenAI LLM and search calls so a traffic spike cannot queue a pile of paid requests.
- Store OpenAI token metadata on anonymous turns for later cost analysis.
- Harden request logs and health so operators can see non-sensitive status without leaking bodies, keys, or conversation text.
- Keep analytics configurable and off by default until the site owner has notice/consent in the Privacy Policy.

---

## GA4 architecture

Primary implementation is **browser tagging**:

```
Browser
  ├── next/script (afterInteractive Google tag or GTM)
  ├── gtag('event', ...) or dataLayer.push({ event })
  └── GA4 / GTM (site-owner configured)
```

There is **no** backend Measurement Protocol client. Measurement Protocol remains available later only as a supplement if the client needs server-side events; it is not used here.

Resolution order when `NEXT_PUBLIC_ANALYTICS_ENABLED=true`:

1. Valid `NEXT_PUBLIC_GTM_ID` (`GTM-…`) **or** brand `analytics.gtmId` → load **GTM only**.
2. Else valid `NEXT_PUBLIC_GA_MEASUREMENT_ID` (`G-…`) **or** brand `analytics.gaMeasurementId` → load **gtag**.
3. Else load nothing (even if the flag is on).

If both GTM and a GA4 ID are present, **GTM wins** so the same hits are not double-counted. ProductReviews brand analytics IDs stay `undefined`; env is the intended production switch.

`anonymize_ip` is set on gtag config. A small `afterInteractive` snippet strips the Ask Ava `q` query param and sets `page_location` to origin + path + hash so GA4 page views do not receive the question text from the URL. The existing client `stripAskAvaQuestionParam` still runs after hydration.

---

## Analytics event taxonomy

| Event | When | Parameters |
| --- | --- | --- |
| `ask_ava_start` | Landing composer submit or suggested-question click | `brand_id`, `entry` (`composer` \| `suggested_question`) |
| `ava_turn` | Conversation request finished | `brand_id`, `result` (`success` \| `error` \| `rate_limited` \| `capacity_limited`), `is_follow_up`, `has_sources` |
| `ava_retry` | User taps Try again | `brand_id` |
| `source_open` | User opens a validated source link | `brand_id`, `turn_number` (Ava reply index in the current session) |
| `comparison_view` | A comparison table is presented (once per Ava response, including React rerenders) | `brand_id`, `turn_number` |
| `help_ava_smarter_click` | User clicks the existing “Help make Ava smarter” CTA | `brand_id` |

`source_open` does not receive URL, href, or source title. `comparison_view` is deduped in the tracker by Ava message id; that id is never sent to GA4. `help_ava_smarter_click` does not receive the CTA href.

---

## Analytics parameters

Allowed primitives after sanitization: string, number, boolean.

Intended keys: `brand_id`, `entry`, `result`, `is_follow_up`, `has_sources`, `turn_number`, `page_location`.

---

## Excluded sensitive fields

`sanitizeAnalyticsParams` drops:

`question`, `answer`, `content`, `message`, `text`, `prompt`, `query`, `q`, `url`, `href`, `sources`, `title`, `user_message`, `ava_response`, `session_id`, `sessionId`, `client_session_id`, `email`, `name`, `phone`, `ip`.

Call sites never pass question/answer/session id. PostgreSQL remains the store for anonymous conversational content.

---

## GA configuration

| Variable | Role |
| --- | --- |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Master switch. Default **false**. |
| `NEXT_PUBLIC_GTM_ID` | Optional `GTM-…`. Preferred when set. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional `G-…` for direct Google tag. |

IDs that do not match `/^GTM-[A-Z0-9]+$/` or `/^G-[A-Z0-9]+$/` are ignored. Do not commit production IDs.

Plausible (`brand.analytics.plausibleDomain`) remains unwired.

---

## Analytics failure behaviour

All `track*` helpers wrap gtag/dataLayer in `try/catch`. Missing scripts, blocked tags, or thrown tracker errors do **not** change Ask Ava, conversation, retry, or layout behaviour.

---

## Rate-limit architecture

`@fastify/rate-limit` **10.x** is registered with `global: false`. Only `POST /api/v1/conversation/message` opts in.

| Setting | Default | Meaning |
| --- | --- | --- |
| `RATE_LIMIT_ENABLED` | `true` | Plugin + route config. `false` = unlimited. |
| `RATE_LIMIT_MAX` | `30` | Requests per window per IP. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window length. |

Exceeded requests receive **429** and the existing safe envelope:

```json
{ "error": { "code": "RATE_LIMITED", "message": "Ava is getting a lot of questions right now. Please try again in a moment." } }
```

Health is never limited. `skipOnError` is on so a limiter failure does not take the API down.

---

## Rate-limit identity strategy

Key = `request.ip` only.

Not used: `sessionId`, cookies, device fingerprint, user-agent, or conversation text.

The browser `sessionId` is an anonymous handle for logging (Step 7), not a rate-limit identity.

---

## Proxy handling

`TRUST_PROXY` (default `false`) is passed to Fastify `trustProxy`.

- `false`: `X-Forwarded-For` is ignored; all local/dev traffic shares the socket address.
- `true`: Fastify honours forwarded client IP (required behind a reverse proxy in production).

Mis-enabling `TRUST_PROXY` on a public socket would let clients spoof IPs. Leave it false until the process is actually behind a trusted proxy.

---

## Rate-limit UX

No conversation layout redesign.

429 `RATE_LIMITED` and in-process `CAPACITY_LIMITED` reuse the existing error card and **Try again** button, with `brand.conversation.rateLimitMessage` instead of the generic error copy.

---

## AI usage telemetry

Successful turns may store:

- `prompt_tokens`, `completion_tokens`, `total_tokens` from OpenAI Chat Completions `usage`
- `search_duration_ms` from the retrieval step

This is cost **metadata**, not a billing engine. Mock Ava turns store nulls. Failed turns do not invent token counts.

---

## Database migration

`backend/src/modules/database/migrations/002_usage_telemetry.sql`

Adds nullable integer columns with `>= 0` checks:

- `prompt_tokens`
- `completion_tokens`
- `total_tokens`
- `search_duration_ms`

Applied by the existing migrator (sorted filenames). Idempotent `IF NOT EXISTS` / drop-and-add check constraints.

No identity, email, IP, or profile columns were added.

---

## Token metadata

| Column | Source |
| --- | --- |
| `prompt_tokens` | `completion.usage.prompt_tokens` |
| `completion_tokens` | `completion.usage.completion_tokens` |
| `total_tokens` | `completion.usage.total_tokens` |

Null when the provider omits usage (including mock).

---

## Concurrency controls

| Variable | Default | Behaviour |
| --- | --- | --- |
| `AI_MAX_CONCURRENT_REQUESTS` | `4` | In-flight OpenAI Chat Completions |
| `SEARCH_MAX_CONCURRENT_REQUESTS` | `4` | In-flight OpenAI web-search Responses calls |

When the gate is full the request is **rejected** (`429` / `CAPACITY_LIMITED`) rather than queued. Slots are released on success or failure.

Search capacity errors are not swallowed as “search failed”; they abort the turn so Ava does not continue without retrieval while the process is overloaded.

---

## Request safeguards

- Conversation body limit and timeouts from earlier steps unchanged.
- Rate limit on conversation POST only.
- Concurrency gates on paid provider adapters only.
- Logger request serializer is method + URL only (`disableRequestLogging` plus a structured `onResponse` hook).
- Error handler logs `code` / `statusCode` (and `err` for 5xx) without request bodies or conversation text.

---

## Operational logging

`onResponse` emits:

```json
{ "type": "http", "method": "POST", "url": "/api/v1/conversation/message", "statusCode": 200, "durationMs": 123 }
```

Persistence failures still emit Step 7 `PERSISTENCE_FAILED` without SQL or connection strings.

---

## Health changes

`GET /api/v1/health` may include:

```json
"rateLimit": { "enabled": true }
```

alongside existing `database`, `aiProvider`, and `searchProvider`. No keys, limits, or client IPs are exposed.

---

## Privacy / consent boundary

Google documents that the site owner is responsible for appropriate notice/consent for analytics features they use.

This codebase:

- defaults analytics **off**
- does not load GTM/gtag unless enabled and an ID validates
- does not send conversation text to GA4
- does **not** add a cookie banner or final Privacy Policy copy (legal content is deferred)

Turn analytics on only after the client’s notice/consent position is decided.

---

## Retention status

Unchanged from Step 7: anonymous conversation rows have **no automatic deletion** until the client confirms a retention period.

Token columns follow the same table and the same pending retention policy.

---

## Test matrix / results

See “Build / lint / typecheck / tests” below. Coverage added this step:

| Case | Result |
| --- | --- |
| Analytics sanitizer drops question/answer/session/url | pass |
| `source_open` / `comparison_view` / `help_ava_smarter_click` fire with allowed params only | pass |
| `comparison_view` is not repeated for the same response | pass |
| Source URL, title, conversation text, and session IDs stay excluded | pass |
| Analytics-disabled mode emits nothing | pass |
| GA4 / GTM ID format checks | pass |
| Rate limit: 3rd conversation POST in a max=2 window → 429 `RATE_LIMITED` | pass |
| Health is not rate-limited | pass |
| `RATE_LIMIT_ENABLED=false` → unlimited | pass |
| `TRUST_PROXY=false` ignores `X-Forwarded-For` | pass |
| `TRUST_PROXY=true` keys by forwarded IP | pass |
| Concurrency gate rejects at max with `CAPACITY_LIMITED` | pass |
| Env defaults / invalid concurrency bounds | pass |
| Token + `search_duration_ms` persist (memory + Postgres after 002) | pass |
| Step 7 conversation logging + live Postgres suite | still pass |

---

## Frontend regression

No Ask Ava / conversation UI redesign. Landing, composer, suggested questions, messages, sources, follow-ups, comparison tables, retry, and `sessionStorage` behaviour are unchanged except:

- optional rate-limit copy on the existing error card
- analytics event hooks that do not render extra UI

Viewports unchanged: **1440×900**, **768×1024**, **390×844**.

---

## Files created / changed

**Created**

- `backend/src/modules/database/migrations/002_usage_telemetry.sql`
- `backend/src/common/concurrency.ts`
- `backend/src/common/gates.ts`
- `backend/src/common/middleware/rate-limit.ts`
- `backend/src/common/concurrency.test.ts`
- `backend/src/common/middleware/rate-limit.test.ts`
- `backend/src/common/analytics-sanitize.test.ts`
- `backend/src/common/analytics-events.test.ts`
- `frontend/src/lib/analytics/config.ts`
- `frontend/src/lib/analytics/events.ts`
- `frontend/src/lib/analytics/runtime.ts`
- `frontend/src/components/AnalyticsScripts.tsx`
- `docs/PHASE-1-STEP-8.md`

**Changed**

- `backend/src/config/env.ts`, `backend/.env.example`, `backend/src/config/env.test.ts`
- `backend/src/app.ts`
- `backend/src/common/errors/error-handler.ts`
- `backend/src/modules/conversation/routes.ts`, `service.ts`
- `backend/src/modules/health/routes.ts`
- `backend/src/modules/ai/llm-provider.ts`, `openai-provider.ts`
- `backend/src/modules/search/openai-web-search-provider.ts`
- `backend/src/modules/ava/orchestrator.ts`, `ava-telemetry.ts`
- `backend/src/modules/logging/*` (token / search-duration fields)
- `backend/src/modules/database/database-types.ts`
- `backend/package.json`
- `shared/src/index.ts`
- `frontend/.env.example`
- `frontend/src/app/layout.tsx`
- `frontend/src/brands/types.ts`, `productreviews.ts`
- `frontend/src/lib/api/conversation-client.ts`
- `frontend/src/conversation/types.ts`, `use-conversation-session.ts`
- `frontend/src/components/AskAvaPanel.tsx`
- `frontend/src/components/SuggestedQuestionBubble.tsx`
- `frontend/src/components/AvaLearningSection.tsx`
- `frontend/src/components/conversation/ConversationView.tsx`
- `frontend/src/components/conversation/ConversationError.tsx`
- `frontend/src/components/conversation/AvaMessage.tsx`
- `frontend/src/components/conversation/MessageList.tsx`
- `frontend/src/components/conversation/StructuredResponse.tsx`
- `frontend/src/components/conversation/SourceReferences.tsx`
- `frontend/src/components/conversation/ComparisonTable.tsx`

---

## Environment variables

**Backend** (do not commit production values)

| Name | Default | Notes |
| --- | --- | --- |
| `TRUST_PROXY` | `false` | Fastify `trustProxy` |
| `RATE_LIMIT_ENABLED` | `true` | Conversation POST only |
| `RATE_LIMIT_MAX` | `30` | Per IP per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | |
| `AI_MAX_CONCURRENT_REQUESTS` | `4` | 1–32, reject when full |
| `SEARCH_MAX_CONCURRENT_REQUESTS` | `4` | 1–32, reject when full |

**Frontend**

| Name | Default | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | `false` | Master switch |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | empty | `G-…` only |
| `NEXT_PUBLIC_GTM_ID` | empty | `GTM-…` only |

---

## Build / lint / typecheck / tests

| Check | Result |
| --- | --- |
| `npm run build` | pass (backend `tsc --noEmit`, frontend Next.js 16.3.1 production build) |
| `npm run lint` | pass |
| `npm run typecheck` | pass (shared + backend; frontend `tsc --noEmit` also pass) |
| `npm run test` | **109 passed**, including live PostgreSQL migration 002 + repository tests |

---

## Intentionally deferred functionality

- Affiliate implementation / commercial relationship engine
- Automated monetisation / category analysis of stored conversations
- Product database and recommendation engine
- Domain-based multi-brand hostname routing
- Final Privacy Policy, cookie banner, and legal copy
- Measurement Protocol as a primary or backup analytics channel
- Plausible runtime
- Redis-backed shared rate-limit store (in-memory per process is enough for Phase 1)
- Billing / spend caps beyond concurrency + HTTP rate limits
- Admin dashboards / conversation viewer
- User accounts, saved history, cross-device memory
- Automatic data deletion (awaiting retention decision)
- Production deployment
