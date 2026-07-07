# Spec: Productivity Modality Alignment

## ID

`PMA` | Productivity Modality Alignment | Priority 2.12

---

## Purpose

Establish **research authority** for how bars-engine aligns with open-source GTD/GSD productivity patterns — data models, scalable primitives, and documented user failure modes — **without** becoming a conventional todo app.

**Problem:** bars-engine is gamified throughput software with partial isomorphism to GTD/PARA (Lenses, Tap the Vein, NextActionBridge) but no consolidated alignment doc. Ad-hoc "make it more like X" requests risk violating [living-world-experience](../living-world-experience/spec.md) and [PLAYER_SUCCESS.md](../../../docs/PLAYER_SUCCESS.md).

**Practice:** Deftness Development — research → phased deltas into existing specs; schema proposals deferred until loop wiring exhausted. See [SIX_GAME_MASTER_REVIEW.md](./SIX_GAME_MASTER_REVIEW.md).

---

## Design Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Research scope | Player-facing primary (GTD, PARA, OSS apps) | Six GM Q2 ruling |
| OpenGSD | Appendix only (≤15%) | Dev workflow owned by opengsd-workflow-migration |
| Implementation style | Umbrella spec + **cross-spec deltas** | Regent: avoid forked authority vs POF/Lenses |
| Schema changes | Phase C only, proposals in SCHEMA_GAPS.md | Architect: loop wiring first |
| UX veto | living-world-experience + Challenger veto list | No task-list primary nav |
| Gamification | Absorb anti-PBL; reject punitive streaks | Shaman shame-spiral test |

---

## Conceptual Model

```
External GTD/PARA patterns          bars-engine primitives
─────────────────────────          ──────────────────────
Inbox capture          ──────────► Charge, TTV rawEntry, BAR seed
Clarify (2-min / 321)  ──────────► 321, Inquiry, tune
Project                ──────────► CustomBar quest + campaignRef
Next action            ──────────► NextActionBridge, TTV task (≤5)
Area / Horizon         ──────────► LensGoal + Lens hierarchy
Weekly review          ──────────► Lens workshop + TTV close
Waiting for            ──────────► GAP → PlayerQuest delegation (Phase C)
Someday / compost      ──────────► Parked goal, shadow quest, Garden
```

**Energy:** Vibeulons (inspiration, not XP). **Moves:** WAVE (Wake/Open/Clean/Grow/Show).

---

## User Stories

### P1: Steward runs modality research

**As a** steward/architect, **I want** a reusable research prompt and completed RESEARCH.md, **so that** alignment decisions cite evidence rather than appetite.

**Acceptance:**
- [RESEARCH_PROMPT.md](./RESEARCH_PROMPT.md) is copy-paste runnable
- [RESEARCH.md](./RESEARCH.md) passes verification checklist in prompt §7
- Six GM ruling recorded in [SIX_GAME_MASTER_REVIEW.md](./SIX_GAME_MASTER_REVIEW.md)

### P2: Implementation follows phased roadmap

**As a** developer, **I want** phased tasks that **link** to POF, Lenses, and golden-path specs, **so that** we don't duplicate or fork work.

**Acceptance:**
- [plan.md](./plan.md) defines Phase A/B/C gates
- [tasks.md](./tasks.md) items reference external spec paths
- No Prisma migration in Phase A/B

### P3: Players experience alignment without productivity chrome

**As a** player, **I want** clearer "what's next" and weekly reflection **in game voice**, **so that** I metabolize charge without shame or planner overload.

**Acceptance:** (downstream specs)
- Star of Bethlehem card (golden-path)
- Lens workshop review cadence (Lenses)
- No Eisenhower/inbox-zero UI shipped under PMA directly

---

## Functional Requirements

### Phase A — Research (this spec kit)

- **FR1:** Publish RESEARCH_PROMPT, RESEARCH, SIX_GAME_MASTER_REVIEW, SCHEMA_GAPS
- **FR2:** Adopt/Adapt/Absorb/Reject matrix with file citations
- **FR3:** BACKLOG row `PMA` seeded

### Phase B — Loop wiring (deltas to existing specs)

- **FR4:** Next-action cascade + dashboard card → golden-path / CGLA tasks
- **FR5:** Lens workshop = weekly review ritual → lens-integration / lenses-observatory tasks
- **FR6:** PARA semantics documented → QLA / LensGoal docs
- **FR7:** POF streak policy → personal-ops-funnel amendment (celebratory opt-in only)

### Phase C — Schema (conditional)

- **FR8:** Waiting-for metadata or columns per [SCHEMA_GAPS.md](./SCHEMA_GAPS.md) after B complete

---

## Non-Functional Requirements

- Research artifacts readable by non-engineers (Diplomat summary in RESEARCH.md)
- Dual-track: no AI-required processing paths from this alignment
- Cross-platform: patterns apply to web app; local-first noted for POF Obsidian sync only

---

## Dependencies

- [core-game-loop-audit](../core-game-loop-audit/spec.md)
- [personal-ops-funnel](../personal-ops-funnel/spec.md)
- [lens-integration-refactor](../lens-integration-refactor/spec.md)
- [golden-path-onboarding-action-loop](../golden-path-onboarding-action-loop/)
- [living-world-experience](../living-world-experience/spec.md)
- [opengsd-workflow-migration](../opengsd-workflow-migration/spec.md) (appendix only)

---

## References

- [RESEARCH_PROMPT.md](./RESEARCH_PROMPT.md)
- [RESEARCH.md](./RESEARCH.md)
- [book-integration-analysis/architect-books.md](../book-integration-analysis/architect-books.md)
- [docs/JIRA_GITHUB_CYOA_METAPHOR.md](../../../docs/JIRA_GITHUB_CYOA_METAPHOR.md)
