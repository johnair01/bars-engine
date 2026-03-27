# Spec: Bruised Banana residency — marketing & content metabolism (BBM)

## Purpose

Give stewards a **repeatable way** to keep **invite messaging**, **in-game copy** (Twine, quests, `/event`), and **BAR/quest seeds** aligned with the **Bruised Banana residency** story—without ad-hoc chat edits or a second planning system. **Metabolism** means: brief → draft in-repo → verify → feedback JSONL → small spec-backed PRs.

**Problem:** Residency marketing and “fiddly” content live in many files; drift is invisible until playtests. Agents exist but lack a **named workflow** tied to specs and feedback loops.

**Practice:** Deftness Development — **Spec Kit authority**; v1 is **process + canonical docs**; any player-facing surface in a later phase gets a verification quest.

## Design Decisions

| Topic | Decision |
|-------|----------|
| v1 scope | **No new Prisma models or player routes.** Deliver **spec kit** + **[message-framework.md](./message-framework.md)** + cross-links to [CONTENT_AGENT_PLAYBOOK](../../../docs/CONTENT_AGENT_PLAYBOOK.md). |
| “Generate” | v1 = **human + Cursor + bars-agents MCP + skills** (not unattended batch generation). Optional Phase 2: scripted prompts / admin UI. |
| Voice source of truth | **Message framework** (pillars, taboos, exemplars) + existing event/onboarding docs; **narrative-quality** skill reads Voice KB. |
| Correctness | **Cert CYOA** where UX ships; **`.feedback/*.jsonl`** + **cert-feedback-triage** for issues; **`npm run check`** after copy/seed edits. |
| Campaign anchors | **House instance**, **party/event runbooks**, **Partiful/event copy** docs—linked from message framework, not duplicated long-term. |

## Conceptual Model

| Layer | WHO | WHAT | WHERE |
|-------|-----|------|--------|
| **Brief** | Steward / marketing | Residency beats, dates, CTA priorities | [message-framework.md](./message-framework.md), backlog prompts |
| **Draft** | Human + agent | Twine passages, seed passages, React copy | `content/twine/`, `scripts/seed-*.ts`, `src/app/event/` |
| **Verify** | Human + cert | Play paths, seed certs | Certification quests, manual `/event` walk |
| **Metabolize** | Triage | Player/steward feedback → tasks | `.feedback/cert_feedback.jsonl`, `.feedback/narrative_quality.jsonl` → `.specify/specs/*/tasks.md` |

## API Contracts (API-First)

**v1:** None. Phase 2+ (if admin “brief” API or generator endpoint is added): document here before implementation.

## User Stories

### P1: Single place for “what we’re saying”

**As a** residency steward, **I want** message pillars and taboos in one repo-owned doc, **so** Twine, invites, and `/event` don’t contradict each other.

### P2: Named agent path for content passes

**As a** developer, **I want** BBM linked from the content playbook, **so** every Twine/seed/event edit session uses the same pre-flight and MCP/skill choices.

### P3: Feedback closes the loop

**As a** steward, **I want** cert and narrative feedback triaged into **small** spec tasks, **so** we fix drift without rewriting the game in chat.

## Functional Requirements

### Phase 1 (this spec kit + framework)

- **FR1**: Spec folder with `spec.md`, `plan.md`, `tasks.md`, and **[message-framework.md](./message-framework.md)** (pillars, links to BB dates/docs, agent workflow pointer).
- **FR2**: [BACKLOG.md](../../backlog/BACKLOG.md) row **BBM** links to this `spec.md`.
- **FR3**: [CONTENT_AGENT_PLAYBOOK.md](../../../docs/CONTENT_AGENT_PLAYBOOK.md) references BBM for **residency-aligned** content metabolism (one short section or link).
- **FR4**: Document **dependencies** on BBR execution slice, CHS hub doc, and feedback skills (see below).

### Phase 2 (future — not v1)

- **FR5** (optional): In-app **content brief** or checklist for admins (requires new spec slice + verification quest).
- **FR6** (optional): Automation (e.g. script that diffs user-facing strings against pillars)—only after v1 process is stable.

## Non-Functional Requirements

- **Community / AI allergy:** Non-AI path stays first-class; framework describes **manual** steps explicitly.
- **No parallel planning:** Work still lands via Spec Kit tasks and PRs; BBM does not replace `.specify/specs/*`.

## Verification Quest

**v1:** None — no player-facing UI ships with this slice. When Phase 2 adds a verifiable surface, add `cert-bb-residency-marketing-metabolism-v1` (or similar) per [cyoa-certification-quests](../cyoa-certification-quests/spec.md).

## Dependencies

- **BBR** — [event-invite-party-initiation](../event-invite-party-initiation/spec.md), [party-mini-game-event-layer](../party-mini-game-event-layer/spec.md), [bbr-p3-residency-events-nav](../bbr-p3-residency-events-nav/spec.md): execution slice for invites, bingo, events nav.
- **CHS** — [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md): hub/spoke narrative IA (Future-tier; cite where copy must align).
- **Skills** — `.agents/skills/narrative-quality`, `.agents/skills/cert-feedback-triage`.
- **House / instance** — [bruised-banana-house-instance](../bruised-banana-house-instance/spec.md).
- **Playbook** — [CONTENT_AGENT_PLAYBOOK.md](../../../docs/CONTENT_AGENT_PLAYBOOK.md), [AGENT_WORKFLOWS.md](../../../docs/AGENT_WORKFLOWS.md).

## References

- Backlog prompt: [.specify/backlog/prompts/bb-residency-marketing-metabolism-spec.md](../../backlog/prompts/bb-residency-marketing-metabolism-spec.md)
- Event copy example: [docs/events/bruised-banana-apr-2026-partiful-copy.md](../../../docs/events/bruised-banana-apr-2026-partiful-copy.md)
- Plan: [plan.md](./plan.md)
- Tasks: [tasks.md](./tasks.md)
- Message framework: [message-framework.md](./message-framework.md)
