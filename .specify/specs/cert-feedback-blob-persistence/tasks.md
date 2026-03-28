# Tasks: Cert feedback blob persistence (CFB)

Spec: [.specify/specs/cert-feedback-blob-persistence/spec.md](./spec.md) · Plan: [plan.md](./plan.md)

## Phase 1 — Durable write path

- [ ] **CFB-1** — Add `persistCertFeedbackLine` in `src/lib/feedback/` — Zod or TypeScript type for line shape; `put` to `cert-feedback/events/{date}/{id}.json` when `BLOB_READ_WRITE_TOKEN`; else `appendFile` to `.feedback/cert_feedback.jsonl`.
- [ ] **CFB-2** — Refactor `POST /api/feedback/cert` and `POST /api/feedback/site-signal` to use helper.
- [ ] **CFB-3** — Refactor `quest-engine` Share Your Signal block to use helper; preserve try/catch so quest completion is not wedged on Blob outage (document behavior in spec if we change).
- [ ] **CFB-4** — Refactor `logCertificationFeedback` to use helper.
- [ ] **CFB-5** — `docs/ENV_AND_VERCEL.md` + `docs/CERTIFICATION_FEEDBACK.md` — production requires token for durability; link this spec.
- [ ] **CFB-6** — `next.config.ts`: add `@vercel/blob` to `serverExternalPackages` if build requires (verify with `npm run build`).

## Phase 1b — Export for triage

- [ ] **CFB-7** — Script `scripts/export-cert-feedback-blob.ts` (or npm script) listing `cert-feedback/events/` prefix, downloading JSON bodies, appending to local JSONL; document usage in spec + cert-feedback-triage skill.

## Verification

- [ ] `npm run check` after changes.
- [ ] Manual checks in spec § Verification Quest (local file + preview with token).

## Backlog

- After merge: mark **1.60 CFB** `[x] Done` in [BACKLOG.md](../../backlog/BACKLOG.md) when shipped; run `npm run backlog:seed`.
