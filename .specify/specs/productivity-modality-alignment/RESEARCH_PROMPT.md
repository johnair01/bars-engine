# Research Prompt: Productivity Modality Alignment for bars-engine

> **Copy-paste this entire document** into Cursor, Claude, or a strand-consult script to run productivity-modality research. Output should be written to `RESEARCH.md` in this folder.

---

## §0 — Mission & disambiguation

You are researching **open-source and methodological productivity systems** to produce an **alignment matrix** for **bars-engine** — gamified personal/collective throughput software built on Integral Theory, BAR/Quest grammar, and anti-PBL gamification.

### Three meanings of "GSD" (disambiguate in your output)

| Term | Meaning | Research weight |
|------|---------|-----------------|
| **GTD / Getting Things Done** | David Allen's capture→clarify→organize→reflect→engage methodology | **Primary** |
| **Colloquial GSD** | "Get stuff done" apps (e.g. Eisenhower-matrix task managers) | **Primary** (patterns only) |
| **OpenGSD** | Developer workflow: "Git. Ship. Done." (`@opengsd/gsd-pi`) | **Appendix only (≤15%)** — structural comparison, no feature import |

### Change boundary

- **This research produces:** alignment matrix, Adopt/Adapt/Absorb/Reject table, schema gap *proposals*, UX surface map, failure-mode catalog, phased roadmap.
- **This research does NOT:** implement Prisma migrations, ship UI, or merge bars-engine into a todo app.

### Canonical bars-engine ontology (read before researching)

- [FOUNDATIONS.md](../../../FOUNDATIONS.md) — BAR kernel, WAVE moves, Kotter communal spine
- [docs/JIRA_GITHUB_CYOA_METAPHOR.md](../../../docs/JIRA_GITHUB_CYOA_METAPHOR.md) — backlog/sprint/issue metaphor
- [docs/PLAYER_SUCCESS.md](../../../docs/PLAYER_SUCCESS.md) — success ≠ quest count
- [living-world-experience/spec.md](../living-world-experience/spec.md) — **avoid** Notion/ClickUp/Jira chrome
- [personal-ops-funnel/GAP_ANALYSIS.md](../personal-ops-funnel/GAP_ANALYSIS.md) — streak/shame risks

### Design guardrails (veto authority)

1. Absorb **patterns**, not productivity-app chrome
2. Reject productivity-shame, streak punishment, inbox-zero obsession
3. Shadow work (321, Inquiry) ≠ tasks — separate practice flows
4. Preserve non-AI / dual-track legibility (Portland community context)
5. Every **Adopt** row must pass the **shame-spiral test**: "Does this punish non-completion?"

---

## §1 — Corpus to survey

### Methodologies (conceptual)

- **GTD** — inbox, next action, contexts, horizons (runway→50k ft), weekly review, 2-minute rule, waiting-for, someday/maybe
- **PARA** — Projects / Areas / Resources / Archives
- **OKR / SMART** — measurable outcomes (gap in bars-engine quest generation)
- **Eisenhower** — urgency/importance quadrants
- **Kotter 8-step** — already first-class in bars-engine; compare only
- **Morning pages / 750words** — daily capture floor; Tap the Vein lineage
- **Octalysis** — Discovery → Onboarding → Scaffolding → Endgame journey phases

### Open-source implementations (mandatory deep-read — schema level)

| Project | URL | Focus |
|---------|-----|-------|
| **Tandem GTD** | https://github.com/courtemancheatelier/tandem-gtd | Cascade engine, horizons, guided weekly review, MCP |
| **Mindwtr** | https://github.com/dongdongbh/Mindwtr | Local-first GTD, areas/projects, waiting-for, MCP |
| **GSD Task Manager** | https://github.com/vscarpenter/gsd-task-manager | Eisenhower matrix, offline-first, MCP, dependencies |
| **Vikunja** | https://github.com/go-vikunja/vikunja | Kanban + GTD hybrid, self-hosted |
| **Habitica** | https://github.com/HabitRPG/habitica | Gamified contrast (PBL risks) |

### Appendix (dev workflow only)

| Project | URL | Focus |
|---------|-----|-------|
| **OpenGSD** | https://www.npmjs.com/package/@opengsd/gsd-pi | Milestones/slices/tasks — compare to Spec Kit + Lens periods |

### Expand search

Find 2–3 additional OSS tools with active 2025–2026 development. Prefer: local-first, AGPL/MIT, documented data models, MCP or API.

---

## §2 — Data model extraction template

For **each** system/methodology, fill:

| Primitive | Definition | Lifecycle states | Relationships | Review cadence | Gamification hooks |
|-----------|------------|------------------|---------------|----------------|--------------------|

### bars-engine mapping anchors (map every external primitive here or mark GAP)

```
inbox/capture     → charge capture, TapTheVeinDailySession.rawEntry, BAR draft
project           → CustomBar (type: quest) + campaignRef + thread
next_action       → NextActionBridge.nextAction, TapTheVeinTask (committed)
context           → allyshipDomain, lensFaceKey, moveType (partial)
horizon/goal      → Lens + LensGoal lineage (year→week)
area              → LensGoal.domain (PARA-like, under-specified)
review            → Lens workshop, TTV carry/compost
waiting_for       → GAP — PlayerQuest delegation underdeveloped
someday_maybe     → shadow quest, garden compost, parked LensGoal
habit/streak      → DeckJournal streak only; WritingSession streak = risk
delegation        → BarShare, campaign roles, PlayerQuest
```

**Code anchors:** `prisma/schema.prisma` (`CustomBar`, `Lens`, `LensGoal`, `TapTheVeinTask`, `NextActionBridge`, `PlayerQuest`), `src/actions/tap-the-vein.ts`, `src/actions/next-action-bridge.ts`.

---

## §3 — Scalability & robustness criteria

Score each primitive 1–5 on:

| Criterion | Question |
|-----------|----------|
| **Bounded focus** | Does the system cap WIP? (bars-engine: 5 TTV/day, Hand slots) |
| **Deterministic routing** | Rules vs AI-required steps |
| **Multiplayer / delegation** | waiting-for, shared projects |
| **Offline / local-first** | Mindwtr pattern vs web-only |
| **Export / compost** | Nothing wasted — archive ≠ delete |
| **MCP/agent integration** | Emerging automation surface |

---

## §4 — Emergent user failure modes (required)

Catalog **documented** pain points (GitHub issues, reviews, methodology critiques) — minimum **8 rows**:

| Failure mode | Typical trigger | How systems handle it | bars-engine analog / risk |
|--------------|-------------------|----------------------|---------------------------|
| Inbox overwhelm | capture without clarify | guided processing, 2-min rule | post-321 choice paralysis |
| Productivity shame spiral | streak loss, red badges | opt-out streaks, no punishment | 750words streak in POF |
| Stale projects | no next action | cascade engine | orphaned quests w/o NextActionBridge |
| Review abandonment | weekly review too heavy | guided wizard, phased review | Lens workshop friction |
| Context switching | too many lists | @context filters | dashboard portal overload |
| Gamification toxicity | PBL-only rewards | White Hat design | vibeulon overjustification |
| Shadow work bypass | inner work as tasks | separate practice apps | 321 vs quest conflation |
| Dependency hell | over-modeled blocking | simple sequential projects | quest nesting complexity |
| Planner performance | filling boxes ≠ doing | next-action-first UX | Lenses as productivity planner |
| AI clarify dependency | AI required to process | BYOK optional AI | dual-track violation |

---

## §5 — Required output artifacts

1. **Modality comparison matrix** — rows = primitives, columns = GTD / PARA / Tandem / Mindwtr / GSD-TM / bars-engine
2. **Adopt / Adapt / Absorb / Reject** — per pattern, with rationale tied to LWX + PLAYER_SUCCESS + file citation
3. **Schema gap list** → `SCHEMA_GAPS.md` format (proposals only)
4. **UX gap list** — Observatory / Garden / Hand / TTV / Vault surfaces
5. **Anti-patterns** — explicit reject list with spec guardrail citations
6. **Top 5 alignment bets** — deftness-ordered (highest leverage, lowest rework)
7. **Diplomat summary** — plain language, no competitor name-dropping (for stewards)

---

## §6 — Six Game Master lens (optional second pass)

| Face | Research angle |
|------|----------------|
| **Architect** | Data models, cascade/review engines, API contracts |
| **Regent** | WIP limits, phased gates, permissions on shared work |
| **Challenger** | Where productivity metaphors break the game's soul |
| **Shaman** | Emotional failure modes, shame spirals, shadow work |
| **Diplomat** | Copy/translation; avoid productivity-bro tone |
| **Sage** | Integration synthesis → phased roadmap |

---

## §7 — Verification checklist

Research is complete when:

- [ ] ≥3 OSS repos analyzed at **schema/API** level (not marketing pages only)
- [ ] Every **Adopt/Adapt** row cites a bars-engine hook file path
- [ ] Every **Reject** row cites a spec guardrail
- [ ] Failure modes ≥8 rows with bars-engine risk column filled
- [ ] OpenGSD appendix ≤15% of document
- [ ] Cross-checked against: `core-game-loop-audit`, `personal-ops-funnel/GAP_ANALYSIS`, `architect-books.md`, `lenses-observatory-intake/SIX_GAME_MASTER_REVIEW.md`

---

## Challenger veto list (auto-reject without strong justification)

- Primary navigation = task list / Eisenhower matrix
- Punitive streaks or inbox-zero badges
- Unlimited daily task capture without WIP cap
- AI-required clarify or weekly review steps
- Productivity accounting (weighted human contributions)
- Raw import of Jira/Notion/ClickUp UI patterns
