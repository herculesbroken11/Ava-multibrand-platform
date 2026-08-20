# Phase 1 — Step 9: Multi-brand hostname resolution + strict configuration validation

**Status:** complete (19 Aug 2026)  
**Depends on:** [Phase 1 — Step 8](./PHASE-1-STEP-8.md)

This step did **not** launch EVCentre.au, add affiliate logic, a product database, a recommendation engine, an admin CMS, final legal policies, or a production deployment.

ProductReviews.com.au remains the **only** production launch brand.

---

## Goal

Replace Phase 1’s hard-coded ProductReviews brand selection with a host-aware resolver so the shared platform can select a brand by hostname, while proving that another brand can be added by configuration rather than by copying UI or backend components.

```
hostname
  → shared brand identifier
  → frontend BrandConfig
  → backend server brand configuration
  → same landing / Ask Ava / conversation UI / Ava engine
```

Future brands are added by:

1. configuration files
2. an asset directory
3. registry entries (shared + frontend + backend)

---

## Multi-brand architecture

Shared identifiers live in `shared/src/brands.ts` (`BrandId`, canonical domain, host aliases, `kind`). That is the only brand contract shared across frontend and backend. Large visual `BrandConfig` objects stay in the frontend.

| Layer | Responsibility |
| --- | --- |
| Shared | `productreviews` / `testbrand` IDs, exact hostname aliases, host normalization, origin allow-list helpers |
| Frontend | Visual BrandConfig, SEO, analytics IDs, legal routes, runtime validation, Next.js host resolution |
| Backend | Market, currency, timezone, search location, Ava brand instructions, CORS allow-list, origin/brand consistency |

The test fixture `testbrand` / `testbrand.local` is **not** a public brand. It exists only to prove switching. There is no EVCentre.au production site.

---

## Frontend brand validation

`frontend/src/brands/schema.ts` validates registered BrandConfig at request time (and via `npm run validate:brands`).

Checked fields include:

- `id`, `name`, canonical `domain`, `kind`
- branding: logo parts/text, colours (`#RGB` / `#RRGGBB`), typography tokens
- hero: headline, accent, image path used by the landing visual
- Ask Ava: headline, placeholder, CTA
- suggested questions, independence, trust principles, learning, footer, legal links
- SEO title/description
- analytics IDs **when supplied** (`G-…` / `GTM-…`)
- Ava name / role / public instructions
- optional `locale`, `favicon`, `categoryContext`, `featureFlags`

Legitimately optional fields (favicon, OG image, GTM/GA IDs, category context, feature flags, logo image) are not forced.

Invalid registered configuration throws during SSR (`getRequestBrand` / `resolveRequestBrand`) rather than rendering a malformed brand. `npm run validate:brands` fails non-zero.

---

## Backend brand validation

`backend/src/modules/brands/schema.ts` validates server brands with Zod.

Server fields are behavioural, not visual:

`id`, `name`, `canonicalDomain`, `avaName`, `avaRole`, market (`countryCode`, `countryName`, `currency`, `timezone`, `locale`), `searchLocation`, brand-specific Ava instructions/context, optional `categoryContext` / feature flags.

Frontend-only colours, React assets, and landing copy are **not** duplicated on the server.

Each backend `domain` / `kind` must match the shared record.

---

## Hostname resolution

Exact match on the normalized canonical host or an explicit alias. **No substring matching.**

| Host | Result |
| --- | --- |
| `productreviews.com.au` | ProductReviews |
| `www.productreviews.com.au` | ProductReviews (configured alias) |
| `evilproductreviews.com.au` | unknown |
| unknown production host | unknown — **not** ProductReviews |

**Unknown production host choice:** the Next.js request interceptor (`frontend/src/middleware.ts`, emitted as Proxy in Next.js 16.3.1) returns **HTTP 404** (`Unknown host`, `x-robots-tag: noindex`) and does not render ProductReviews (or the fixture). The root layout has a second fallback that renders a brand-less “Unknown host” page so a `notFound()` layout loop cannot leak another brand’s chrome.

The backend never creates a conversation session for an unregistered `brandId`, and origin/brand mismatch is not persisted.

---

## Hostname normalization

`normalizeHostname`:

- lowercase
- strip a trailing `:port` when present
- unwrap IPv6 brackets
- **does not** auto-strip `www` unless `www.` is an explicit alias

Examples:

- `ProductReviews.com.au` → `productreviews.com.au`
- `productreviews.com.au:3000` → `productreviews.com.au`
- `www.productreviews.com.au` → ProductReviews via alias list

---

## Trusted-host boundary

Same shape as Step 8 `TRUST_PROXY`.

| Source | When used |
| --- | --- |
| `Host` | Always, for direct local/dev and when forwarded-host trust is off |
| `X-Forwarded-Host` | **Only** when `TRUST_FORWARDED_HOST=true` |

The first comma-separated forwarded value is used when trust is on.

**Do not** enable `TRUST_FORWARDED_HOST` on a public socket. A client could send `X-Forwarded-Host: testbrand.local` (or another alias) and switch brands. Enable it only behind a reverse proxy that overwrites forwarded headers.

The backend does **not** use `Host` / `X-Forwarded-Host` to choose a brand for `/api/v1/conversation/message`. The API host is typically `localhost:4000`. Brand comes from the registered `brandId` body field, then is checked against the browser `Origin` when that header is present.

Client-supplied brand name/instructions are never trusted. `x-ava-brand-id` is not a resolution input.

---

## ProductReviews domains / aliases

| Field | Value |
| --- | --- |
| Brand id | `productreviews` |
| Canonical domain | `productreviews.com.au` |
| Alias | `www.productreviews.com.au` |
| Kind | `production` |

Database sessions continue to store **canonical** values: `brand_id = productreviews`, `domain = productreviews.com.au`. Raw `Host` strings are not stored.

---

## Unknown host behaviour

Production (`NODE_ENV=production`):

- Unregistered host → frontend 404
- Development fallback **disabled** (localhost does not become ProductReviews)
- Test fixture host is not resolved

Development/test:

- `localhost`, `127.0.0.1`, `::1` → `DEFAULT_DEV_BRAND` (default `productreviews`)
- `testbrand.local` → fixture brand

---

## Local development behaviour

`DEFAULT_DEV_BRAND=productreviews` maps loopback hosts to ProductReviews so `http://localhost:3000` keeps the launch brand.

To exercise the fixture locally, use `testbrand.local` (hosts file) in development/test. The fixture is never a production default.

---

## Frontend / backend consistency

The conversation request still sends explicit `brandId` for contract clarity.

The backend:

1. Resolves `brandId` from the **backend registry only** (`UNKNOWN_BRAND` if missing or if a test brand is requested in production)
2. If `Origin` is present, requires it to be on the CORS allow-list **and** to resolve to the same brand (`BRAND_ORIGIN_MISMATCH`)

No `Origin` (non-browser clients) skips the origin check but still requires a registered brand. Local development: `http://localhost:3000` maps to `DEFAULT_DEV_BRAND`.

---

## CORS changes

Step 4’s single `FRONTEND_ORIGIN` remains the fallback.

`FRONTEND_ORIGINS` is a comma-separated allow-list. The runtime list also includes HTTPS origins derived from production shared hosts (`https://productreviews.com.au`, `https://www.productreviews.com.au`). In development/test, HTTP fixture origins (`http://testbrand.local`, `http://testbrand.local:3000`) are added.

There is no `Access-Control-Allow-Origin: *`. Unknown origins are not reflected.

Production should set:

```
FRONTEND_ORIGINS=https://productreviews.com.au,https://www.productreviews.com.au
FRONTEND_ORIGIN=https://productreviews.com.au
```

---

## SEO / metadata

Root `generateMetadata` uses the **resolved** BrandConfig:

- `title` / `description` from `brand.seo` (existing ProductReviews copy unchanged)
- canonical / Open Graph URL `https://{canonical domain}`
- `favicon` when configured
- `html lang` from `brand.locale` (`en-AU` for ProductReviews)

No invented marketing copy.

---

## Backend market configuration

Australia/AUD is no longer a global ProductReviews special case in search/Ava. It is ProductReviews **brand config**:

| Attribute | ProductReviews | Test fixture |
| --- | --- | --- |
| countryCode | AU | NZ |
| countryName | Australia | New Zealand |
| currency | AUD | NZD |
| timezone | Australia/Sydney | Pacific/Auckland |
| searchLocation | AU / Australia | NZ / New Zealand |

User location overrides (for example “I'm in New Zealand”) still apply on top of the brand default.

---

## Ava permanent vs brand-specific rules

Permanent platform sections (unchanged Bible modules): personality, behaviour, independence, accuracy, safety, output, prompt-injection hierarchy, diagnose-first.

Brand configuration supplies: name, market, currency, Ava role wording, public context, approved brand instructions, optional `categoryContext`.

The complete Ava Bible is **not** copied per brand. `categoryContext` is the config boundary for a future category such as electric vehicles. This step does **not** implement EV recommendations. The fixture string is explicitly test-only.

---

## Test fixture brand

| Field | Value |
| --- | --- |
| id | `testbrand` |
| domain | `testbrand.local` |
| kind | `test` |
| Hidden in production | yes (`getBackendBrand(..., "production")` is undefined) |

Copy and assets are marked **TEST FIXTURE ONLY — not a public brand.** Shared landing/chat/backend components are reused.

---

## Configuration-change workflow

Config-as-code. No CMS, no database-editable brand config, no visual theme editor.

To add a future brand (after Phase 1):

1. Add the id to `shared/src/brands.ts` (`BrandId`, canonical domain, aliases, kind)
2. Add `frontend/src/brands/{id}.ts` + assets under `frontend/public/brands/{id}/`
3. Register it in `frontend/src/brands/registry.ts`
4. Add `backend/src/modules/brands/registry.ts` market/Ava fields
5. Run `npm run validate:brands`
6. Redeploy

---

## `validate:brands` command

```bash
npm run validate:brands
```

Validates every registered frontend and backend brand. Exits non-zero for:

- required field missing
- invalid domain
- duplicate hostname alias
- duplicate brand ID
- invalid colour token
- invalid analytics ID format when supplied
- missing referenced **local** production assets (ProductReviews hero)

Remote URL network checks are not performed. The test fixture may omit production-grade assets; production brands cannot.

---

## Asset validation

Production brands: the landing visual (`heroScene` or fallback `ava`), plus `logo.imageSrc`, `favicon`, and `seo.ogImage` when they are local `/…` paths.

ProductReviews critical asset: `frontend/public/brands/productreviews/hero.png`.

`ava.jpg` is configured as a fallback image but is unused while `heroScene` is present; it is not treated as the critical production asset.

The fixture uses `frontend/public/brands/testbrand/fixture.png` (1×1 placeholder) and is exempt from production asset strictness via `kind: "test"`.

---

## Security tests

| ID | Check | Result |
| --- | --- | --- |
| A | `productreviews.com.au` → ProductReviews | pass |
| B | `www.productreviews.com.au` → ProductReviews | pass |
| C | mixed-case host normalizes | pass |
| D | host with port normalizes | pass |
| E | `evilproductreviews.com.au` does not match ProductReviews | pass |
| F | unknown production host does not default to ProductReviews | pass |
| G | localhost → configured development brand | pass |
| H | fixture host → fixture brand only in development/test | pass |
| I | unregistered `brandId` rejected (`UNKNOWN_BRAND`) | pass |
| J | origin/brand mismatch rejected (`BRAND_ORIGIN_MISMATCH`) | pass |
| K | `X-Forwarded-Host` ignored when `TRUST_FORWARDED_HOST` is false | pass |
| L | duplicate registered domain alias fails validation | pass |
| M | invalid brand config fails validation | pass |
| N | missing critical ProductReviews asset fails validation | pass |
| O | canonical DB domain remains `productreviews.com.au` | pass |

---

## Frontend regression

ProductReviews client copy, landing, Ask Ava, suggested questions, conversation chrome, sources, comparison tables, and analytics hooks are unchanged. Shared components still receive a `brand` prop.

Responsive layout remains the existing 1440 / 768 / 390 shells. This step does not restyle those breakpoints.

---

## Files changed

**Shared**

- `shared/src/brands.ts`
- `shared/src/index.ts`

**Backend**

- `backend/src/modules/brands/registry.ts`, `schema.ts`, `origins.ts`, `origin-guard.ts`, `validate-cli.ts`
- `backend/src/modules/brands/host-resolution.test.ts`, `origin-consistency.test.ts`
- `backend/src/modules/conversation/routes.ts`, `service.ts`
- `backend/src/modules/ava/ava-brand.ts`, `ava-accuracy.ts`, `ava.test.ts`
- `backend/src/modules/search/search-decision.ts`, `search-query.ts`, `search.test.ts`
- `backend/src/config/env.ts`, `env.test.ts`, `.env.example`
- `backend/src/app.ts`, `main.ts`
- `backend/src/modules/logging/postgres-conversation-repository.test.ts`
- `backend/package.json`

**Frontend**

- `frontend/src/brands/types.ts`, `productreviews.ts`, `testbrand.ts`, `registry.ts`, `schema.ts`, `index.ts`
- `frontend/src/lib/brand.ts`, `request-brand.ts`
- `frontend/src/middleware.ts`
- `frontend/src/app/layout.tsx`, `page.tsx`, `ask-ava/page.tsx`, `ask-ava/loading.tsx`, legal/simple pages
- `frontend/public/brands/testbrand/fixture.png`
- `frontend/.env.example`

**Root**

- `package.json` (`validate:brands`)
- `docs/PHASE-1-STEP-9.md`

---

## Environment variables

**Backend**

| Name | Default | Production notes |
| --- | --- | --- |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Set to the primary live origin |
| `FRONTEND_ORIGINS` | empty (falls back to `FRONTEND_ORIGIN`) | Comma-separated allow-list; never `*` |
| `TRUST_PROXY` | `false` | Step 8: enable only behind a trusted proxy |
| `TRUST_FORWARDED_HOST` | `false` | Enable only behind a proxy that overwrites `X-Forwarded-Host` |
| `DEFAULT_DEV_BRAND` | `productreviews` | Ignored for unknown hosts when `NODE_ENV=production` |

**Frontend**

| Name | Default | Production notes |
| --- | --- | --- |
| `DEFAULT_DEV_BRAND` | `productreviews` | Loopback only in development/test |
| `TRUST_FORWARDED_HOST` | `false` | Same trust boundary as the backend |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | `false` | Still off until notice/consent |

Analytics `brand_id` continues to come from the resolved BrandConfig `id`. Per-brand `analytics.gaMeasurementId` / `analytics.gtmId` can be set without changing shared analytics components. Analytics is **not** auto-enabled.

---

## Build / lint / typecheck / test results

Recorded after the commands in this step:

| Check | Result |
| --- | --- |
| `npm run validate:brands` | pass (`Brand configuration is valid.`) |
| `npm run build` | pass (backend `tsc --noEmit`, frontend Next.js 16.3.1 production build; all app routes dynamic for host resolution) |
| `npm run lint` | pass |
| `npm run typecheck` | pass (shared + backend; frontend `tsc --noEmit` also pass) |
| `npm run test` | **134 passed**, including security tests A–O and live PostgreSQL canonical-domain check |

---

## Intentionally deferred functionality

- EVCentre.au production site or EV recommendation logic
- Affiliate / commercial relationship engine
- Product database and recommendation engine
- Admin CMS / runtime marketing editor
- Final Privacy Policy, Terms, Disclaimer, and cookie banner copy (routes remain brand-configurable)
- Production deployment
- Measurement Protocol
- Browser CMS for brand configuration
