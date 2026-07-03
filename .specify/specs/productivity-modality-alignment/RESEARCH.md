# Productivity Modality Research — Findings

**Date:** 2026-07-02 (v2 enriched)  
**Method:** Executed per [RESEARCH_PROMPT.md](./RESEARCH_PROMPT.md) against OSS repos (README + docs + schema), bars-engine gap docs, and Six GM ruling.  
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

## 2. Per-system data model extraction

### GTD (methodology)

| Primitive | Definition | Lifecycle states | Relationships | Review cadence | Gamification hooks |
|-----------|------------|------------------|---------------|----------------|--------------------|
| Inbox | Unprocessed capture | raw → clarified | → project / NA / someday / trash | Weekly clear | None |
| Next action | Smallest physical step | active → done | belongs to project | Weekly | None |
| Project | Multi-step outcome | active → done | has NAs; optional sequential | Weekly stale check | None |
| Context | Where/how (@errands) | tag | filters NAs | — | None |
| Waiting for | Delegated | open → received | person + date | Weekly | None |
| Someday/Maybe | Not now | deferred | optional promote | Weekly | None |
| Horizons | 10k–50k ft goals | ongoing | align projects | Quarterly+ | None |

### Tandem GTD (Prisma/Postgres, AGPL-3.0)

| Primitive | Definition | Lifecycle states | Relationships | Review cadence | Gamification hooks |
|-----------|------------|------------------|---------------|----------------|--------------------|
| Task | Action item | inbox → next → done | project, context, deps, assignee | Weekly wizard | Health pulse widgets |
| Project | Outcome container | active → waiting → someday → archived | tasks, sub-projects, area | Stale surfacing | Burn-down |
| Area | Ongoing responsibility | active | projects | Weekly | — |
| Horizon | Altitude goal | runway→50k | aligns areas/projects | Weekly | — |
| Cascade | Auto-promote on complete | blocked → available | dependency graph | — | Activity feed |

**Key differentiator:** Cascade engine — complete task → unblock/promote successor across projects.

### Mindwtr (`@mindwtr/core`, SQLite/local, AGPL-3.0)

| Primitive | Definition | Lifecycle states | Relationships | Review cadence | Gamification hooks |
|-----------|------------|------------------|---------------|----------------|--------------------|
| Task | GTD item | inbox → next → waiting → someday → done | project, context, area | Daily + weekly wizards | Daily digest |
| Project | Multi-step | active → waiting → someday → archived | sections, ordered tasks | Weekly | — |
| Area | Ongoing domain | active | projects | — | — |
| Context | @work/meetings (slash) | tag | filters tasks | — | — |

**Stack modules:** `store.ts`, `types.ts`, `recurrence.ts`, `sync-*.ts`, MCP → core. Local-first; BYOK AI optional.

### GSD Task Manager (IndexedDB, MIT)

| Primitive | Definition | Lifecycle states | Relationships | Review cadence | Gamification hooks |
|-----------|------------|------------------|---------------|----------------|--------------------|
| Task | Quadrant item | Q1–Q4 | **dependencies** (DAG) | — | None |

**Not GTD-complete** — urgency/importance ≠ clarified outcome.

### bars-engine (Prisma)

| Primitive | Schema / action | Lifecycle | Gap vs GTD |
|-----------|-----------------|-----------|------------|
| Capture | `TapTheVeinDailySession`, BAR draft | session → commit | Strong |
| Next action | `NextActionBridge`, TTV committed | committed → complete/carry/compost | No cascade |
| Project | `CustomBar` type quest | assigned → complete | Orphan risk |
| Horizon | `Lens`, `LensGoal` | draft → active → parked | PARA area unclear |
| Waiting for | — | — | **GAP** |
| Review | Lens workshop, TTV close | weekly-ish | Under-ritualized |

**Code anchors:** `prisma/schema.prisma`, `src/actions/next-action-bridge.ts`, `src/actions/tap-the-vein.ts`.

---

## 3. Scalability & robustness scores (1–5)

| Primitive / system | Bounded focus | Deterministic routing | Multiplayer | Local-first | Export/compost | MCP |
|---------------------|---------------|----------------------|-------------|-------------|----------------|-----|
| Tandem cascade | 4 | 5 | 5 | 3 | 5 | 5 |
| Mindwtr GTD | 4 | 5 | 2 | 5 | 5 | 5 |
| GSD-TM Eisenhower | 3 | 5 | 2 | 5 | 4 | 4 |
| bars-engine TTV | **5** | 5 | 4 | 2 | 5 | 4 |
| bars-engine NextActionBridge | 4 | 5 | 3 | 2 | — | — |
| bars-engine Lenses | 4 | 5 | 2 | 2 | 4 | — |

**Takeaway:** bars-engine leads on **bounded focus**; lags on **cascade**, **waiting-for**, and **local-first** (POF Obsidian sync is the personal-lane answer).

---

## 4. OSS deep-read summaries

### Tandem GTD (`courtemancheatelier/tandem-gtd`)

- **Stack:** Next.js, PostgreSQL, Prisma, AGPL-3.0
- **Standout:** Cascade engine; context+energy+time "Do Now"; guided weekly review; horizons + areas
- **Pain points:** Self-host complexity; GTD onboarding steepness; AI coach as optional crutch
- **bars-engine hook:** Cascade → `NextActionBridge` + `quest-placement.ts`; review → Lens workshop

### Mindwtr (`dongdongbh/Mindwtr`)

- **Stack:** Tauri/RN monorepo, `@mindwtr/core`, 1k+ stars, AGPL-3.0
- **Standout:** Full GTD views; progressive disclosure; Obsidian deep links; BYOK AI never required
- **Pain points:** Feature breadth vs "bike not cockpit"; sync backend choice overload
- **bars-engine hook:** Waiting-for + someday → `PlayerQuest` / parked goals; POF Obsidian Phase 2

### GSD Task Manager (`vscarpenter/gsd-task-manager`)

- **Stack:** IndexedDB local-first, optional PocketBase, MIT
- **Standout:** Eisenhower quadrants; task dependencies with circular prevention; MCP
- **Pain points:** Not GTD-complete; quadrant drag as procrastination theater
- **bars-engine hook:** **Reject** primary nav; **Adapt** dependency concept for quest-thread ordering only

### Habitica (contrast)

- **Standout:** HP/XP/gold, streaks, party quests — PBL + loss avoidance (Black Hat)
- **bars-engine lesson:** Validates anti-PBL stance ([PLAYER_SUCCESS.md](../../../docs/PLAYER_SUCCESS.md))

### Vikunja (expander)

- Kanban + GTD lists; maps to `GameboardSlot` / campaign deck — Jira metaphor covers it

### Plannen (`pariksheet/plannen`) — expand search

- Local-first AI planner, AGPL-3.0, MCP for events/memories
- **Adapt** review-as-reflection pattern; **Appendix** for POF calendar lane

### kleidi-task (`tomas-chudjak/kleidi-task`) — expand search

- Per-project SQLite, MCP-first, Go single binary
- **Dev appendix only** (like OpenGSD) — strand/worktree task isolation

---

## 5. Adopt / Adapt / Absorb / Reject

| Pattern | Verdict | Rationale | bars-engine hook / guardrail |
|---------|---------|-----------|------------------------------|
| Next-action cascade on complete | **Adapt** | Tandem killer feature; bars has bridge but no auto-promote | `src/actions/next-action-bridge.ts`, golden-path |
| Guided weekly review wizard | **Adapt** | Lens workshop as ritual, not planner grid | `lenses-observatory-intake`, LWX Observatory |
| Context + energy + time "Do Now" | **Adapt** | Map to move+domain+TTV cap — **one card** | `architect-books` Star of Bethlehem |
| PARA Projects vs Areas | **Adapt** | Clarify `LensGoal` vs quest semantics | `LensGoal.domain`, QLA |
| Waiting-for / delegation | **Adapt** | Communal campaigns need it | `PlayerQuest`, Phase C metadata |
| Bounded daily WIP (5 tasks) | **Absorb** | Already intentional | `TapTheVeinTask`, `MAX_TASKS_PER_DAY` |
| Compost / archive ≠ delete | **Absorb** | LWX core feeling | BSM, `compostReason` |
| MCP optional automation | **Adapt** | BYOK pattern from Mindwtr | dual-track, `AGENT_WORKFLOWS.md` |
| Progressive disclosure | **Adapt** | Mindwtr "bike not cockpit" | TTV tier-2 phases |
| Inbox-zero UX / badges | **Reject** | Shame-spiral risk | POF GAP_ANALYSIS |
| Eisenhower matrix primary nav | **Reject** | Kills LWX feel | `living-world-experience/spec.md` |
| Punitive streaks | **Reject** | Black Hat | PLAYER_SUCCESS |
| Unlimited task lists | **Reject** | Violates bounded focus | TTV cap, Hand slots |
| AI-required clarify | **Reject** | Dual-track violation | inquiry-lite |
| Productivity accounting | **Reject** | Solidarity vs payroll | mobility-quest STRAND_CONSULT |
| Habitica PBL loop | **Reject** | Overjustification | FOUNDATIONS |
| Raw Todoist/Mindwtr UI import | **Reject** | Trust damage | Diplomat ruling |

---

## 6. Emergent failure modes (≥10)

| Failure mode | Trigger | External handling | bars-engine risk | Mitigation direction |
|--------------|---------|-------------------|------------------|----------------------|
| Inbox overwhelm | Capture > clarify | 2-min rule, guided processing | Post-321 paralysis | Single CTA after 321; golden-path |
| Shame spiral | Streak/badge loss | Opt-out gamification | 750words streak in POF | Celebratory opt-in only |
| Stale projects | No next action | Cascade engine | Orphan quests | Wire NextActionBridge + cascade |
| Review abandonment | Review too heavy | Phased wizard | Lens workshop friction | TTV close = mini-review |
| Context switching | Many lists | Unified Do Now | Dashboard portal overload | Star of Bethlehem single card |
| Gamification toxicity | PBL rewards | White Hat drives | Vibeulon on intrinsic work | architect-books guard |
| Shadow as task | Inner → todo | Separate apps | 321 conflation | POF practice lanes |
| Planner performance | Planning ≠ doing | NA-first | Lenses as planner | SIX_GM Lenses review |
| Dependency hell | Over-blocking | Simple sequential | Quest nesting | Kotter sequential default |
| AI crutch | Required AI | BYOK optional | Agent-only paths | deterministic 321/INQ |
| Sync paralysis | Too many backends | Sane defaults | POF Obsidian Phase 2 | One sync path documented |

---

## 7. Top 5 alignment bets (deftness order)

1. **Next-action cascade + Star of Bethlehem card** — extend `NextActionBridge`; one NOW "your next move" (golden-path, CGLA)
2. **Lens workshop = weekly review** — formalize cadence + stale-quest surfacing (Lenses; no new models)
3. **PARA semantics doc** — `LensGoal` = area/horizon; active quest = project (QLA)
4. **Waiting-for primitive** — `PlayerQuest` metadata pilot (campaign)
5. **Document WIP limits** — PLAYER_SUCCESS + handbook (Absorb)

---

## 8. UX surface map

| Pattern | Surface | Notes |
|---------|---------|-------|
| Do Now / next move | NOW / Hand glance | Single card, not list |
| Daily capture | Tap the Vein | ≤5 commit; Daily Reflection close |
| Weekly review | Observatory / Lens workshop | Ritual language, not grid |
| Next action on quest | Quest detail + Vault | NextActionBridge visible |
| Waiting for | Campaign / World | Phase C |
| Someday / compost | Garden | Honored compost UI |
| Horizons | Observatory levels | year→week descent |

---

## 9. Six Game Master synthesis (second pass)

| Face | Finding |
|------|---------|
| **Architect** | Isomorphism exists; cascade + waiting-for are the only structural gaps worth schema |
| **Regent** | Phase B before Phase C; deltas into POF/Lenses/golden-path, not mega-spec |
| **Challenger** | Eisenhower/inbox-zero are anxiety products, not throughput products |
| **Shaman** | Shame-spiral test is the adoption gate; 321 stays practice not task |
| **Diplomat** | Player copy: "weekly reflection" not "review checklist"; no competitor names |
| **Sage** | Wire → ritualize review → document semantics → schema if still stuck |

---

## 10. Anti-patterns (explicit reject)

See [RESEARCH_PROMPT.md](./RESEARCH_PROMPT.md) Challenger veto list. Cite: [living-world-experience](../living-world-experience/spec.md), [PLAYER_SUCCESS.md](../../../docs/PLAYER_SUCCESS.md), [mobility-quest STRAND_CONSULT](../mobility-quest-superpower-campaign/STRAND_CONSULT_SIX_FACES.md).

---

## 11. Appendix — OpenGSD structural comparison (dev only, ≤15%)

| OpenGSD | bars-engine dev | Player analog (informative) |
|---------|-----------------|------------------------------|
| Milestone | Spec kit feature folder | Lens year/quarter period |
| Slice | plan.md phase | Lens month/week |
| Task | tasks.md checkbox | TTV committed task |
| GSD Browser verify | cert quest / UI verify | Verification quest |
| Git worktree | BARS Strand | — |

**No feature import.** Dev workflow: [opengsd-workflow-migration](../opengsd-workflow-migration/spec.md).

---

## 12. Cross-spec delta pointers

| Existing spec | Delta informed by this research |
|---------------|--------------------------------|
| [personal-ops-funnel](../personal-ops-funnel/spec.md) | SPC streak = opt-in celebratory; BRS must set next action |
| [lens-integration-refactor](../lens-integration-refactor/spec.md) | Workshop = weekly review; PARA semantics on LensGoal |
| [golden-path-onboarding-action-loop](../golden-path-onboarding-action-loop/) | Star of Bethlehem card; NextActionBridge UX |
| [core-game-loop-audit](../core-game-loop-audit/spec.md) | Cascade on quest complete closes orphan gap |
| [quest-lineage-alignment](../quest-lineage-alignment/spec.md) | Area/project distinction reinforces shadow + lineage |
| [tap-the-vein-tier-2](../tap-the-vein-tier-2/spec.md) | Daily Reflection = review beat |

---

## Verification checklist

- [x] ≥3 OSS repos schema-level (Tandem, Mindwtr, GSD-TM + Vikunja/Habitica/Plannen)
- [x] Adopt/Adapt rows cite bars-engine hooks
- [x] Reject rows cite guardrails
- [x] Failure modes ≥8 with risk column
- [x] OpenGSD appendix <15%
- [x] Cross-checked: core-game-loop-audit, POF GAP_ANALYSIS, architect-books, Lenses SIX_GM
