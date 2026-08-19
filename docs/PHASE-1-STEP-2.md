# Phase 1 — Step 2: Responsive frontend + requirement reconciliation

**Status:** complete (19 Aug 2026)  
**Depends on:** [Phase 1 — Step 1](./PHASE-1-STEP-1.md)  
**Run:** `npm run dev` → [http://localhost:3000](http://localhost:3000)

This step did **not** add AI, backend, search, analytics, auth, persistence, or deploy.

---

## Goal

1. Apply the **final approved ProductReviews.com.au copy** (replace leftover Step 1 concept wording).
2. Make the existing desktop-first landing **responsive** for desktop, tablet, and mobile.
3. Add basic **accessibility and interaction polish**.
4. Keep the Step 1 visual identity: full-width hero, overlay-on-photo on desktop, Ask Ava mixed type, conversational bubbles, large trust icons, sans / script / serif mix.

---

## Outdated Step 1 items corrected

| Removed / old | Final approved |
| --- | --- |
| **PREVIEW EDITION** badge | Removed. Header CTA is **Ask Ava** (from brand config). |
| Hero: “Smart choices *made* simple.” | **Find the right products.** **Every time.** (`Every time.` stays green script) |
| “No fake reviews, no paid placements.” | **No fake reviews. No paid placements.** (first trust line, more prominent) |
| Supporting research line | Unchanged: **Just real research by real people using real products.** |
| Hard yards note | Unchanged |
| “Hi, I’m Ava your AI product expert” | **Hi, I’m Ava.** / **Your independent product research assistant.** |
| Ask Ava placeholder “Ask me anything about any product…” | **Ask Ava anything about a product…** |
| Status with wave emoji | **Ava is online and ready to help** |
| Footer legal included About Us | Privacy, Terms, Disclaimer, Contact only |
| Footer missing tagline | Tagline shown |
| Made for Australians copy | **Local context. Real relevance.** |

All of the above lives in `src/brands/productreviews.ts` (plus small type fields). Shared components still read `BrandConfig` only.

**Not used anywhere:** Eva, Preview Edition, “AI product expert”.

---

## Final client copy applied

**Hero**

- Find the right products.
- Every time. (green script)
- No fake reviews. No paid placements.
- Just real research by real people using real products.
- We’ve done the hard yards so you don’t have to!
- Hi, I’m Ava. / Your independent product research assistant.

**Ask Ava**

- Ask Ava before you buy **ANYTHING!**
- Placeholder: Ask Ava anything about a product…
- CTA: ASK AVA
- Status: Ava is online and ready to help

**Questions** — same eight conversational bubbles; no avatars, timestamps, or fake activity.

**Independence** — Independent advice. / That’s our promise. + four approved body paragraphs (serif).

**Trust** — Independent, Researched & compared, Trusted advice, Made for Australians (with final descriptions).

**Learning** — Ava is always learning. / Help make Ava smarter.

**Footer** — ProductReviews.com.au, tagline, © 2026 Next Marketing Pty Ltd, four legal links.

---

## Responsive behaviour

Breakpoints follow the brief:

- **Mobile:** 320–767px (`default`)
- **Tablet:** 768–1279px (`md` / `lg`)
- **Desktop:** 1280px+ (`xl`)

### Site shell

Horizontal padding is `clamp(1.15rem, 4vw, 4.5rem)` (about 18px on small phones, 4.5rem on large desktop). `overflow-x: hidden` on `html`/`body`.

### Header

- Compact height on mobile (`h-16`), taller on tablet/desktop.
- Logo scales down on small screens.
- No hamburger; nav (if a brand adds it) hides on mobile.
- **Ask Ava** pill is always available (min 44px tap).

### Hero

- **Desktop / tablet:** overlay-on-photo kept. Overlay width capped so it stays left of Ava. Intro + arrow from `lg` up.
- **Height:** ~40vh mobile, ~52–58vh tablet, 65vh desktop.
- **Crop:** `object-position` shifts slightly by breakpoint so Ava’s face stays in frame.
- **Mobile:** copy is **not** laid over Ava’s face. Image first; frost card stacked underneath (slight overlap). Same type mix and identity.

### Ask Ava

- Desktop/tablet: overlapping grey card retained, overlap reduced on tablet.
- Mobile: near-full-width card, smaller type, headline wraps, 44px input/send, less negative margin.

### Suggested questions

- Desktop/tablet: 2 columns.
- Mobile: 1 column, large tap targets, `motion-safe` hover only.

### Independence

- Headline/subtitle scale down with `clamp`.
- Body: 2 columns from tablet up, 1 column on mobile, max readable line length.

### Trust principles

- Desktop: 4 columns, ~96px icons.
- Tablet: 2 columns, medium icons.
- Mobile: 1 column, ~48px icons (not 96px).

### Learning + footer

- Stack on mobile/tablet; horizontal on large desktop.
- Footer shows logo, tagline, copyright, wrapping legal links (44px tap).

---

## Accessibility polish

- Semantic `header` / `main` / `footer`
- Buttons are buttons; links are links
- Visible `:focus-visible` ring (brand green)
- Ask Ava input has an accessible label (`sr-only` + `htmlFor`)
- Send control `aria-label` from brand CTA
- ~44px minimum targets on header CTA, input, send, bubbles, footer links, learning CTA
- Decorative SVGs `aria-hidden`
- Hero image alt: independent product research assistant
- `prefers-reduced-motion` disables smooth scroll / shortens transitions
- Contrast: dark type on frost/white; Ask Ava white script has a light text-shadow on the grey panel

---

## Viewport QA

Checked in Chrome headless against the running app:

| Size | Role | Result |
| --- | --- | --- |
| 1440×900 | Desktop | Overlay hero, Ask Ava overlap, no Preview badge, final copy |
| 768×1024 | Tablet | Overlay retained, tighter spacing, 2-col questions start below fold |
| 390×844 | Mobile | Stacked hero copy (Ava unobscured), Ask Ava wraps, no overlay on face |

Also intended to hold at 1280×800, 1024×768, 430×932, 375×812, 320×568 (same breakpoint system; 320 needs wrapped trust lines — flex `min-w-0` added after the 390 capture).

Screenshots:

- `docs/screenshots/desktop-1440x900.png`
- `docs/screenshots/tablet-768x1024.png`
- `docs/screenshots/mobile-390x844.png`

---

## Files modified

| File | Change |
| --- | --- |
| `src/brands/types.ts` | `hero.avaRole`, `independence.subtitle` |
| `src/brands/productreviews.ts` | Final copy; badge removed; legal links; CTA href `/#ask-ava` |
| `src/app/globals.css` | Responsive shell padding, overflow, focus, reduced-motion |
| `src/components/Header.tsx` | Compact header, Ask Ava CTA, no preview badge |
| `src/components/BrandLogo.tsx` | Responsive type, 44px tap |
| `src/components/AvaVisual.tsx` | Responsive height + object-position |
| `src/components/HeroSection.tsx` | Final headline; stacked mobile copy; prominent first trust line |
| `src/components/AskAvaPanel.tsx` | Responsive overlap/type/touch targets |
| `src/components/SuggestedQuestionsSection.tsx` | 1-col mobile / 2-col md+ |
| `src/components/SuggestedQuestionBubble.tsx` | Touch size, reduced-motion hover, no overflow tail on mobile |
| `src/components/IndependenceSection.tsx` | Config subtitle; 1/2-col grid |
| `src/components/TrustPrinciples.tsx` | 1 / 2 / 4 columns; scaled icons |
| `src/components/AvaLearningSection.tsx` | Stacked layout |
| `src/components/Footer.tsx` | Tagline, stacked wrap, tap targets |
| `src/components/SimplePage.tsx` | Responsive title size |

---

## Build / lint

```text
npm run build   # pass (Next.js 16.3.1, TypeScript OK)
npm run lint    # pass (eslint, no findings)
```

---

## Remaining visual limitations (intentional)

- Ask Ava still does not submit to an AI backend (`preventDefault` only).
- Brand switching by domain is not wired.
- About / legal / contact pages are still title placeholders.
- White script on the grey Ask Ava panel is a contrast compromise kept to match the approved look; a text-shadow was added rather than changing the panel colour.
- Mobile hero is stacked rather than overlay-on-photo so Ava’s face is not covered (allowed by the brief).
- Suggested-question footer script (“Ask your question or try one above!”) was kept from Step 1; it was not in the Step 2 copy list and was not treated as outdated.

---

## Intentionally deferred (later steps)

- Step 3: Ask Ava interaction flow / conversational UI (still no production AI)
- AI / LLM APIs
- Database, search backend, analytics runtime, auth, persistence
- Production deploy
- Domain-based multi-brand switching
