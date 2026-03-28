# Site signal — global nav warning + modal (Share Your Signal pipeline)

**Related:** [cert-feedback-blob-persistence](../cert-feedback-blob-persistence/spec.md) (CFB) — durable Blob persistence for the same JSONL-shaped pipeline on Vercel. [campaign-hub-spatial-map](../campaign-hub-spatial-map/spec.md) (HSM) — example triage outcome from **site-signal (nav)** on `/campaign/hub`.

## What you’re building (plain language)

Players need a **friction-safe** way to report “something is wrong here” **without leaving the page psychologically** (no hunt for the feedback quest). A **warning affordance** beside **Exit** opens a **modal** that **captures where they are** (a structured snapshot of the URL and page context—not necessarily a pixel screenshot) and **ships that signal into the same artifact stream** as **Share Your Signal** (`questId: system-feedback`) so **cert-feedback triage** and backlog hygiene stay **one pipeline**.

## User stories

1. **As an authenticated player**, I see a **warning control** next to **Exit** in the global nav on every page that uses the nav, so I can **report a site issue** in one gesture.
2. **As an authenticated player**, tapping it opens a **modal** where I can **describe the issue** and **confirm the captured page context** (URL snapshot).
3. **As the system**, I **persist** the report **API-first** (POST succeeds without server actions / revalidate storms) with **player identity**, **timestamp**, and **URL metadata** aligned to **Share Your Signal** storage expectations.
4. **As an operator**, I can **triage** reports from the same **`.feedback/cert_feedback.jsonl`** flow as certification and Share Your Signal entries.

## Non-goals (v1)

- **Pixel screenshot** of the viewport (optional Phase 2; adds weight, privacy, and bundle cost).
- **Auto-completing** the `system-feedback` PlayerQuest via this modal (unless explicitly specified later—avoid double-reward and state-machine edge cases).
- **Public/anonymous** submission without a separate threat model (see Open questions).

## API contract (canonical)

**`POST /api/feedback/site-signal`**

- **Auth**: session / `getCurrentPlayer()` required (**401** if missing).
- **Body (JSON)** — validated with Zod:

| Field | Type | Notes |
|--------|------|--------|
| `pageUrl` | string | Full URL the client believes it is on (length-capped). |
| `pathname` | string | From `window.location.pathname` (redundant but useful if URL parsing differs). |
| `search` | string optional | Query string including `?` or normalized—spec picks one convention. |
| `hash` | string optional | Fragment. |
| `documentTitle` | string optional | `document.title` trimmed, capped. |
| `message` | string | Required human signal; min/max length enforced. |

- **Server-side hardening**:
  - Reject URLs that are not **same-origin** with the current request (compare against `request.nextUrl.origin` or configured app URL) to reduce abuse / SSRF-style payloads.
  - Strip or warn on **overlong** query strings; never log **secrets** (do not append raw `Authorization` headers; body is only the fields above).

- **Response**: `{ success: true }` or `{ error: string }` with appropriate HTTP status.

- **Persistence**: append one JSON line to **`.feedback/cert_feedback.jsonl`** (same file as cert + Share Your Signal) with:

  - `questId`: **`system-feedback`**
  - `passageName`: **`Site signal (nav)`** (stable identifier for triage filters)
  - `feedback`: single string block that includes **formatted URL snapshot** + **player message** (mirror the spirit of Share Your Signal’s combined `feedback` field in `quest-engine.ts`).

## Acceptance criteria

- [ ] Warning control is visible **next to** the Exit/Disconnect control in **`NavBar`**, consistent with **UI Covenant** (element/altitude/stage—warning = Metal dissatisfaction or spec’d token; no decorative amber).
- [ ] Modal is keyboard-accessible (focus trap, Escape closes), mobile-safe (44px targets).
- [ ] Submitting calls **`POST /api/feedback/site-signal`**; **no** `revalidatePath` in the hot path.
- [ ] Successful write produces a **parseable** `cert_feedback.jsonl` line with `questId` and `passageName` as above.
- [ ] Failure states are legible (network, validation, auth) without navigating away.

## Six Game Master faces — design constraints

These are **not** six features; they are **six lenses** every implementation choice must satisfy.

| Face | Lens | This feature |
|------|------|----------------|
| **Shaman** | Felt sense, symptom | Modal copy invites **what felt wrong**, not blame; URL snapshot is **context**, not surveillance. |
| **Regent** | Order, limits | Rate limits / length caps; same-origin check; no PII expansion beyond existing player record. |
| **Challenger** | Edge cases | Long URLs, weird hashes, admin routes, offline submit, double-click spam. |
| **Architect** | Structure | One POST route, one Zod schema, one append helper shared pattern with `cert` route where sensible. |
| **Diplomat** | Relationship | Non-alarming **warning** idiom; “Share your signal” alignment in tone; doesn’t shame the product. |
| **Sage** | Integration | Same triage pipeline as **Share Your Signal**; backlog skill can filter `passageName === 'Site signal (nav)'`. |

## Open questions

1. **Logged-out players**: show icon but prompt login, or hide until auth? (Recommend: show disabled + tooltip or open modal step “Sign in to send signal” — product call.)
2. **Quest completion**: should submitting increment vibeulon / quest progress? (Recommend v1: **no**—signal-only; avoids quest-engine coupling.)
3. **Admin-only routes**: any extra banner? (Optional: prefix message with `[admin]` in server.)

## Dependencies

- Existing: `getCurrentPlayer`, `.feedback/cert_feedback.jsonl`, Share Your Signal persistence pattern (`quest-engine` + triage docs).
- UI: `NavBar`, `UI_COVENANT.md`, `cultivation-cards.css` / `card-tokens` for the warning control.

## References

- [Share Your Signal — GM consult](../share-your-signal-feedback/GM_CONSULT_AND_PLAN.md) (historical; pipeline target).
- `src/app/api/feedback/cert/route.ts` (API-first feedback precedent).
- `src/actions/quest-engine.ts` (`system-feedback` persistence shape).
