# Phase 1 — Step 1: ProductReviews.com.au frontend

Record of the first frontend step: from an empty project to the current landing page. This is **frontend only**.

**Status:** complete (as of 19 Aug 2026)  
**Run:** `npm run dev` → [http://localhost:3000](http://localhost:3000)

---

## Goal

Build a configurable, multi-brand AI product-advice **landing UI**, starting with **ProductReviews.com.au**. Shared components read a brand config object. They do not hard-code ProductReviews copy, colours, or images.

A later brand (for example EVCentre.au) should be a new config file plus a registry entry — same components, different content.

## Out of scope (this step)

- AI / LLM API
- Database
- Auth
- Search backend
- Analytics runtime (IDs may be stored in config, not wired)
- Deploy
- Real “Ask Ava” answers (the form only `preventDefault`s)

---

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI | React 19 |
| Styles | Tailwind CSS v4 |
| Fonts | Plus Jakarta Sans (UI), Caveat (script), Source Serif 4 (independence body) |

---

## Architecture

```
BrandConfig  →  getActiveBrand()  →  LandingPage / SimplePage
                     ↓
              CSS variables (--brand-*)
              Tailwind tokens (text-brand, bg-page, …)
```

- **Config:** `src/brands/productreviews.ts`
- **Types:** `src/brands/types.ts`
- **Registry:** `src/brands/registry.ts`
- **Resolver:** `src/lib/brand.ts` — Phase 1 always serves ProductReviews. Later phases can pass the request host.
- **Tokens:** `BrandStyles` injects CSS variables; `src/app/globals.css` maps them into Tailwind `@theme`.

Layout shell `.site-shell`: max-width **1760px**, horizontal padding **4.5rem**. The **hero photo is full viewport width**; other UI sits in the shell.

---

## Project map

```
src/
  app/
    layout.tsx              fonts + BrandStyles
    page.tsx                landing
    globals.css             tokens, .site-shell
    about|privacy|terms|disclaimer|contact/page.tsx
  brands/
    types.ts
    productreviews.ts
    registry.ts
  components/               shared landing UI (all take `brand`)
  lib/brand.ts
public/brands/productreviews/
  hero.png                  full-bleed hero (uncompressed)
```

Placeholder legal/about pages use `SimplePage` (title only).

---

## Landing page (top to bottom)

### 1. Header

- Logo: **Product** (black) + **Reviews** (green), `.com.au` under Reviews
- **PREVIEW EDITION** badge
- Extra-bold type, tight tracking

### 2. Hero

- Image: `public/brands/productreviews/hero.png`
- Full device width, height **65vh**
- `next/image` with **`unoptimized`** (no compression)
- `object-cover object-[center_24%]` so Ava’s head stays in frame
- Overlay (top-left, inside `.site-shell`, light frost `bg-white/55` + slight blur):
  - **Smart choices *made* simple.** (`made` is green Caveat)
  - Trust lines with green checks:
    - No fake reviews, no paid placements.
    - Just real research by real people using real products.
  - Script note: **We’ve done the hard yards so you don’t have to!**
- **Hi, I’m Ava your AI product expert** sits **under** that block, **right-aligned**, with a handwritten arrow pointing toward Ava (left of her in the photo)
- Name **Ava** (not Eva)

### 3. Ask Ava panel

- Overlaps the hero (`-mt` so it sits a little higher on the photo)
- Background `#adadadf5`, large rounded card
- Headline fills the panel width:
  - White Caveat: **Ask Ava before you buy**
  - Extra-bold green sans, all-caps, slight tilt, yellow scribble underline: **ANYTHING!**
- White pill input, green circular up-arrow send
- Status, left under the input, slightly larger type: **Ava is online and ready to help 👋**
- No API — submit is a no-op

Clicking a suggested question fills the input and scrolls to this panel.

### 4. Suggested questions — “Not sure where to start?”

- Large heading + subheading
- 2-column **coloured chat bubbles** (no fake avatars or timestamps)
- Larger question type
- Footer script: **Ask your question or try one above!**

### 5. Independence

- Title (sans extra-bold): **Independent advice.**
- Subtitle (green Caveat): **That’s our promise.**
- Four body paragraphs in **Source Serif** (different style from the heading)

### 6. Trust principles

Four columns, large (~96px) green line icons:

| Title | Meaning |
| --- | --- |
| Independent | Unbiased advice. No paid placement. |
| Researched & compared | We analyse so you don’t have to. |
| Trusted advice | Clear answers you can rely on. |
| Made for Australians | Local context. Local products. |

### 7. Ava learning bar + footer

- Charcoal bar: script heading, body, yellow CTA
- Footer: inverted logo, copyright, legal links

---

## Brand content (ProductReviews)

Key copy lives in `src/brands/productreviews.ts`, including:

- Colours (primary green `#2E7D32`, accent yellow `#FFC107`, bubble palette)
- Hero / Ask Ava / questions / independence / trust / learning / legal / SEO
- `ava.instructions` stored for a later AI phase (not used in the UI yet)

---

## Visual decisions locked in this step

These were iterated in the browser and should be treated as the current design:

1. Hero is **overlay-on-photo**, not a two-column layout.
2. Hero image is **full width × 65vh**, uncompressed.
3. Content width is **1760px**; the photo is not constrained.
4. Ask Ava uses mixed type: **white script + green ANYTHING! + yellow underline**.
5. Suggested questions are **bubbles only** — no avatars, no timestamps.
6. Trust icons and landing type are **large** (desktop-first).
7. Independence subtitle is **script**; body is **serif**.

---

## How to run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts: `npm run build`, `npm run lint`.

---

## Adding another brand later

1. Add `src/brands/<id>.ts` implementing `BrandConfig`.
2. Register it in `src/brands/registry.ts`.
3. Add assets under `public/brands/<id>/`.
4. Resolve by host in `getActiveBrand()` (not required in Step 1).

Do **not** fork landing components per brand.

---

## Not done yet (later steps / phases)

- Wire Ask Ava to an AI backend
- Domain-based brand switching
- Real about / legal / contact content
- Analytics
- Auth, persistence, search
- Production deploy
