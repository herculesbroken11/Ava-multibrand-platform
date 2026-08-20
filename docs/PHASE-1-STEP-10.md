# Phase 1 — Step 10: Final ProductReviews content readiness + production configuration readiness

**Status:** complete (19 Aug 2026)  
**Depends on:** [Phase 1 — Step 9](./PHASE-1-STEP-9.md)

This step did **not** deploy production, invent legal policy text, invent a contact email, add affiliate functionality, a product database, a recommendation engine, EVCentre.au, a CMS, a cookie CMP, or automatic conversation deletion.

ProductReviews.com.au remains the **only** production launch brand.

---

## Goal

Prepare ProductReviews.com.au for final production QA by:

1. Replacing placeholder legal/simple pages with configurable structured page components
2. Wiring all known approved ProductReviews marketing copy
3. Making unresolved client-owned content and configuration explicit
4. Preparing safe production environment templates
5. Adding production readiness validation (`npm run validate:production`)
6. Documenting what the client must still supply before launch

This step does **not** manufacture missing business or legal decisions.

---

## Legal route architecture

Routes `/privacy`, `/terms`, `/disclaimer`, and `/contact` (and optional `/about`) render from `BrandConfig.pages`. Shared UI is `frontend/src/components/BrandContentPage.tsx`.

Supported blocks (plain React text nodes, **no** `dangerouslySetInnerHTML` for page copy):

- page title
- introductory text
- headings
- paragraphs
- bullet lists
- contact email / business name / instructions when supplied
- last-updated date when supplied

ProductReviews legal wording is **not** hard-coded in the shared components. Each brand supplies `InformationPage` / `ContactPage` objects.

### Safe content states

| State | Development / staging | Production readiness (`requireFinalContent: true`) |
| --- | --- | --- |
| `status: "final"` with supplied blocks | Render as published copy | PASS |
| `status: "placeholder"` | Render with a clearly marked **Internal placeholder** banner; `robots: noindex` | BLOCKER |

The public production site must not launch with internal placeholder legal copy. Current ProductReviews Privacy, Terms, and Disclaimer pages are placeholders because the client has not supplied final policies.

---

## Contact page

Configurable fields: heading, intro, email, optional business name, optional instructions, last-updated date.

No contact-form backend was added. No email address was invented. Missing email is flagged (`CONTACT_DETAILS`) as a launch blocker under the current launch policy.

---

## Help make Ava smarter CTA

Destination lives on `BrandConfig.learning`:

- `ctaHref` — internal path or `http(s)` URL
- `ctaDestinationStatus` — `final` or `pending`

Current ProductReviews value: `ctaHref: "/contact"` with `ctaDestinationStatus: "pending"`. Development can use that safe internal route. Production readiness reports the destination as unresolved until the client confirms it. No form or mailbox was invented.

---

## Approved ProductReviews copy audit

Locked in `frontend/src/brands/productreviews-approved-copy.ts` and asserted by test O. BrandConfig must keep:

| Area | Copy |
| --- | --- |
| Hero | Find the right products. / Every time. |
| Trust | No fake reviews. No paid placements. |
| Supporting | Just real research by real people using real products. |
| Handwritten | We’ve done the hard yards so you don’t have to! |
| Ava intro | Hi, I’m Ava. / Your independent product research assistant. |
| Ask Ava | Ask Ava before you buy **ANYTHING!** |
| Input | Ask Ava anything about a product… |
| CTA | ASK AVA |
| Suggested heading | Not sure where to start? |
| Suggested subheading | Try asking Ava one of these… |
| Eight questions | Unchanged from Step 2 |
| Independence | Independent advice. / That’s our promise. + four approved paragraphs |
| Learning | Ava is always learning. + approved learning paragraph |
| Learning CTA | Help make Ava smarter |
| Footer | ProductReviews.com.au, Independent product research…, © 2026 Next Marketing Pty Ltd. All rights reserved. |
| Legal labels | Privacy Policy, Terms & Conditions, Disclaimer, Contact |

Client-approved marketing copy was **not** rewritten.

---

## Asset readiness

`classifyBrandAssets` in `frontend/src/brands/schema.ts`:

| Asset | Kind | Current ProductReviews status |
| --- | --- | --- |
| Hero (`hero.png`) | **required** for production | present |
| Text logo | READY (no separate image file) | configured |
| `ava.jpg` fallback | optional (unused while `heroScene` is set) | file not supplied — reported, not invented |
| Favicon | optional | not configured |
| OG image | optional | not configured |

`validate:brands` fails only on **missing required** production assets (hero). Optional missing files are reported by `validate:production` as warnings.

---

## AI / search production requirements

Keep the existing environment architecture. Production readiness requires:

- `AI_PROVIDER=openai`
- `AI_API_KEY` present (never printed, never in git, never `NEXT_PUBLIC_`)
- `AI_MODEL` present
- `SEARCH_PROVIDER=openai` (or a later explicitly approved production provider)

`AI_PROVIDER=mock` or `SEARCH_PROVIDER=mock` is a **blocker**. Missing key message: “Client-owned production AI credentials pending.”

`validate:production` does **not** make paid smoke-test calls.

---

## Database production requirements

Do **not** provision a production database in this step.

Expect:

- `DATABASE_ENABLED=true`
- `DATABASE_URL` present (postgres / postgresql)
- `DATABASE_POOL_MAX` in 1–50

`DATABASE_ENABLED=false` is a blocker. `DATABASE_URL` is never exposed in readiness output. The frontend does not connect to PostgreSQL.

---

## Retention status

`CONVERSATION_RETENTION_DAYS` and `CONVERSATION_RETENTION_APPROVED` exist on the backend env schema.

- Empty / unapproved → WARNING: policy unresolved. **No 30/90/365 default.**
- Approved without a period → env parse fails
- Automatic deletion is **not** enabled even when a number is recorded

---

## Analytics readiness

Analytics still defaults **off**. Behaviour from Step 8 is unchanged.

| Situation | Readiness |
| --- | --- |
| Disabled, not required | WARNING — explicit policy; app works without it |
| Disabled but `analyticsRequired` | BLOCKER |
| Enabled with valid `G-…` or `GTM-…` | PASS |
| Enabled with invalid/missing ID | BLOCKER |

Conversation text is not sent to GA4/GTM.

---

## Privacy / consent boundary

No cookie-consent / CMP was added.

- If analytics stays disabled: the application works fully without it.
- If analytics is enabled for launch: final Privacy Policy / notice position must be approved, and any consent required for that launch context must be confirmed.

---

## Production host / API configuration

Expected:

```
NODE_ENV=production
FRONTEND_ORIGIN=https://productreviews.com.au
FRONTEND_ORIGINS=https://productreviews.com.au,https://www.productreviews.com.au
```

`DEFAULT_DEV_BRAND` must not act as a production hostname fallback (unchanged from Step 9). `TRUST_PROXY` and `TRUST_FORWARDED_HOST` stay false unless a trusted reverse proxy is configured.

`NEXT_PUBLIC_API_BASE_URL` must be HTTPS and not localhost. The final API hostname is **not** invented. The production frontend template uses `https://REPLACE_WITH_PRODUCTION_API_ORIGIN`, which readiness treats as a blocker until hosting is chosen.

---

## Production placeholder detection

Readiness flags (among others):

- mock AI / mock search
- localhost API URL or frontend origin
- `testbrand` as the launch brand
- placeholder legal pages
- missing contact email
- unresolved learning CTA destination
- missing required hero asset
- `DATABASE_ENABLED=false`

Ordinary `npm run dev` is unaffected. These checks apply to production readiness only.

---

## `validate:production`

```bash
npm run validate:production
```

Runs brand validation, inspects production-required env/config (current env plus `backend/.env.production` / `frontend/.env.production` when present), prints `PASS` / `WARNING` / `BLOCKER`, exits non-zero on blockers, and redacts secrets. It does not call OpenAI.

Launch policy (`requireFinalContent: true`): missing legal/contact/CTA content are **blockers**, not optional footnotes.

---

## Client input checklist

Business-readable remaining inputs: [CLIENT-PRODUCTION-INPUTS.md](./CLIENT-PRODUCTION-INPUTS.md)

---

## Smoke-test checklist

Manual only: [PRODUCTION-SMOKE-TEST.md](./PRODUCTION-SMOKE-TEST.md)

---

## Frontend regression

No visual redesign. Shared landing and conversation components are unchanged except:

- legal/contact/about routes now use structured BrandConfig pages
- learning CTA still uses BrandConfig `ctaHref` (via `ContentLink`)

Check at **1440×900**, **768×1024**, and **390×844**:

- ProductReviews landing (approved hero/trust/handwritten copy)
- Ask Ava headline, placeholder, CTA
- Exact eight suggested questions
- Independence section
- Learning CTA
- Footer + legal links
- `/privacy` `/terms` `/disclaimer` `/contact`
- Conversation, search sources, comparisons, errors
- Analytics hooks (still off by default)
- Responsive behaviour from Step 2

---

## Tests

`backend/src/modules/readiness/production-readiness.test.ts`:

| ID | Check |
| --- | --- |
| A | Synthetic complete production config is technically ready |
| B | `AI_PROVIDER=mock` → blocker |
| C | `SEARCH_PROVIDER=mock` → blocker |
| D | Missing production AI key → blocker |
| E | `DATABASE_ENABLED=false` → blocker |
| F | Localhost API URL → blocker |
| G | Unknown host / CORS origins → blocker |
| H | Missing critical asset → blocker |
| I | Placeholder legal page detected |
| J | Retention pending reported without inventing a duration |
| K | Analytics disabled follows explicit policy |
| L | Invalid GA/GTM id is not ready |
| M | Secret values do not appear in readiness output |
| N | Test fixture cannot become the production brand |
| O | ProductReviews approved copy remains unchanged |

A synthetic complete config can PASS with warnings for unresolved retention and analytics-off policy.

---

## Files changed

- `frontend/src/brands/types.ts` — information/contact page types; learning CTA status
- `frontend/src/brands/productreviews.ts` — approved copy restore; placeholder legal/contact pages; pending CTA
- `frontend/src/brands/productreviews-approved-copy.ts` — copy lock for tests
- `frontend/src/brands/testbrand.ts` — fixture pages
- `frontend/src/brands/schema.ts` — page validation; asset classification
- `frontend/src/components/BrandContentPage.tsx` — structured legal/contact rendering
- `frontend/src/components/ContentLink.tsx` — internal vs external CTA links
- `frontend/src/components/AvaLearningSection.tsx` — BrandConfig destination
- `frontend/src/app/{privacy,terms,disclaimer,contact,about}/page.tsx`
- `backend/src/config/env.ts` — retention fields (no deletion job)
- `backend/src/modules/readiness/*` — checker, CLI, tests
- `backend/.env.example`, `backend/.env.production.example`
- `frontend/.env.example`, `frontend/.env.production.example`
- `.gitignore` — allow `*.env.production.example`
- Root / frontend README
- `docs/CLIENT-PRODUCTION-INPUTS.md`
- `docs/PRODUCTION-SMOKE-TEST.md`
- `docs/PHASE-1-STEP-10.md`

---

## Unresolved client inputs

See [CLIENT-PRODUCTION-INPUTS.md](./CLIENT-PRODUCTION-INPUTS.md). In short: final legal policies, contact email, CTA destination, retention period, client-owned AI key, production database environment, domain/DNS, hosting/API hostname, and optional analytics / favicon / OG / Ava portrait.

---

## Build / lint / typecheck / test results

Recorded after the commands in this step:

| Check | Result |
| --- | --- |
| `npm run validate:brands` | pass (`Brand configuration is valid.`) |
| `npm run build` | pass (backend `tsc --noEmit`, frontend Next.js 16.3.1 production build; legal/contact routes dynamic) |
| `npm run lint` | pass |
| `npm run typecheck` | pass (shared + backend + frontend `tsc --noEmit`) |
| `npm run test` | **152 passed**, 0 failed, including readiness tests A–O |
| `npm run validate:production` | **not ready (10 blockers)** in the current local environment, as expected |

Current local `validate:production` blockers (client-owned production values are not present yet):

- mock AI provider / missing production AI key
- mock search provider
- `DATABASE_ENABLED=false`
- localhost API URL
- production CORS origins not listed
- `NODE_ENV` is not `production`
- placeholder legal pages
- contact details pending
- Help make Ava smarter destination pending

Warnings in that same run: optional `ava.jpg` fallback, favicon, and OG image not supplied; retention unresolved (no duration invented); analytics disabled by explicit policy.

A synthetic complete production config still **passes** technical readiness in tests (with retention + analytics-off warnings).

---

## Intentionally deferred deployment

- Production deploy
- Affiliate engine
- Product database / recommendation engine
- EVCentre.au production site
- Admin CMS
- Automatic monetisation analysis
- Automatic conversation deletion
- Cookie consent platform
- Paid AI/search smoke tests from CI
