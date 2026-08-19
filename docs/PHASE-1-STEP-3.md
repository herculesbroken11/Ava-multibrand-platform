# Phase 1 — Step 3: Ask Ava interaction flow + conversational UI foundation

**Status:** complete (19 Aug 2026)  
**Depends on:** [Phase 1 — Step 2](./PHASE-1-STEP-2.md)  
**Run:** `npm run dev` → [http://localhost:3000](http://localhost:3000) and [http://localhost:3000/ask-ava](http://localhost:3000/ask-ava)

This step did **not** add a real AI provider, database persistence, analytics runtime, public search, auth, or production deploy.

---

## Goal

Build the complete **frontend conversational experience** for Ask Ava:

1. Landing-page questions start a conversation without re-typing.
2. Suggested questions start that conversation immediately.
3. `/ask-ava` is a branded, responsive conversational UI.
4. The UI talks to a **mock `ConversationService`**, so a real backend can be connected later without rewriting the interface.

Shared conversation components still read `BrandConfig`. They do not hard-code ProductReviews copy.

---

## Interaction flow

### From the landing Ask Ava form

1. User enters a question.
2. Empty / whitespace-only input is rejected (no navigation).
3. Exact trimmed text is preserved (URL `q` parameter + session-scoped pending stash).
4. App navigates to `/ask-ava`.
5. That text becomes the first user message automatically.
6. The mock Ava response flow starts (typing state → reply → follow-ups).

The user does **not** enter the question again.

### From a suggested question

Clicking a suggested question does **not** fill the landing input or scroll to Ask Ava.

It navigates directly to `/ask-ava` with that **exact approved wording**, then starts the conversation as above.

### On `/ask-ava`

- Composer sends follow-up user messages into the same active session.
- Suggested follow-ups submit like a normal user message.
- Duplicate sends are blocked while a reply is in flight.
- Errors show a friendly message and **Try again**.

---

## Route added

`/ask-ava` → `src/app/ask-ava/page.tsx`

- Uses `getActiveBrand()`.
- Reads `searchParams.q` for the initial question.
- Renders `ConversationView`.
- Metadata: `Ask {Ava} — {brand.name}`.

The route is dynamic because of the query string. Landing and legal pages stay static.

---

## Initial-question preservation

Robust, non-permanent:

| Mechanism | Role |
| --- | --- |
| URL `?q=` | Primary. Exact question text, encoded via `URLSearchParams`. |
| `sessionStorage` pending key | Backup if the query string is awkward or truncated. Consumed once on `/ask-ava`. |
| `sessionStorage` session | Active conversation after the first message. |

After the question is consumed, `q` is stripped with `history.replaceState` so refresh does not re-send it.

Frontend length limit: **1000** characters (`MAX_QUESTION_LENGTH` in `src/lib/ask-ava.ts`).

Nothing is stored in a database or across devices.

---

## Suggested-question behaviour

`SuggestedQuestionBubble` is a `Link` to `/ask-ava?q=…` with the exact brand-config wording.

Landing `AskExperience` no longer copies the bubble text into the Ask Ava input.

---

## Conversation state

Types live in `src/conversation/types.ts`:

**`ConversationMessage`**

- `id`, `role: "user" | "ava"`, `content`, `createdAt`
- optional `status`, `structuredContent`, `sources`, `followUps`

**`ConversationSession`**

- `id`, `messages`, `createdAt`, `updatedAt`

**Structured blocks** (for later real AI responses):

`heading`, `paragraph`, `bullets`, `numbered`, `recommendation`, `advantages`, `limitations`, `considerations`, `followUpPrompt`, `comparison`, `sources`

The UI is built for **concise** Ava replies (short first answers, 1–2 diagnostic questions, small shortlists, comparison when useful) — not a giant-article layout.

---

## Mock service abstraction

```
UI  →  getConversationService().sendMessage({ messages, brand })
         →  mockConversationService  (development)
```

The UI does not contain mock reply logic.

The mock:

- waits a fixed **700ms**
- returns deterministic replies for the eight approved sample questions and a small set of follow-ups
- otherwise returns a **neutral placeholder** that this is a frontend interaction preview
- does **not** present mock rows as live product research
- throws when the user message is exactly `__simulate_error__` (development-only error path)

Swap the implementation in `src/conversation/service.ts` later. Do not rewrite the conversation components.

---

## Components added

Under `src/components/conversation/`:

| Component | Role |
| --- | --- |
| `ConversationView` | Client orchestrator |
| `ConversationShell` | Viewport-height chat layout |
| `ConversationHeader` | Brand, Ava, role, back to landing |
| `MessageList` | User + Ava messages |
| `UserMessage` | Distinct user bubble |
| `AvaMessage` | Ava reply + structured blocks |
| `ConversationComposer` | Accessible textarea + Send |
| `TypingIndicator` | Subtle branded loading dots |
| `SuggestedFollowUps` | 1–3 next-question chips |
| `ConversationError` | Friendly error + retry |
| `StructuredResponse` | Block renderer |
| `ComparisonTable` | Responsive comparison |
| `SourceReferences` | Title / domain / URL / date |
| `EmphasizedText` | Safe `**bold**` only — no HTML |

---

## Structured response support

Reusable rendering exists for all requested block types. The mock does not use every block in every reply, but each component is ready for real AI output.

Safe text only: paragraphs, lists, and `**emphasis**`. No `dangerouslySetInnerHTML` for message bodies.

---

## Comparison table

`ComparisonTable`:

- **&lt; 1024px:** stacked cards (no horizontal page overflow)
- **1024px+:** normal table with wrapping cells

Sample columns: Product, Best for, Key strength, Limitation, Indicative price category.

Demo product names only (`Demo stick A`, `Demo option B`, …) plus a “placeholder data only” caption.

---

## Source component

`SourceReferences` supports:

- title
- domain
- URL (opens in a new tab)
- optional date

Step 3 uses `example.com` / `example.org` demo sources only when a mock reply demonstrates the component. No live public search.

---

## Session-memory behaviour

| Event | Behaviour |
| --- | --- |
| Refresh in the same tab | Restores the current conversation from `sessionStorage` |
| New tab / new browser session | No long-term memory; empty until a new question |
| Landing submit / suggested question that differs from the stored first message | Starts a new session |
| Same first question still in `q` after an interrupted send | Resumes instead of duplicating |
| User accounts / cross-device / database | Not implemented |

Keys are brand-scoped (`ask-ava:session:{brandId}`) so EVCentre.au can share the same code later.

---

## Responsive behaviour

Conversation UI checked against the brief widths in mind:

1440×900, 1280×800, 1024×768, 768×1024, 430×932, 390×844, 375×812, 320×568

| Area | Behaviour |
| --- | --- |
| Shell | `h-dvh` column; messages scroll; composer stays visible |
| Header | Logo + identity + back control; no account UI |
| User bubbles | Right-aligned, max width, wrap, no horizontal overflow |
| Ava replies | Left-aligned, readable width, wrapping paragraphs |
| Follow-ups | Wrap; 44px minimum tap |
| Tables | Cards on small/tablet portrait; table from `lg` |
| Composer | 44px+ control, `enterKeyHint="send"`, Enter sends, Shift+Enter newline |
| Long questions / long replies | `break-words`, `min-w-0` |

---

## Accessibility

- Semantic `header` / `main`
- Composer has a visible-accessible label (`sr-only` + `htmlFor`)
- Buttons are buttons; suggested questions are links to `/ask-ava`
- `:focus-visible` includes `textarea`
- Polite live region for loading, errors, and new Ava text
- Typing indicator is decorative; loading text is announced via the live region / `aria-busy`
- `prefers-reduced-motion` already disables animations globally (typing dots included)
- No extra ARIA on every bubble

---

## Step 2 responsive recheck

Also rechecked the **landing page** at **430×932** and **320×568** (Step 2 did not explicitly capture these).

| Size | Result |
| --- | --- |
| **430×932** | No extra landing fixes required. Same mobile stacked-hero / 1-col questions / compact Ask Ava behaviour as 390×844. |
| **320×568** | Two small overflow risks. **Fixed without a Step 2 redesign.** |

Fixes at 320:

1. **Header crowding** — logo type and Ask Ava CTA padding scale down slightly so the bar fits.
2. **Hero Ava intro** — below 360px the intro sits from the left padding instead of translating past the viewport edge.

Conversation header “Back to home” also uses a short label / icon-only treatment at this width so it does not collide with the logo.

---

## Files modified

| File | Change |
| --- | --- |
| `src/brands/types.ts` | `ava.role`, `conversation` config |
| `src/brands/productreviews.ts` | Conversation copy + Ava role |
| `src/lib/ask-ava.ts` | **New.** Path, `q` param, length limit |
| `src/conversation/*` | **New.** Types, mock service, session store, hook |
| `src/components/conversation/*` | **New.** Conversational UI |
| `src/app/ask-ava/page.tsx` | **New.** Route |
| `src/app/ask-ava/loading.tsx` | **New.** Loading shell |
| `src/components/AskAvaPanel.tsx` | Submit navigates to `/ask-ava` |
| `src/components/AskExperience.tsx` | No longer fills input from bubbles |
| `src/components/SuggestedQuestionsSection.tsx` | Passes brand into bubbles |
| `src/components/SuggestedQuestionBubble.tsx` | Link to conversation with exact wording |
| `src/components/Header.tsx` | Tighter 320px header |
| `src/components/BrandLogo.tsx` | Slightly smaller type on very small screens |
| `src/components/HeroSection.tsx` | 320px Ava-intro overflow fix |
| `src/components/ui/icons.tsx` | `ArrowLeftIcon` |
| `src/app/globals.css` | `textarea` focus + typing dots |

---

## Build result

```text
npm run build   # pass (Next.js 16.3.1, TypeScript OK)
```

`/ask-ava` is server-rendered on demand (`ƒ`) because of `searchParams`. Other routes remain static.

---

## Lint result

```text
npm run lint    # pass (eslint, no findings)
```

---

## Known limitations

- Replies are **development placeholders**, not live product research. A preview banner says so.
- Demo comparison rows and sources are labelled as sample/demo data.
- Session memory is tab-scoped `sessionStorage` only.
- No streaming tokens; the mock returns a full message after a short delay.
- About / legal / contact pages remain title placeholders.
- Brand switching by domain is still not wired.

---

## Intentionally deferred functionality

- OpenAI / Anthropic / any real LLM
- Real streaming
- Web search / public-information retrieval
- PostgreSQL / Supabase / anonymous server-side conversation logging
- GA4 runtime
- Affiliate logic
- Product database / recommendation engine
- Authentication
- Production hosting
- Domain-based multi-brand routing
- Final Ava system prompt (config `ava.instructions` is still stored, unused by this UI)

**Stop after Step 3.** Do not begin real AI integration in this step.
