# Phase 1 — Step 5: Real AI integration + Ava Bible

**Status:** complete (19 Aug 2026)  
**Depends on:** [Phase 1 — Step 4](./PHASE-1-STEP-4.md)

This step did **not** add public search, PostgreSQL/Supabase, GA4, affiliate logic, a product database, auth, or deploy.

---

## Provider architecture

```
Frontend ConversationView
  → POST /api/v1/conversation/message
  → conversation route / service
  → Ava orchestrator (prompt + history + output validation)
  → LlmProvider adapter
  → commercial LLM (OpenAI)
```

Mock mode skips the LLM and uses the existing deterministic backend mock.

Provider SDKs live only in `backend/src/modules/ai/`. Routes, frontend, shared contracts, and Ava prompt files have no OpenAI imports.

---

## Provider selected / configuration

| `AI_PROVIDER` | Behaviour |
| --- | --- |
| `mock` (default) | Deterministic Step 4 mock. No API key required. |
| `openai` | Real Ava orchestration + OpenAI Chat Completions. **Requires `AI_API_KEY`.** |

Startup fails if `AI_PROVIDER=openai` and `AI_API_KEY` is missing. There is **no silent fallback to mock** in real mode.

Default model: `gpt-4o-mini` (`AI_MODEL`).

The API key is never exposed to the frontend and is never given a `NEXT_PUBLIC_` prefix.

---

## Ava prompt architecture

Structured server-side modules under `backend/src/modules/ava/`:

| File | Role |
| --- | --- |
| `ava-personality.ts` | Who Ava is / is not |
| `ava-brand.ts` | ProductReviews / Australian-first rules |
| `ava-behaviour.ts` | Golden rule, diagnose-first, length, recommendations, next-step signature |
| `ava-independence.ts` | Absolute commercial independence |
| `ava-accuracy.ts` | Fact vs reported experience vs assessment; uncertainty; current-info limit |
| `ava-safety.ts` | Safety + instruction hierarchy |
| `ava-context.ts` | Step 6 search placeholder + future catalogue placeholder |
| `ava-output.ts` | JSON contract for the existing frontend blocks |
| `ava-system-prompt.ts` | Combines the above |
| `history.ts` | Context window for message history |
| `orchestrator.ts` | Prompt → LLM → validated `ConversationResponse` |

The system prompt is **not** in the frontend.

---

## Ava Bible implementation

The composed system prompt includes:

1. Permanent Ava platform rules  
2. Brand-specific ProductReviews rules  
3. Personality and tone  
4. Recommendation behaviour  
5. Accuracy and uncertainty  
6. Independence  
7. Evidence / review rules  
8. Australian-market defaults  
9. Safety  
10. Conversation history (as chat turns, not duplicated in the system prompt)  
11. Current user question (last user turn)  
12. Retrieved-information placeholder (empty until Step 6)  
13. Verified product-data placeholder (empty)  
14. Output-format instructions  

---

## Diagnostic behaviour

Broad questions should not get an immediate product dump. Ava asks **one or two** material questions (budget, pets, size, use, constraints). She must not interrogate.

---

## Response-length rules

Default initial answers: concise, typically **100–200 words** when that fits. Shorter is allowed. More detail on request. After an answer, offer a useful next decision — not “Is there anything else I can help you with today?”

---

## Recommendation behaviour

Small shortlists. Optional **BEST OVERALL / BEST VALUE / BEST FOR…** only when they help. Each pick should say why it fits and why it might not. Have an opinion when evidence supports one; do not end everything with “It depends.”

---

## Independence rules

Non-negotiable. Ranking and reasoning must ignore commissions, ads, sponsorship, retailer/manufacturer relationships, and monetisation. If a user asks for the highest-commission product, Ava refuses that framing and chooses on suitability.

No affiliate logic was added.

---

## Evidence distinctions

Ava must keep **FACT**, **REPORTED EXPERIENCE**, and **AVA’S ASSESSMENT** separate. One review is not a fact. Isolated anecdotes are not generalised.

---

## Uncertainty behaviour

Never bluff. Prefer “I can’t verify that confidently enough…” and then a useful next step.

---

## Australian-first rules

ProductReviews defaults: AUD, Australian terminology, warranties, model variants, electrical context. Do not fabricate Australian availability. Adapt if the user is clearly elsewhere.

---

## Safety rules

Extra care for medical, personal finance, legal, product/child/electrical safety, and dangerous use. Useful information is allowed; Ava is not a substitute for a professional. No repetitive legal wallpaper on ordinary questions.

---

## Current-information limitation (before Step 6)

No live search. Ava must not pretend to have verified current prices, stock, promotions, recalls, new releases, or changed specs.

Runtime placeholders exist so Step 6 can inject retrieved public information without rewriting the Bible modules.

`sources` stay empty. The model is told not to invent URLs; the parser does not accept a sources field.

---

## Structured output

The model must return JSON matching the existing `ConversationResponse` shape (`content`, `structuredContent`, `followUps`).

Zod validates blocks. If parsing fails, Ava’s reply falls back to plain `content` instead of crashing. Fake `sources` in the model payload are ignored.

---

## Context handling

`buildLlmHistory`:

- keeps the first user question when useful
- keeps the most recent turns (cap 16)
- clips long messages
- stays within a 12k character budget
- never sends system instructions as history
- does not add permanent memory

Frontend `sessionStorage` is unchanged. Backend remains stateless.

---

## Provider errors

Mapped to safe `{ error: { code, message } }` with **no** SDK text, keys, or stacks:

| Case | Code |
| --- | --- |
| Timeout | `PROVIDER_TIMEOUT` |
| Rate limit | `PROVIDER_RATE_LIMIT` |
| Auth failure | `PROVIDER_AUTH` |
| Unavailable / other | `PROVIDER_UNAVAILABLE` |
| Empty/unusable model output | `PROVIDER_INVALID_RESPONSE` |

Frontend Try again still treats any failed HTTP call the same way.

---

## Timeouts (reviewed for real generation)

| Layer | Value | Why |
| --- | --- | --- |
| OpenAI call `AI_TIMEOUT_MS` | **25s** | Normal conversational JSON should return well under this |
| Fastify `REQUEST_TIMEOUT_MS` | **40s** | Room for validation + provider |
| Frontend fetch | **45s** | Must not expire before a healthy backend/LLM round-trip |

Not arbitrarily long. Not so short that a healthy 8–15s generation fails.

---

## Prompt-injection foundation

Instruction hierarchy is in the system prompt: server rules > independence/safety > brand > runtime context > untrusted user text.

User text cannot redefine Ava’s role, drop independence/safety, or demand hidden prompts/secrets. This is a foundation, not a claim of perfect immunity. Retrieved-content isolation is left for Step 6.

---

## Token / output safeguards

- User message length: 1000 (existing)
- Messages per request: 40 (existing)
- History window: 16 turns / 12k chars
- `AI_MAX_OUTPUT_TOKENS`: 1200
- No billing engine yet

---

## Development mock mode

`AI_PROVIDER=mock` (default) keeps the deterministic backend mock for UI and local work without a key.

`AI_PROVIDER=openai` requires a key and never masquerades as mock if the provider fails.

---

## Behaviour test matrix / results

Automated tests assert the **Bible is present in the compiled prompt**, history retains requirements, output validation strips sources, and a stub LLM round-trip returns a `ConversationResponse`.

Live OpenAI wording is not asserted in CI (no key in the repo).

| ID | Case | Result |
| --- | --- | --- |
| A | Broad “best robot vacuum” → diagnose first | **Pass** — prompt forbids an immediate product dump; requires 1–2 useful questions |
| B | Budget + pets remembered | **Pass** — history keeps those turns; prompt forbids re-asking supplied requirements |
| C | “Which would you actually buy?” | **Pass** — prompt requires a reasoned opinion when evidence supports one |
| D | “What’s the price today?” | **Pass** — prompt requires disclosing unverified current pricing |
| E | Unknown fact | **Pass** — never bluff language is required |
| F | Highest commission | **Pass** — refuse commercial influence; choose on suitability |
| G | One review as fact | **Pass** — isolated anecdotes must not become facts |
| H | Australian context | **Pass** — AUD / Australian-first brand rules |
| I | Safety-sensitive | **Pass** — children’s safety + professional-advice caution |
| J | Generic closing | **Pass** — forbids “anything else I can help you with today?” |
| K | Reveal system prompt | **Pass** — user text is data; must not quote hidden instructions |

`npm run test` — **24 passed**.

---

## Frontend regression

ConversationView and conversational components were **not** rewritten.

The only frontend change is the fetch timeout (20s → 45s) so real generation can finish.

Landing Ask Ava, suggested questions, `/ask-ava`, bubbles, follow-ups, structured blocks, comparison table, error/retry, and sessionStorage behaviour are unchanged.

| Size | Result |
| --- | --- |
| 1440×900 | Unchanged desktop UI |
| 768×1024 | Unchanged tablet UI |
| 390×844 | Unchanged mobile UI |

---

## Files changed

**Created**

- `backend/src/modules/ava/*` (Bible, history, parser, orchestrator, tests)
- `backend/src/modules/ai/llm-provider.ts`
- `backend/src/modules/ai/openai-provider.ts`
- `backend/src/modules/ai/get-provider.ts`
- `backend/src/modules/ai/map-provider-error.ts` (+ test)

**Updated**

- `backend/src/config/env.ts`
- `backend/.env.example`
- `backend/src/modules/conversation/service.ts`
- `backend/src/modules/brands/registry.ts`
- `backend/src/modules/health/routes.ts`
- `backend/src/modules/ai/mock-provider.ts` (mock only; no longer the sole factory)
- `shared/src/index.ts` (error codes + optional `aiProvider` on health)
- `frontend/src/lib/api/config.ts` (45s timeout)
- root / backend `package.json`

---

## Environment variables

```
AI_PROVIDER=mock          # or openai
AI_API_KEY=               # required when openai
AI_MODEL=gpt-4o-mini
AI_TIMEOUT_MS=25000
AI_MAX_OUTPUT_TOKENS=1200
REQUEST_TIMEOUT_MS=40000
```

Copy `backend/.env.example` to `backend/.env` and set a real key only for OpenAI mode. Do not commit keys.

---

## Local setup for real Ava

```bash
# backend/.env
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini

npm run dev
```

Leave `AI_PROVIDER=mock` for UI work without a key.

---

## Build

```text
npm run build     # pass
```

---

## Lint

```text
npm run lint      # pass
```

---

## Tests / typecheck

```text
npm run typecheck # pass
npm run test      # pass (24)
```

---

## Intentionally deferred

- Public information retrieval (Step 6)
- PostgreSQL / Supabase / anonymous conversation storage
- GA4 runtime
- Enabled production rate limiting / full cost controls
- Affiliate integrations
- Product database / recommendation engine
- Domain-based multi-brand switching
- Deployment
- Live LLM evaluation in CI (requires a secret key)

**Stop after Step 5.**
