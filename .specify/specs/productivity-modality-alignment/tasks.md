# Tasks: Productivity Modality Alignment

## Phase A — Research kit (this branch)

- [x] A1 Create `.specify/specs/productivity-modality-alignment/` folder
- [x] A2 Write [RESEARCH_PROMPT.md](./RESEARCH_PROMPT.md) (7 sections + veto list)
- [x] A3 Execute research → [RESEARCH.md](./RESEARCH.md)
- [x] A4 Record [SIX_GAME_MASTER_REVIEW.md](./SIX_GAME_MASTER_REVIEW.md)
- [x] A5 Write [SCHEMA_GAPS.md](./SCHEMA_GAPS.md) (proposals only)
- [x] A6 Write spec.md, plan.md, tasks.md
- [x] A7 Add `PMA` row to BACKLOG.md + `npm run backlog:seed`

---

## Phase B — Cross-spec deltas (link outward; implement in target specs)

### B1 Next action + Star of Bethlehem → golden-path / CGLA

- [x] B1.1 [golden-path-next-action-bridge](../golden-path-next-action-bridge/tasks.md) — expose NextActionBridge on quest detail (pre-existing)
- [x] B1.2 NOW "next move" card — `getPlayerNextMove` + `StarOfBethlehemCard` on NowHome
- [x] B1.3 Cascade hint on quest complete — `getCascadeQuestAfterComplete` in quest-engine golden-path response
- [ ] B1.4 Verify: quest complete promotes next action when sibling quests blocked

### B2 Weekly review → Lenses

- [ ] B2.1 [lenses-observatory-intake](../lenses-observatory-intake/tasks.md) — workshop close = review beats (carry, orphan, park)
- [ ] B2.2 [lens-integration-refactor](../lens-integration-refactor/tasks.md) — review cadence doc in Observatory
- [ ] B2.3 Copy audit: no "productivity planner" language (SIX_GAME_MASTER_REVIEW)

### B3 PARA semantics → QLA

- [ ] B3.1 [quest-lineage-alignment](../quest-lineage-alignment/spec.md) — add Area vs Project semantics section
- [ ] B3.2 Steward handbook: LensGoal domain = area; quest = project

### B4 POF alignment

- [ ] B4.1 [personal-ops-funnel](../personal-ops-funnel/spec.md) — SPC streak policy (opt-in celebratory)
- [ ] B4.2 [personal-ops-funnel](../personal-ops-funnel/spec.md) — BRS requires next-action field

### B5 Document WIP

- [x] B5.1 Update [docs/PLAYER_SUCCESS.md](../../../docs/PLAYER_SUCCESS.md) — bounded daily focus as success pattern
- [ ] B5.2 Handbook cross-link to PMA Diplomat summary

---

## Phase C — Schema (gated on B + Regent sign-off)

- [ ] C1 Pilot `waitingFor` in PlayerQuest metadataJson
- [ ] C2 Campaign "waiting on" surface in World/campaign view
- [ ] C3 If needed: migration per [SCHEMA_GAPS.md](./SCHEMA_GAPS.md) C1–C2
- [ ] C4 `npm run db:sync` + `npm run check` after any schema change

---

## Optional follow-up

- [ ] O1 Add `scripts/strand-consult-productivity-modality.ts` (mirror events-bar strand consult)
- [ ] O2 Re-run RESEARCH_PROMPT when Tandem/Mindwtr ship major schema changes
