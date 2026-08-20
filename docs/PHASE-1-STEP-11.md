# Phase 1 — Step 11: End-to-end pre-production QA + defect correction

**Status:** complete (20 Aug 2026)  
**Depends on:** [Phase 1 — Step 10](./PHASE-1-STEP-10.md)

This step did **not** deploy production, add affiliate logic, a product database, a recommendation engine, EVCentre.au, an admin CMS, or a monetisation dashboard.

**Deployment recommendation: NOT READY FOR DEPLOYMENT.**

The software can be QA’d locally with mocks. Public launch is blocked by client-owned credentials, legal/contact content, hosting/API hostname, and production database — not by an unfinished Phase 1 feature.

---

## Scope

Validate Phase 1 as one integrated ProductReviews.com.au application:

- approved landing and responsive UI
- Ask Ava entry + conversation
- Ava Bible, search, source grounding
- PostgreSQL logging, analytics privacy, rate/capacity limits
- multi-brand hostname security
- legal/contact readiness
- production-readiness checker
- browser, accessibility, error/recovery

Correct genuine defects. Do not redesign or expand scope.

---

## Test environments

| Mode | Used | Notes |
| --- | --- | --- |
| **A. Automated / local** | Yes | Mock AI/search, in-process/test Postgres, Playwright against `localhost:3000` + `127.0.0.1:4000`, synthetic production config in unit tests |
| **B. Live production-like** | **Not run** | Client-owned OpenAI key, production search, production DB, HTTPS API hostname, and approved analytics IDs are not available |

Paid OpenAI/search calls were **not** made from `build`, `test`, `validate:production`, or Playwright.

Playwright engines: Chromium, Firefox, WebKit (Windows). Native Apple Safari was not available.

Date: 20 Aug 2026.

---

## Requirements audit

| ID | Requirement | Result |
| --- | --- | --- |
| A | One shared configurable platform | **PASS** |
| B | ProductReviews.com.au first launch brand | **PASS** |
| C | Multi-brand config boundary (`testbrand` fixture only) | **PASS** |
| D | Landing based on approved visual direction | **PASS** |
| E | Ask Ava entry box | **PASS** |
| F | Suggested questions (exact eight) | **PASS** |
| G | Immediate conversation start | **PASS** |
| H | Original question auto-submitted | **PASS** |
| I | Current-session memory only | **PASS** |
| J | No user accounts | **PASS** |
| K | Responsive comparison tables | **PASS** |
| L | Commercial AI integration | **BLOCKED FOR PRODUCTION** (architecture **PASS**; client key pending) |
| M | Ava Bible | **PASS** (prompt/contract tests). Live model behaviour **PENDING CLIENT INPUT** |
| N | Current public information retrieval | **PASS** (decision/failure/source tests). Live search **PENDING CLIENT INPUT** |
| O | Trusted source handling | **PASS** |
| P | Anonymous conversation storage | **PASS** (tests). Production DB **PENDING CLIENT INPUT** |
| Q | Basic analytics | **PASS** (off by default; sanitised events when enabled) |
| R | Rate limiting / safeguards | **PASS** |
| S | Mobile / tablet / desktop | **PASS** |
| T | One initial production brand | **PASS** |
| U | Config-as-code rather than CMS | **PASS** |
| V | Future verified product database boundary | **PASS** (not built; not a defect) |
| W | Documentation / handover | **PASS** |

Missing future-scope items (affiliate, catalogue, CMS, EVCentre) are **not** defects.

---

## Copy audit

Programmatic lock: `frontend/src/brands/productreviews-approved-copy.ts` + readiness test O.

Playwright landing check (Chromium / Firefox / WebKit): hero, trust lines, handwritten note, Ask Ava, eight questions, independence, learning CTA, footer.

Wording was **not** rewritten.

---

## Responsive results

Chromium overflow checks at:

1920×1080, 1440×900, 1280×800, 1024×768, 768×1024, 430×932, 390×844, 375×812, 320×568

on `/` and `/ask-ava`: **PASS** (no element extending past the viewport).

Firefox/WebKit: landing 1440×900 overflow **PASS**; full viewport matrix skipped to keep the suite practical.

Composer, suggested questions, legal/footer wrap, and comparison (mobile cards + desktop `overflow-x-auto`) were checked. `html, body { overflow-x: hidden }` remains the Step 2 clip; overflow tests also inspect element `getBoundingClientRect()`.

---

## Browser results

| Engine | Landing | Ask Ava / conversation | Legal | Notes |
| --- | --- | --- | --- | --- |
| Chromium | PASS | PASS | PASS | Full viewport matrix |
| Firefox | PASS | PASS | PASS | Playwright Firefox |
| WebKit | PASS | PASS | PASS | Playwright WebKit on Windows; **not** native macOS Safari |

Limitation: native Safari on Apple hardware was not available. WebKit is the closest automated stand-in.

---

## Accessibility results

Automated: `@axe-core/playwright` on `/` and `/privacy` (WCAG 2 A/AA). **`color-contrast` disabled** so approved brand colours are not treated as defects.

Targeted checks / corrections:

- Conversation region has `role="region"` + label
- Follow-ups are a labelled group
- Source links announce that they open in a new tab
- Duplicate screen-reader comparison caption removed
- Empty chat send control is disabled
- Labels, `min-h-11` targets, `focus-visible`, `prefers-reduced-motion`, hero `alt`, `aria-live` status remain

No extra ARIA beyond those fixes.

---

## Ask Ava flow

| Check | Result |
| --- | --- |
| Blank landing submit rejected | PASS |
| Valid question navigates; exact text preserved; auto-submitted | PASS |
| Suggested question starts immediately | PASS |
| Refresh restores session; first question not duplicated | PASS |
| No accounts / long-term history UI | PASS |

---

## Conversational UX

Covered by Playwright + existing session logic: first message, loading, refresh, 1000-character `maxLength`, empty send disabled, comparison + sources on the Dyson/Shark mock reply.

Follow-ups, retry, multiline (Shift+Enter), and duplicate-send-while-loading remain as previously implemented; no regressions found that required a redesign.

---

## Ava Bible QA

Automated `ava.test.ts` scenarios A–K **PASS** (compiled prompt / contract needles). That does **not** prove a live model will always obey the Bible.

Live provider checks A–J from this step: **PENDING CLIENT INPUT** (no paid run). Use [PRODUCTION-SMOKE-TEST.md](./PRODUCTION-SMOKE-TEST.md) when credentials exist.

---

## Current-search QA

Automated: search decision (no search on broad undiagnosed questions; price/stock/recall search; AU default), timeout/no-results soft-fail, capacity abort, Australian query framing.

Live price/availability/recall/source URL checks: **PENDING CLIENT INPUT**.

---

## Search failure QA

| Simulation | Result |
| --- | --- |
| Timeout / provider throw | Soft-fail; turn continues; prompt forbids invented current facts |
| No results | `no_results`; essential facts must be marked unverified |
| Capacity | `CAPACITY_LIMITED` (no unbounded queue) |

---

## Source-security QA

Existing tests **PASS**:

- Retrieved “ignore instructions” text is untrusted evidence
- `usedSourceIds` `FAKE` dropped
- Arbitrary model URLs dropped

---

## Database QA

With test Postgres / memory repo:

- Session: `client_session_id`, `brand_id`, canonical domain, timestamps, `turn_count`, `follow_up_count`
- Turn: question, Ava response, structured content, provider/model, duration, search metadata, validated sources, token usage when supplied
- No IP, fingerprint, account, or API key columns
- Provider failure: safe `error_code`, no Ava body
- DB failure after Ava success: reply still returned; no SQL in the API body

Correction: failed turns now keep search telemetry when the orchestrator already searched (see defects).

---

## Analytics QA

Disabled (current default): no GTM/gtag scripts in Playwright; site works.

Enabled path (unit tests, not a live GA property): events `ask_ava_start`, `ava_turn`, `ava_retry`, `source_open`, `comparison_view`, `help_ava_smarter_click`; sanitiser drops question/answer/`q`/session/source URL; `comparison_view` dedupes per response.

---

## Rate-limit / capacity QA

| Check | Result |
| --- | --- |
| 429 `RATE_LIMITED` + Ava-facing message | PASS |
| Health unlimited | PASS |
| New `sessionId` does not bypass IP limiter | PASS (new test) |
| `TRUST_PROXY=false` ignores spoofed `X-Forwarded-For` | PASS |
| AI/search concurrency gate; `CAPACITY_LIMITED`; slot release | PASS |

---

## Multi-brand QA

Step 9 host tests re-run as part of `npm test`: `productreviews.com.au` / `www` resolve; `evilproductreviews.com.au` and unknown production hosts do not; `testbrand` not used in production; origin/`brandId` mismatch rejected; CORS does not reflect unknown origins.

---

## SEO

| Item | Result |
| --- | --- |
| Title / description | PASS (`BrandConfig.seo`) |
| Homepage canonical | PASS `https://productreviews.com.au` |
| `/ask-ava` | `noindex` + canonical `/ask-ava` (corrected; was inheriting homepage canonical) |
| Legal placeholders | `noindex` |
| Unknown host | 404 + `noindex`; no ProductReviews page |
| `html lang` | `en-AU` |
| Favicon / OG image | Not supplied — **PENDING CLIENT INPUT** / optional warning, not invented |

---

## Legal / contact status

`/privacy`, `/terms`, `/disclaimer`, `/contact` render structured BrandConfig placeholders with an **Internal placeholder** banner. No invented policies or email.

**Not production-ready** until the client supplies final copy (and contact email / CTA destination).

---

## Production-readiness result

`npm run validate:production` on 20 Aug 2026 (local mock env): **not ready (10 blockers)**.

Blockers (expected; not suppressed):

1. `AI_PROVIDER=mock`
2. Client-owned AI key pending
3. `SEARCH_PROVIDER=mock`
4. `DATABASE_ENABLED=false`
5. Localhost API URL
6. Production CORS origins not listed
7. `NODE_ENV` is not `production`
8. Placeholder legal pages
9. Contact details pending
10. Help make Ava smarter destination pending

Warnings: optional `ava.jpg` / favicon / OG; retention unresolved; analytics off by explicit policy.

Synthetic complete production config still **PASSES** technical readiness in unit tests.

---

## Secret scan

Tracked-file scan (no values printed): no `sk-…` keys, no private key blocks, no tracked `.env` / `.env.local` / `.env.production`. Example templates remain the only env files in git.

---

## Repository hygiene

Not tracked: `node_modules`, `.next`, `.embedded-postgres`, production env files. Playwright `test-results/` / `playwright-report/` gitignored.

---

## Performance observations

- Hero source `hero.png` is ~2 MB. **Correction:** Next.js Image no longer uses `unoptimized`, so production builds can serve derived sizes. The source file was not replaced.
- Layout uses a fixed-height hero wrapper (limits CLS).
- Analytics scripts do not load when disabled.
- Conversation preview banner is **hidden in production builds** (local mock still shows the development notice).

This was not a performance rewrite.

---

## Error matrix

| Code / case | HTTP / UI | Leak check |
| --- | --- | --- |
| 400 validation | Safe envelope | PASS |
| `UNKNOWN_BRAND` | 400 | PASS |
| `BRAND_ORIGIN_MISMATCH` | 400 | PASS |
| `RATE_LIMITED` | 429 + brand rate-limit copy | PASS |
| `CAPACITY_LIMITED` | 429 + same user copy | PASS |
| `PROVIDER_TIMEOUT` / `RATE_LIMIT` / `AUTH` / `UNAVAILABLE` / `INVALID_RESPONSE` | mapped; retry in UI | PASS — no stack/key in body |
| Search failure | Soft-fail or capacity abort | PASS |
| DB persistence failure | Reply still returned | PASS — no SQL in body |

---

## Live smoke-test status

[PRODUCTION-SMOKE-TEST.md](./PRODUCTION-SMOKE-TEST.md): **PENDING CLIENT INPUT**

Not marked PASS. No live OpenAI/search run.

---

## Defects found

1. Root layout set homepage canonical on every route (including `/ask-ava`).
2. Development preview banner always showed, including a production Next build.
3. Chat send button enabled when the composer was empty.
4. `aria-label` on a conversation `div` without a role; duplicate comparison caption for assistive tech.
5. Desktop comparison table could not scroll horizontally.
6. Source links opened a new tab without an accessible hint.
7. Failed conversation turns wiped search telemetry after search had already run.
8. No automated check that a new `sessionId` cannot bypass the IP rate limiter.
9. No frontend browser/a11y automation for landing, legal pages, or Ask Ava.

Not treated as defects: missing favicon/OG/`ava.jpg`, placeholder legal copy, mock providers in local env, 2 MB source hero (asset left unchanged).

---

## Defects corrected

- Per-route canonical / robots (`/` vs `/ask-ava` vs legal).
- Preview notice only when `NODE_ENV !== "production"`.
- Composer send disabled until there is non-empty text.
- Conversation `role="region"`; follow-up `role="group"`; source “opens in a new tab”; comparison caption not duplicated; desktop table `overflow-x-auto`.
- Next Image hero optimization enabled (`unoptimized` removed).
- `AppErrorWithTelemetry` so failed turns keep search metadata.
- Rate-limit test: changing `sessionId` does not bypass IP keying.
- Secret/hygiene tests; Playwright + axe suite (`npm run test:e2e`).
- `data-scroll-behavior="smooth"` on `<html>` (Next 16 warning).

---

## Remaining blockers (launch)

Client-owned / configuration (see [CLIENT-PRODUCTION-INPUTS.md](./CLIENT-PRODUCTION-INPUTS.md)):

- Production OpenAI account/key (`AI_PROVIDER=openai`)
- Production search provider (`SEARCH_PROVIDER=openai`)
- Production PostgreSQL (`DATABASE_ENABLED=true` + `DATABASE_URL`)
- HTTPS `NEXT_PUBLIC_API_BASE_URL` (hostname pending hosting)
- `FRONTEND_ORIGINS` for `productreviews.com.au` and `www`
- Final Privacy Policy, Terms, Disclaimer
- Public contact email
- Confirmed “Help make Ava smarter” destination
- Hosting / DNS / `NODE_ENV=production`

Warnings (may remain under existing policy): retention period; analytics off until notice/consent; optional favicon/OG/`ava.jpg`.

---

## Client-input dependencies

Live Bible/search smoke, production analytics, and `validate:production` going green all depend on the checklist above. Do not invent legal text, an email, an API hostname, or a retention period.

---

## Build / lint / typecheck / test results

| Check | Result |
| --- | --- |
| `npm run validate:brands` | pass |
| `npm run build` | pass (Next.js 16.3.1; middleware-to-proxy deprecation unchanged from Step 9) |
| `npm run lint` | pass |
| `npm run typecheck` | pass |
| `npm run test` | **156 passed** (includes readiness A–O, secret scan, failed-turn search telemetry, sessionId rate-limit) |
| `npm run test:e2e` | **63 passed**, 36 skipped (full viewport matrix Chromium-only); no paid calls |
| `npm run validate:production` | **not ready (10 blockers)** — expected locally |

---

## Deployment recommendation

**NOT READY FOR DEPLOYMENT.**

Software QA for Phase 1 (mode A) is complete. Mode B live smoke and production configuration are blocked on client-owned inputs listed above. Deployment belongs to Phase 1 Step 12 after those blockers are cleared and `validate:production` is green.

---

## Intentionally deferred

- Production deploy
- Affiliate / product database / recommendation engine
- EVCentre.au
- Admin CMS
- Monetisation dashboard
- Automatic conversation deletion
- Cookie CMP
- Paid AI/search from CI
