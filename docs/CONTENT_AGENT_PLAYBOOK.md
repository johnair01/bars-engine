# Content agent playbook (Cursor + bars-engine)

Repeatable use of **bars-agents MCP**, **Cursor skills** (`.agents/skills/`), and **Spec Kit** for Twine, seeds, certification copy, and player-facing UI text—without a second planning system. Habits inspired by external “game studio” templates apply here as **structure**, not as a parallel agent hierarchy.

**Authority:** Spec Kit (`.specify/specs/*/`) remains canonical per project rules. Agents refine and land work; they do not replace `spec.md` / `tasks.md`.

See also: [AGENT_WORKFLOWS.md](./AGENT_WORKFLOWS.md), [CURSOR_MCP_TROUBLESHOOTING.md](./CURSOR_MCP_TROUBLESHOOTING.md), [UI_COVENANT.md](../UI_COVENANT.md).

### BBM — Bruised Banana residency alignment

For **residency** copy (Twine onboarding, `/event`, invite CYOA, cert seeds), use **BBM** as the voice + metabolism anchor:

1. Read the [message framework](../.specify/specs/bb-residency-marketing-metabolism/message-framework.md) (pillars, taboos, surface table, date links).
2. Requirements and phases: [BBM spec](../.specify/specs/bb-residency-marketing-metabolism/spec.md).
3. Then follow **Pre-flight** and the workflow table below; for **cross-surface** tone alignment, use MCP **`sage_consult`** (not generic chat only).

---

## Pre-flight (before a content sprint)

Run when you need **real** synthesis (not deterministic MCP fallbacks):

| Step | Command / action |
|------|------------------|
| API key | `OPENAI_API_KEY` in repo root `.env.local` (backend reads same files). |
| Node smoke | `npm run smoke` — confirms key visible to Node-side scripts. |
| Backend | `npm run dev:backend` (or let MCP wrapper auto-start). |
| Python health | `curl -s http://127.0.0.1:8000/api/health` → expect `"openai_configured": true`. |
| MCP | `npm run verify:bars-agents-mcp` — fix before relying on `sage_consult`, `strand_run`, etc. |
| Cursor | **Settings → MCP → bars-agents** enabled; **Reload Window** after MCP server code changes. |

**Pin MCP to local (when Next points at Vercel):** `BARS_MCP_HEALTH_ORIGIN=http://127.0.0.1:8000` in `.env.local`. Details in AGENT_WORKFLOWS.md.

---

## Content workflows (by artifact type)

| Workflow | Typical inputs | Agent path | Landing zone | Verify |
|----------|----------------|------------|--------------|--------|
| Twine / onboarding | `content/twine/onboarding/bruised-banana-onboarding-draft.twee` | [.agents/skills/narrative-quality/SKILL.md](../.agents/skills/narrative-quality/SKILL.md); optional MCP `diplomat_refine_copy`, `diplomat_bridge`, `architect_draft` | Twee file; check off `tasks.md` for the linked spec | `npm run check`; exercise `/campaign/twine` if applicable |
| Certification / QA | Failing cert quest, tester notes, [`.feedback/cert_feedback.jsonl`](../.feedback/cert_feedback.jsonl) | [.agents/skills/cert-feedback-triage/SKILL.md](../.agents/skills/cert-feedback-triage/SKILL.md); MCP `regent_assess`, `challenger_propose` | Spec kit + backlog; seed updates in `scripts/seed-cyoa-certification-quests.ts` when needed | Relevant `npm run seed:cert:*`; cert CYOA run |
| Seed / quest graph | `scripts/seed-cyoa-certification-quests.ts`, related seeds | Small diffs—**one quest or thread at a time**; MCP `architect_compile`-style discipline (structured JSON in / out) | Seed script + `backlogPromptPath` on `CustomBar` | `npm run check`; db seed against synthetic DB if schema touched |
| Event / donate / residency copy | `src/app/event/**`, related components | MCP `shaman_read`, `diplomat_guide`, `diplomat_refine_copy`; keep scope to **one route or component** | React/TSX; **UI_COVENANT** + cultivation tokens | `npm run check`; visual pass on `/event`, `/event/donate` |

**Scope rule:** One passage, one cert quest, or one route per session chunk—then verify. Reduces merge pain and keeps narrative voice coherent.

**Integration / cross-cutting tone:** MCP **`sage_consult`** for meta questions (alignment across onboarding + event + quests)—see `.cursor/rules/game-master-agents.mdc`.

**Wide repo audit:** Cursor **`mcp_task`** with subagent `explore` (Shaman mapping)—**narrow prompt** (e.g. “strings under `src/app/event` that contradict spec X”).

---

## End-to-end: Twine onboarding content pass

Use this when editing Bruised Banana onboarding Twee (file-based story loaded by [`src/app/campaign/twine/page.tsx`](../src/app/campaign/twine/page.tsx)).

1. **Pre-flight** — Table above (key, backend, MCP verify).
2. **Spec anchor** — Open the spec that owns this copy (e.g. onboarding / NEV / campaign docs under `.specify/specs/`). Note acceptance criteria you are satisfying.
3. **Edit** — Change `content/twine/onboarding/bruised-banana-onboarding-draft.twee` (or the passage subset you scoped).
4. **Skill** — Load **narrative-quality** skill: align with Voice Style Guide / emotional-alchemy notes in that skill; keep player-facing language consistent with residency tone.
5. **Optional MCP** — `diplomat_refine_copy` with `target_type` + `current_copy` for a single passage body; or `diplomat_bridge` if moving copy between “lore” and “UI CTA” shape.
6. **Player shell** — If you add links or special targets (e.g. `EventDonate`, `BeginPlay`), confirm handling in [`src/components/campaign/BruisedBananaTwinePlayer.tsx`](../src/components/campaign/BruisedBananaTwinePlayer.tsx).
7. **Verify** — `npm run check`; manually walk `/campaign/twine` (and sign-in paths if you touched `BeginPlay`).
8. **Tasks** — Check off the relevant item in the spec’s `tasks.md` when done.

---

## Feedback loop: cert + narrative JSONL → specs and PRs

Inputs:

- [`.feedback/cert_feedback.jsonl`](./../.feedback/cert_feedback.jsonl) — certification / “report issue” style findings.
- [`.feedback/narrative_quality.jsonl`](./../.feedback/narrative_quality.jsonl) — admin / quality pipeline.

**Rhythm (e.g. before release or weekly):**

1. Pick **one** spec folder under `.specify/specs/<name>/` to own the batch (or BACKLOG row).
2. Open a Cursor session scoped to that spec + the JSONL slice (filter by `questId` / date if large).
3. Run **cert-feedback-triage** and/or **narrative-quality** skills—they describe how to promote items into `spec.md`, `tasks.md`, or `.specify/backlog/BACKLOG.md`.
4. Land **small PR-sized** edits: copy fixes, one seed passage, one component—avoid “rewrite the game” in one shot.
5. Run `npm run check` (or `npm run precommit:check` before commit—see package.json).

---

## Copy-paste prompts (starters)

Adapt names/paths to your ticket.

**Sage (cross-cutting):**  
“Using bars-agents `sage_consult`: Does onboarding Twee Donate Handoff + `/event/donate` copy contradict each other? Output concrete file:line suggestions only.”

**Diplomat (clarity):**  
“Using `diplomat_refine_copy`: `target_type=event_cta`, refine this string for a skeptical but willing player: …”

**Cert triage:**  
“Follow cert-feedback-triage: ingest last 10 lines of `.feedback/cert_feedback.jsonl` and propose spec kit updates under `.specify/specs/now-event-vault-throughput-qol/`.”

---

## What not to do

- Do **not** bypass Spec Kit for feature work—agents assist implementation tied to specs.
- Do **not** import a full external **Claude Code** agent tree (e.g. 48-role studio packs) as a second command structure; cherry-pick **habits** only.
- Do **not** duplicate lint/typecheck logic in ad-hoc bash—use **`npm run check`** (see `precommit:check` in package.json).
- Do **not** treat MCP deterministic JSON (`"deterministic": true`) as shipped narrative quality—fix `OPENAI_API_KEY` and backend health first.

---

## Related npm scripts

| Script | Purpose |
|--------|---------|
| `npm run check` | Lint + typecheck + repo verify steps (fail-fix canonical). |
| `npm run precommit:check` | `check` + manifest validation—recommended git pre-commit hook body. |
| `npm run verify:bars-agents-mcp` | MCP + backend wiring before agent-heavy Cursor work. |
| `npm run smoke` | Quick Node-side env check including API key hint. |
