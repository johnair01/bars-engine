# Plan — Site signal nav report

Implement per [spec.md](./spec.md). **API first**, then **NavBar + modal**, then **verification**.

## Phase 1 — API (Architect / Regent)

1. Add **`src/lib/feedback/site-signal-schema.ts`** — Zod schema for POST body + shared formatters (URL block string).
2. Add **`src/app/api/feedback/site-signal/route.ts`** — `POST`, `getCurrentPlayer`, same-origin check, append to `cert_feedback.jsonl` with `questId: system-feedback`, `passageName: Site signal (nav)`.
3. Optional refactor: extract **`appendCertFeedbackLine(entry)`** from `cert/route.ts` and site-signal route to avoid duplicate mkdir/append logic (only if deft—skip if it balloons diff).

## Phase 2 — UI (Diplomat / Shaman)

1. **`SiteSignalModal`** (client): textarea for `message`, read-only display of captured URL fields (trust but verify), primary submit, loading/error/success.
2. **`NavBar`**: warning button adjacent to Exit form; `aria-label` e.g. “Report an issue with this page”; opens modal when authenticated.
3. Apply **UI Covenant**: warning icon + button use **cultivation-cards** classes; Tailwind for flex/gap only.

## Phase 3 — Edge cases (Challenger)

1. Double-submit guard on client; server idempotency not required v1.
2. Truncate display of very long URLs in modal with expand/collapse or monospace ellipsis.
3. If unauthenticated: either hide button or show modal with login CTA (match spec decision).

## Phase 4 — Sage integration

1. Document filter for triage: `passageName === "Site signal (nav)"` in [cert-feedback-triage skill](../../../.agents/skills/cert-feedback-triage/SKILL.md) or **PLAYER_FEEDBACK_TRIAGE** note (one paragraph).
2. Optional: one line in **BACKLOG.md** under certification feedback table linking this spec.

## File impact (expected)

| File | Change |
|------|--------|
| `src/app/api/feedback/site-signal/route.ts` | New |
| `src/lib/feedback/site-signal-schema.ts` | New |
| `src/components/SiteSignalModal.tsx` or `src/components/feedback/SiteSignalModal.tsx` | New |
| `src/components/NavBar.tsx` | Wire button + modal |
| `.agents/skills/cert-feedback-triage/SKILL.md` or triage doc | Note optional |

## Out of scope (defer)

- Screenshot / html2canvas
- Server action mirroring POST
- Quest engine hooks for `system-feedback` completion from nav
