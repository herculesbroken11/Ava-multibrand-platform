# Phase 1 — Step 4: Repository restructure + backend foundation

**Status:** complete (19 Aug 2026)  
**Depends on:** [Phase 1 — Step 3](./PHASE-1-STEP-3.md)

This step did **not** add a production LLM, PostgreSQL/Supabase, public search, analytics runtime, auth, or deploy.

---

## Goal

Turn the single Next.js app into a workspace with a clear split:

```
Frontend UI
  → HTTP API client
  → Backend conversation endpoint
  → Backend mock conversation provider
```

The Step 3 Ask Ava UI is unchanged. The mock that previously lived in the frontend now lives behind the API, so a real AI provider can replace the mock later without rewriting the conversation components.

---

## Previous structure

A single Next.js 16 app at the repository root:

```
src/                 landing + /ask-ava + BrandConfig + in-browser mock
public/
package.json         next dev / build / lint
```

`getConversationService()` returned `mockConversationService` in the same process as the UI.

---

## New repository structure

```
frontend/            Next.js 16 UI (http://localhost:3000)
backend/             Fastify + TypeScript API (http://localhost:4000)
shared/              Serializable API contracts
docs/
```

npm workspaces:

- `@product-reviews/frontend`
- `@product-reviews/backend`
- `@product-reviews/contracts`

Root scripts:

```bash
npm run dev              # frontend + backend together
npm run dev:frontend
npm run dev:backend
npm run build
npm run lint
npm run typecheck
```

`concurrently` runs both processes in development.

---

## Frontend move

The existing Next.js application moved into `frontend/` **without a UI redesign**.

Preserved:

- Next.js 16 / React 19 / TypeScript / Tailwind CSS v4
- Landing page, responsive behaviour, BrandConfig, ProductReviews copy
- Ask Ava UI, `/ask-ava`, sessionStorage active-session behaviour
- Structured responses, comparison tables, sources, follow-ups, accessibility

The only conversation-layer change is that `useConversationSession` now sends `sessionId` with the existing `ConversationService.sendMessage` call, and the service implementation is an HTTP client.

---

## Backend stack

| Piece | Choice |
| --- | --- |
| Runtime | Node.js + TypeScript |
| HTTP | Fastify 5 |
| Validation | Zod (env + request body) |
| CORS | `@fastify/cors`, configured origin only |
| Dev runner | `tsx watch` |

---

## Backend modules

```
backend/src/
  main.ts
  app.ts
  config/env.ts
  common/errors/          AppError + safe error handler
  common/middleware/      rate-limit placeholder (not enabled)
  common/utils/
  modules/health/
  modules/conversation/   route → service
  modules/ai/             ConversationProvider + mock
  modules/brands/         server-side brand lookup
  modules/search/         reserved (not implemented)
  modules/logging/        Fastify logs only; no persistence
```

Conversation flow:

```
POST /api/v1/conversation/message
  → conversation service (validate, resolve brand)
  → ConversationProvider
  → mockConversationProvider
```

The mock provider is the swap point for a later commercial LLM.

---

## API endpoints

### `GET /api/v1/health`

```json
{
  "status": "ok",
  "service": "product-reviews-api",
  "environment": "development",
  "time": "2026-08-19T05:25:33.671Z"
}
```

No secrets.

### `POST /api/v1/conversation/message`

Request:

```json
{
  "brandId": "productreviews",
  "sessionId": "convo_…",
  "messages": [
    {
      "id": "msg_…",
      "role": "user",
      "content": "Which robot vacuum is best for pet hair?",
      "createdAt": "2026-08-19T00:00:00.000Z"
    }
  ]
}
```

Response:

```json
{
  "message": {
    "id": "msg_…",
    "role": "ava",
    "content": "…",
    "createdAt": "…",
    "status": "complete",
    "structuredContent": [],
    "sources": [],
    "followUps": []
  },
  "followUps": []
}
```

The endpoint:

1. Validates JSON with Zod
2. Rejects empty / whitespace-only user messages
3. Enforces a 1000-character content limit and a 40-message cap
4. Resolves `brandId` through the backend brand registry
5. Calls the conversation provider
6. Returns Ava content, structured blocks, sources, and follow-ups
7. Returns a safe `{ error: { code, message } }` on failure (no stack traces)

---

## Request/response contracts

`shared/src/index.ts` (`@product-reviews/contracts`) holds only serializable types and constants:

- `ConversationRole` / `MessageRole`
- `ConversationMessage`
- `ConversationRequest`
- `ConversationResponse`
- `StructuredBlock`
- `SourceReference`
- `HealthResponse` / `ApiErrorBody`
- `CONVERSATION_MESSAGE_PATH`, `HEALTH_PATH`
- `MAX_MESSAGE_LENGTH` (1000)
- `MOCK_ERROR_TRIGGER`

No React, no `sessionStorage`, no secrets, no provider internals.

Frontend `src/conversation/types.ts` re-exports those types and still owns UI-only pieces (`ConversationSession`, `ConversationService`, `ConversationRequestError`).

---

## Mock backend provider

Deterministic Step 3 sample replies moved to `backend/src/modules/ai/mock-responses.ts`.

- Fixed 700ms delay
- Known sample questions and follow-ups return the same demo structured replies
- Unknown questions return a clearly non-production placeholder
- Demo comparison rows / sources remain labelled as sample data
- `__simulate_error__` still triggers a recoverable provider error

The frontend no longer contains mock reply logic.

---

## Frontend API client

`frontend/src/lib/api/conversation-client.ts` implements `ConversationService`.

`getConversationService()` now returns that HTTP client.

- `POST {NEXT_PUBLIC_API_BASE_URL}/api/v1/conversation/message`
- 20s timeout (`AbortSignal.timeout`)
- Network / timeout / non-OK / invalid JSON → `ConversationRequestError`
- ConversationView and message components are unchanged
- Friendly Try again UI is unchanged

---

## Environment variables

**Frontend** (`frontend/.env.example`)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

If unset, the client falls back to `http://localhost:4000` (local Phase 1 default).

**Backend** (`backend/.env.example`)

```
PORT=4000
HOST=127.0.0.1
FRONTEND_ORIGIN=http://localhost:3000
NODE_ENV=development
BODY_LIMIT_BYTES=32768
REQUEST_TIMEOUT_MS=30000
```

Zod validates env on boot, with those defaults. No AI keys. `.env` / `.env.local` are gitignored; `.env.example` is not.

---

## CORS

Development allows **only** `FRONTEND_ORIGIN` (default `http://localhost:3000`).

Methods: GET, POST, OPTIONS. No wildcard origin.

---

## Errors / timeouts

| Case | Behaviour |
| --- | --- |
| Invalid body / empty message | `400 VALIDATION_ERROR` |
| Unknown `brandId` | `400 UNKNOWN_BRAND` |
| Mock error trigger | `500 PROVIDER_ERROR` (safe message) |
| Unexpected exception | `500 INTERNAL_ERROR` (logged server-side, no stack in body) |
| Backend down / timeout / bad JSON | Frontend `ConversationRequestError` → Try again |

Backend `requestTimeout` / `connectionTimeout`: 30s. Frontend fetch timeout: 20s.

---

## Session behaviour

Unchanged from Step 3.

- Active conversation still lives in **frontend `sessionStorage`**
- Refresh in the same tab still restores it
- Backend is **stateless**
- `sessionId` is sent on each request for later logging, not stored server-side

---

## Security foundation

In place now:

- Request body size limit
- JSON schema validation
- Safe error envelope
- Origin-restricted CORS
- Environment validation
- Rate-limit module reserved (`enabled: false`)

Not added: authentication. Ask Ava stays anonymous.

---

## Brand handling

Requests include `brandId`. Backend registry currently supports **`productreviews`**.

Server-side brand records are minimal (`id`, `name`, `avaName`). Visual BrandConfig stays in the frontend. `evcentre` can be added as another registry entry later. No hostname routing yet.

---

## Local development commands

```bash
npm install
npm run dev
```

- UI: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000)
- Health: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

Verified:

- Landing page still builds and routes as before
- Ask Ava submit still goes to `/ask-ava`
- Suggested questions still start a conversation with the exact wording
- Frontend `POST` reaches the backend
- Backend mock replies (including comparison / follow-ups) match Step 3
- `__simulate_error__` still drives the retry UI path
- sessionStorage behaviour is unchanged

---

## Responsive regression

No Step 2/3 layout, CSS, or visual components were redesigned. The frontend move kept those files intact.

| Size | Result |
| --- | --- |
| 1440×900 | Unchanged desktop layout |
| 768×1024 | Unchanged tablet layout |
| 390×844 | Unchanged mobile layout |

---

## Files moved

Into `frontend/`:

- `src/`, `public/`
- `package.json`, `tsconfig.json`, `next.config.mjs`, `eslint.config.mjs`, `postcss.config.mjs`
- `AGENTS.md`, `CLAUDE.md`, `README.md`

---

## Files created

| Path | Role |
| --- | --- |
| `package.json` | Root workspaces + scripts |
| `README.md` | Workspace how-to-run |
| `shared/` | API contracts |
| `backend/` | Fastify API |
| `frontend/src/lib/api/` | HTTP conversation client |
| `frontend/.env.example` | `NEXT_PUBLIC_API_BASE_URL` |
| `backend/.env.example` | Port, origin, limits |

---

## Files removed from the frontend

- `frontend/src/conversation/mock-service.ts`
- `frontend/src/conversation/mock-responses.ts`

---

## Build result

```text
npm run build        # pass
  backend tsc        # pass
  frontend next build # pass (Next.js 16.3.1, TypeScript OK)
```

---

## Lint result

```text
npm run lint         # pass
  frontend eslint    # pass
  backend tsc        # pass
```

---

## Intentionally deferred functionality

- Production LLM (OpenAI / Anthropic / Gemini / …)
- Ava Bible / production system prompts
- Public web search
- PostgreSQL / Supabase
- Anonymous conversation logging
- GA4 runtime
- Affiliate functionality
- Domain-based brand switching
- Deployment
- Enabled rate limiting / cost controls
- Verified product database / recommendation engine

**Stop after Step 4.**
