# Plan: Cert feedback blob persistence (CFB)

Implement per [.specify/specs/cert-feedback-blob-persistence/spec.md](./spec.md).

## File impacts

| Area | Files |
|------|--------|
| Core | New `src/lib/feedback/persist-cert-feedback-line.ts` (or `append-cert-feedback.ts`) — Blob `put` + fs fallback |
| API routes | [`src/app/api/feedback/cert/route.ts`](../../../src/app/api/feedback/cert/route.ts), [`src/app/api/feedback/site-signal/route.ts`](../../../src/app/api/feedback/site-signal/route.ts) |
| Quest engine | [`src/actions/quest-engine.ts`](../../../src/actions/quest-engine.ts) — replace inline fs block with helper |
| Legacy action | [`src/actions/certification-feedback.ts`](../../../src/actions/certification-feedback.ts) |
| Config | [`next.config.ts`](../../../next.config.ts) — `serverExternalPackages` if needed |
| Docs | [`docs/ENV_AND_VERCEL.md`](../../../docs/ENV_AND_VERCEL.md), [`docs/CERTIFICATION_FEEDBACK.md`](../../../docs/CERTIFICATION_FEEDBACK.md) — production Blob note |
| Scripts | Optional `scripts/export-cert-feedback-blob.ts` + `package.json` script |
| Triage skill | [`.agents/skills/cert-feedback-triage/SKILL.md`](../../../.agents/skills/cert-feedback-triage/SKILL.md) — § Blob export when token used in prod |

## Implementation order

1. Helper + unit-style test or small integration check (mock token).
2. Swap call sites (cert → site-signal → quest-engine → logCertificationFeedback).
3. Docs + next.config if lint/bundle requires.
4. Export script (1b) and skill note.

## Risks

- **Quest engine** runs inside Prisma transaction for other work — feedback persistence should **not** break quest completion if Blob fails; today cert append in quest-engine is try/catch; keep **same resilience** (log error, optionally still delete `PlayerQuest` per product choice — spec: **prefer** not blocking delete on Blob failure; **retry** or dead-letter is Phase 2).
