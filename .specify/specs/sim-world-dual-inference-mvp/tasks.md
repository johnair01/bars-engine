# Tasks: Sim World Dual Inference MVP

## Phase 0: Spec kit

- [x] Create `.specify/specs/sim-world-dual-inference-mvp/spec.md`
- [x] Create `.specify/specs/sim-world-dual-inference-mvp/plan.md`
- [x] Create `.specify/specs/sim-world-dual-inference-mvp/tasks.md`
- [x] Register in `.specify/backlog/BACKLOG.md`

## Phase 1: Provider abstraction

- [ ] Add `src/lib/inference/` (or equivalent) with:
  - [ ] Resolved config from env (`INFERENCE_PROVIDER`, base URL, keys, model override)
  - [ ] `getLanguageModel()` or `runGenerateText()` entry used by MVP slice
  - [ ] Host allowlist / localhost-only policy for `INFERENCE_BASE_URL` (no arbitrary URL fetch)
- [ ] Document env vars in `docs/INFERENCE_PROVIDERS.md` **or** `docs/ENV_AND_VERCEL.md`
- [ ] Update `.env.example` (when file exists) if helpful

## Phase 2: MVP call-site(s)

- [ ] **Choose** primary slice (record in PR description):
  - [ ] Option A: `src/lib/threshold-encounter/generator.ts`
  - [ ] Option B: (other) _________________________
- [ ] Migrate chosen call site(s) to shared inference module
- [ ] **Python backend parity** (check one):
  - [ ] **2b-i**: Implement same env contract in `backend/` for the route(s) used in demos — **or**
  - [ ] **2b-ii**: Defer: create backlog prompt under `.specify/backlog/prompts/` + link from spec “Open Questions” with target date/spec id

## Phase 3: Instrumentation

- [ ] Emit structured log (or metrics) per call: `provider`, `model`, `durationMs`, usage tokens if present, `correlationId`
- [ ] Add short **burn estimation** subsection in docs (formula + link to `spec.md` interview framing)
- [ ] Optional: admin-only or CLI script to aggregate last N log lines — only if low effort

## Phase 4: Verification

- [ ] `npm run check` passes
- [ ] Manual: hosted OpenAI path (with key)
- [ ] Manual: `openai_compatible` path against local mock or real OpenAI-compatible server
- [ ] Manual: missing key / stub path still degrades as documented

## Phase 5: Campaign alignment (docs only, no blockers)

- [ ] One paragraph in `bruised-banana-residency-ship` plan or README cross-link: “dual inference MVP proves booth + ledger” (optional if custodian prefers single doc — link from `spec.md` Related is enough)
