# Productivity Modality Research — Findings

**Date:** 2026-07-02  
**Method:** Executed per [RESEARCH_PROMPT.md](./RESEARCH_PROMPT.md) against OSS repos (README + docs), bars-engine gap docs, and Six GM ruling.  
**Scope:** Player-facing primary; OpenGSD appendix.

---

## Diplomat summary (for stewards)

We studied how serious open-source productivity systems handle **daily focus**, **next actions**, **goals over time**, and **weekly reflection** — not to become a todo app, but to **wire what bars-engine already has** (Lenses, Tap the Vein, quests, BARs) more clearly. The game should keep feeling like a **living world you tend**, not a planner you obey. Patterns we absorb: **one honest next step**, **capped daily work**, **guided review without shame**. Patterns we reject: **inbox-zero pressure**, **punitive streaks**, **task-list navigation**.

---

## 1. Modality comparison matrix

| Primitive | GTD (Allen) | PARA (Forte) | Tandem GTD | Mindwtr | GSD Task Mgr | bars-engine |
|-----------|-------------|--------------|------------|---------|--------------|-------------|
| **Capture** | Inbox, ubiquitous capture | Resources (optional) | Inbox + email-to-inbox | Inbox + voice/hotkey | Quick-add quadrants | Charge capture, TTV rawEntry, BAR canvas |
| **Clarify** | Is it actionable? next action? | Sort to P/A/R/A | Guided processing + 2-min rule | Clarify wizard + optional AI | Implicit (quadrant placement) | 321, Inquiry, tune BAR |
| **Project** | Multi-step outcome | Projects (deadline) | Project + sub-projects, sequential/parallel | Projects + sections + areas | Task + dependencies | `CustomBar` quest + `campaignRef` + thread |
| **Next action** | Single physical visible action | — | **Cascade engine** on complete | Next Actions in Focus view | Quadrant task | `NextActionBridge`, TTV committed (≤5) |
| **Context** | @context tags | — | Context + energy + time filters | Slash contexts (@work/meetings) | — | `allyshipDomain`, `lensFaceKey`, `moveType` (partial) |
| **Horizon / Area** | 6 horizons | Areas (ongoing) | Horizons of Focus + Areas | Areas + project states | — | `Lens` hierarchy + `LensGoal.domain` |
| **Waiting for** | Delegated items | — | Multi-user delegation | Waiting For list | — | **GAP** — `PlayerQuest` underdeveloped |
| **Someday/Maybe** | Deferred list | Archives | Someday + parked | Someday/Maybe + Archived | — | Parked `LensGoal`, shadow quest, compost |
| **Review** | Weekly review ritual | Periodic PARA sort | **Guided** Get Clear→Current→Creative | Weekly + daily review wizards | — | Lens workshop (partial), TTV carry/compost |
| **WIP limit** | Implicit (focus) | — | Do-Now filters | Focus view | 4 quadrants (soft) | **5 TTV/day**, Hand slots (strong) |
| **Gamification** | None (methodology) | None | Minimal (health widgets) | Minimal (digests) | None | Vibeulons, moves, Kotter — **anti-PBL** |
| **Agent/MCP** | — | — | MCP (tasks, wiki, teams) | mindwtr-mcp | MCP server | bars-agents MCP (domain, not GTD clone) |

---

## 2. OSS deep-read summaries

### Tandem GTD (`courtemancheatelier/tandem-gtd`)

- **Stack:** Next.js, PostgreSQL, Prisma, AGPL-3.0
- **Standout primitives:** Next-action **cascade engine** (complete task → promote unblocked successor); **context+energy+time** as primary "Do Now" surface; **guided weekly review** with stale-project surfacing; horizons + areas as first-class entities
- **Scalability:** Multi-user on shared instance; export JSON/CSV; MCP for agent automation
- **Documented pain points (category):** Self-host complexity; GTD purity vs onboarding steepness; AI coach optional but tempting as crutch
- **bars-engine hook:** Cascade → `NextActionBridge` + `quest-placement.ts`; review → Lens workshop cadence

### Mindwtr (`dongdongbh/Mindwtr`)

- **Stack:** Tauri/RN, local-first, AGPL-3.0, 1k+ stars
- **Standout primitives:** Full GTD lifecycle views (Inbox, Focus, Projects, Contexts, Waiting, Someday); **progressive disclosure**; fluid recurrence; Obsidian import/deep links
- **Scalability:** WebDAV/Dropbox/self-hosted sync; offline PWA; BYOK AI (never required)
- **Documented pain points:** Feature breadth vs "bike not cockpit" philosophy tension; sync backend choice overload
- **bars-engine hook:** Waiting-for + someday lists → metadata on `PlayerQuest` / parked goals; local-first patterns inform POF Obsidian sync (Phase 2)

### GSD Task Manager (`vscarpenter/gsd-task-manager`)

- **Stack:** Next.js, IndexedDB local-first, optional PocketBase sync, MIT
- **Standout primitives:** Eisenhower quadrants; task **dependencies** with circular prevention; MCP for NL task management
- **Scalability:** Privacy-first offline; Docker self-host
- **Documented pain points:** Not GTD-complete — urgency/importance ≠ clarifying outcomes; quadrant drag can become procrastination theater
- **bars-engine hook:** **Reject** as primary nav; **Adapt** dependency concept only for quest-thread ordering (already partial in campaign graph)

### Habitica (contrast — gamified productivity)

- **Standout:** HP/XP/gold, streaks, party quests — classic PBL + loss avoidance (Black Hat)
- **bars-engine lesson:** Validates anti-PBL stance; streaks without opt-in shame violate [PLAYER_SUCCESS.md](../../../docs/PLAYER_SUCCESS.md) and POF GAP_ANALYSIS

### Vikunja (expander)

- **Standout:** Kanban + GTD lists, self-hosted Go backend
- **bars-engine hook:** Kanban maps to `GameboardSlot` / campaign deck — already covered by Jira metaphor; no new primitive needed

---

## 3. Adopt / Adapt / Absorb / Reject

| Pattern | Verdict | Rationale | bars-engine hook / guardrail |
|---------|---------|-----------|------------------------------|
| Next-action cascade on complete | **Adapt** | Tandem's killer feature; bars has `NextActionBridge` but no auto-promote | `src/actions/next-action-bridge.ts`, golden-path specs |
| Guided weekly review wizard | **Adapt** | Lens workshop as ritual, not planner grid | `lenses-observatory-intake`, LWX Observatory |
| Context + energy + time "Do Now" | **Adapt** | Map to moveType + allyshipDomain + TTV cap — **one card**, not filters UI | `architect-books` Star of Bethlehem gap |
| PARA Projects vs Areas | **Adapt** | Clarify `LensGoal` (area/horizon) vs quest (project) semantics | `LensGoal.domain`, `CustomBar.campaignRef` |
| Waiting-for / delegation | **Adapt** | Mindwtr list; communal campaigns need it | `PlayerQuest`, `BarShare`, campaign roles |
| Bounded daily WIP (5 tasks) | **Absorb** | Already intentional; document in PLAYER_SUCCESS + handbook | `TapTheVeinTask`, `MAX_TASKS_PER_DAY` |
| Compost / archive ≠ delete | **Absorb** | LWX core feeling; aligns with GTD reference | `TapTheVeinTask.compostReason`, BSM |
| MCP task automation | **Adapt** | Optional agent path; never required | dual-track, `docs/AGENT_WORKFLOWS.md` |
| Inbox-zero UX / badges | **Reject** | Shame-spiral risk | POF GAP_ANALYSIS, Shaman ruling |
| Eisenhower matrix primary nav | **Reject** | Kills LWX feel; procrastination theater | `living-world-experience/spec.md` |
| Punitive streaks | **Reject** | Black Hat; optional celebratory streak OK (LWX white-hat) | DeckJournal vs 750words streak |
| Unlimited task lists | **Reject** | Violates bounded focus | TTV cap, Hand slots |
| AI-required clarify | **Reject** | Dual-track violation | AMI, inquiry-lite patterns |
| Productivity accounting | **Reject** | Solidarity vs payroll | mobility-quest STRAND_CONSULT |
| Habitica PBL loop | **Reject** | Overjustification, loss avoidance | FOUNDATIONS anti-PBL |
| Raw Todoist/Mindwtr UI import | **Reject** | Trust damage with Portland community | Diplomat ruling |

---

## 4. Emergent failure modes (≥8)

| Failure mode | Trigger | External handling | bars-engine risk | Mitigation direction |
|--------------|---------|-------------------|------------------|----------------------|
| Inbox overwhelm | Capture > clarify | 2-min rule, guided processing | Post-321 paralysis | Single routing CTA after 321; golden-path |
| Shame spiral | Streak/badge loss | Opt-out gamification | 750words streak in POF | Celebratory-only streaks; no red badges |
| Stale projects | No next action | Cascade engine | Orphan quests | Wire NextActionBridge on quest create/complete |
| Review abandonment | Review too long | Phased wizard | Lens workshop friction | Split review: carry/compost only in TTV close |
| Context switching | Many lists | Unified Do Now | Dashboard portal overload | Star of Bethlehem single card |
| Gamification toxicity | XP for everything | White Hat drives | Vibeulon on intrinsic work | architect-books overjustification guard |
| Shadow as task | Inner work → todo | Separate apps (Inquiry) | 321 → quest skip | POF practice lanes stay separate |
| Planner performance | Planning ≠ doing | Next-action-first | Lenses as planner | SIX_GAME_MASTER_REVIEW Lenses |
| Dependency hell | Over-blocking | Simple sequential | Quest nesting | Keep Kotter sequential default |
| AI crutch | AI required processing | BYOK optional | Agent-only flows | Deterministic 321/INQ paths |

---

## 5. Top 5 alignment bets (deftness order)

1. **Next-action cascade + Star of Bethlehem card** — extend `NextActionBridge`; one dashboard "your next move" (golden-path, CGLA wiring)
2. **Lens workshop = weekly review** — formalize cadence + stale-quest surfacing (Lenses spec; no new models)
3. **PARA semantics doc** — `LensGoal` = area/horizon; active quest = project (QLA lineage)
4. **Waiting-for primitive** — `PlayerQuest` status + delegate metadata (campaign collective)
5. **Document WIP limits** — handbook + PLAYER_SUCCESS cite 5 TTV / Hand as feature (Absorb)

---

## 6. UX surface map

| Pattern | Surface | Notes |
|---------|---------|-------|
| Do Now / next move | NOW / Hand glance | Single card, not list |
| Daily capture | Tap the Vein | ≤5 commit; Daily Reflection close |
| Weekly review | Observatory / Lens workshop | Ritual language, not grid |
| Next action on quest | Quest detail + Vault | NextActionBridge visible |
| Waiting for | Campaign / World | Delegated quests to others |
| Someday / compost | Garden | Visible honored compost |
| Horizons | Observatory levels | year→week descent |

---

## 7. Anti-patterns (explicit reject)

See RESEARCH_PROMPT Challenger veto list. Cite: [living-world-experience](../living-world-experience/spec.md), [PLAYER_SUCCESS.md](../../../docs/PLAYER_SUCCESS.md), [mobility-quest STRAND_CONSULT](../mobility-quest-superpower-campaign/STRAND_CONSULT_SIX_FACES.md).

---

## 8. Appendix — OpenGSD structural comparison (dev only)

| OpenGSD | bars-engine today | Player analog (informative only) |
|---------|-------------------|----------------------------------|
| Milestone | Spec kit feature folder | Lens year/quarter period |
| Slice | plan.md phase | Lens month/week |
| Task | tasks.md checkbox | TTV committed task |
| GSD Browser verify | cert quest / UI verify | Verification quest |
| Git worktree | BARS Strand | — |

**No feature import.** Dev workflow alignment already owned by [opengsd-workflow-migration](../opengsd-workflow-migration/spec.md).

---

## 9. Cross-spec delta pointers

| Existing spec | Delta informed by this research |
|---------------|--------------------------------|
| [personal-ops-funnel](../personal-ops-funnel/spec.md) | SPC streak = opt-in celebratory; BRS must set next action |
| [lens-integration-refactor](../lens-integration-refactor/spec.md) | Workshop = weekly review; PARA semantics on LensGoal |
| [golden-path-onboarding-action-loop](../golden-path-onboarding-action-loop/) | Star of Bethlehem card; NextActionBridge UX |
| [core-game-loop-audit](../core-game-loop-audit/spec.md) | Cascade on quest complete closes H-orphan gap |
| [quest-lineage-alignment](../quest-lineage-alignment/spec.md) | Area/project distinction reinforces shadow + lineage |
| [tap-the-vein-tier-2](../tap-the-vein-tier-2/spec.md) | Daily Reflection = review beat |

---

## Verification checklist

- [x] ≥3 OSS repos schema-level (Tandem, Mindwtr, GSD-TM + Vikunja/Habitica contrast)
- [x] Adopt/Adapt rows cite bars-engine hooks
- [x] Reject rows cite guardrails
- [x] Failure modes ≥8 with risk column
- [x] OpenGSD appendix <15%
- [x] Cross-checked gap docs listed in RESEARCH_PROMPT §7
