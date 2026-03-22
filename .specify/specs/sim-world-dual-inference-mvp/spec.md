# Spec: Sim World Dual Inference MVP

## Purpose

Ship a **minimal simulated game world** for **n = 1 real player (dogfood / custodian)** so BARs can run the same product surfaces against **two inference backends**:

1. **Hosted API** — current path (e.g. OpenAI via `OPENAI_API_KEY` and `@ai-sdk/openai`).
2. **Self-hosted GPU** — OpenAI-compatible HTTP base URL (e.g. vLLM, llama.cpp server, local Nemotron or other weights) selected by configuration, not forked code.

Capture **per-session (or per-beat) instrumentation** (tokens where available, latency, provider id) so the custodian can **estimate burn**, cap alpha scope, and tell a true fundraising story (Bruised Banana residency demos, future Kickstarter collateral) without guessing.

**Practice**: Deftness Development — spec kit first; smallest slice that proves dual paths + measurement; defer fleet-scale multi-agent orchestration and full “holodeck” breadth.

## Problem

- Inference today is **centralized** in `src/lib/openai.ts` and scattered `generateText` / agent calls with **implicit** OpenAI-only assumptions.
- There is **no first-class switch** for “same app, local weights,” so **unit economics** and **vendor risk** cannot be measured from real play.
- Fundraising narratives need **evidence**: “one booth, two engines, one ledger.”

## Vision Alignment (non-binding context)

- **Infinite arcade**: CYOA-length demos of psychotech; player leaves with **real-life validation quests** (transfer), not endless retention.
- **Economic frame**: Open source does not imply **below-cost hosting**; revenue (residency events, campaign, Kickstarter) can cover **compute + custodian** if caps and transparency are explicit.
- **Non-negotiable spend**: Emotional intelligence / Octalysis-class engagement where it prevents abandon or enables transformation; **successful egress** from the game is a success mode.

## User Stories

### P1: Custodian — dual backend without duplication

**As the** sole alpha player, **I want** to toggle or configure inference provider (API vs local-compatible) **so** I run the **same** quests/CYOA/agents paths and compare behavior and cost.

**Acceptance**: Documented env vars; one code path for LLM calls used by the MVP slice (see FR); switching provider does not require duplicating campaign content.

### P2: Custodian — observable burn

**As the** custodian, **I want** structured logs or export of **tokens (when reported), latency, provider, and rough cost** per labeled operation **so** I can size alpha concurrency and pitch sustainable pricing.

**Acceptance**: At least one aggregated view: CLI export, structured JSON log, or admin-only debug endpoint — spec’d in tasks; no requirement for production dashboards in MVP.

### P3: Demo owner — residency / pitch hook

**As a** demo owner, **I want** the Bruised Banana (or chosen) **main loop** to remain the public demo spine **so** dual inference MVP **augments** residency ship rather than replacing it.

**Acceptance**: MVP docs link to [bruised-banana-residency-ship](../bruised-banana-residency-ship/spec.md); no breaking change to sign-in → quest → wallet loop unless this spec explicitly requires it.

## Functional Requirements

### Phase 1 — Provider abstraction (MVP)

- **FR1**: Introduce a **single internal contract** for “completion-style” LLM calls from the **MVP slice** (e.g. `generateText` wrapper or small `InferenceProvider` module) supporting:
  - `openai` — existing API key path.
  - `openai_compatible` — base URL + API key (optional) + model name, using OpenAI-compatible chat/completions or AI SDK compatible wiring as implemented.
  - `stub` or existing deterministic fallback — unchanged behavior when keys/endpoints missing (project already degrades in places; align with [docs/AGENT_WORKFLOWS.md](../../../docs/AGENT_WORKFLOWS.md)).
- **FR2**: Configuration via environment variables (exact names in `plan.md` / implementation), documented in `docs/ENV_AND_VERCEL.md` or a short `docs/INFERENCE_PROVIDERS.md` if ENV doc would bloat.
- **FR3**: **Security**: local base URL must not enable SSRF in server code (validate host allowlist or `localhost`/private network policy in implementation notes).

### Phase 2 — Instrumentation

- **FR4**: For each LLM call in the MVP slice, emit **structured metadata**: `provider`, `model`, `durationMs`, `promptTokens` / `completionTokens` when available, `correlationId` (request or session), optional `beatLabel` (e.g. quest step id).
- **FR5**: Document how custodian **derives monthly burn** from logs (formula points to interview doc / internal runbook — not mandatory auto-pricing API).

### Phase 3 — Scope boundary

- **FR6**: MVP **does not** require full fleet of Game Master agents on GPU day one; **does** require that **one representative path** (e.g. threshold encounter generator, or one agent route used in Bruised Banana flow — chosen in `plan.md`) runs through the abstraction.
- **FR7**: **Python backend** agents: either (a) document “Phase 2” parity + same env contract, or (b) explicitly **defer** with issue link — **must not** leave ambiguity in `tasks.md`.

## Non-Goals (this spec)

- Choosing a specific **NVIDIA** stack or model; benchmarking Nemotron vs others (research only).
- Multi-tenant production SLOs, autoscaling inference pools.
- Full CYOA modular authoring integration (see [cyoa-modular-charge-authoring](../cyoa-modular-charge-authoring/spec.md)) unless a task explicitly ties a single beat.
- Completing **Mastering the Game of Allyship** content — tracked as separate authoring / campaign work; this spec **enables measurement** for when that ships.

## Dependencies

- [bruised-banana-residency-ship](../bruised-banana-residency-ship/spec.md) — demo-ready main loop (spiritual / operational anchor).
- [agent-workflows-cursor](../agent-workflows-cursor/spec.md) / [game-master-agents-cursor-integration](../game-master-agents-cursor-integration/spec.md) — backend + MCP patterns.
- [npc-simulated-player-content-ecology](../npc-simulated-player-content-ecology/spec.md) — future multi-actor sim; MVP is prerequisite plumbing.
- [transformation-simulation-harness](../transformation-simulation-harness/spec.md) — optional; CLI sim may reuse provider later.

## Acceptance Criteria (summary)

- [ ] Provider switch works for the **chosen MVP code path(s)** with documented env.
- [ ] Instrumentation emitted and documented; custodian can estimate a **reference session** cost.
- [ ] `npm run check` (and any new small test script) passes per fail-fix workflow.
- [ ] No regression to **deterministic / no-key** behavior beyond what this spec documents.

## Related Decisions Log

| Date | Decision |
|------|----------|
| 2026-03-19 | Spec created from custodian interview: dual inference + n=1 sim + fundraising narrative; profit target ($3k/mo) is **campaign economics**, not inferred from this MVP alone. |
