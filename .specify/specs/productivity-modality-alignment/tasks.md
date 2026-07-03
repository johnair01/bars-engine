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
- [x] B1.4 Verify: cascade returns same-campaign assigned quest without bridge (`getCascadeQuestAfterComplete` + golden-path `nextQuestId`)

### B2 Weekly review → Lenses

- [x] B2.1 [lenses-observatory-intake](../lenses-observatory-intake/spec.md) — weekly reflection beats (Clear / Current / Creative)
- [x] B2.2 [lens-integration-refactor](../lens-integration-refactor/spec.md) — review cadence table (daily / weekly / year)
- [x] B2.3 Copy audit: [COPY_AUDIT_PMA.md](../lenses-observatory-intake/COPY_AUDIT_PMA.md)
- [x] B2.4 UI: Observatory week close implements three beats — `WeeklyReflectionRitual` at `/observatory/weekly` (+ `/observatory/week` alias)

### B3 PARA semantics → QLA

- [x] B3.1 [quest-lineage-alignment](../quest-lineage-alignment/spec.md) — Area vs Project semantics section
- [x] B3.2 Steward handbook: [HANDBOOK_DRAFT.md](../player-handbook-orientation-system/HANDBOOK_DRAFT.md) § Areas, projects, and bounded focus

### B4 POF alignment

- [x] B4.1 [personal-ops-funnel](../personal-ops-funnel/spec.md) — SPC streak policy (opt-in celebratory)
- [x] B4.2 [personal-ops-funnel](../personal-ops-funnel/spec.md) — BRS requires next-action field + API sketch

### B5 Document WIP

- [x] B5.1 Update [docs/PLAYER_SUCCESS.md](../../../docs/PLAYER_SUCCESS.md) — bounded daily focus as success pattern
- [x] B5.2 Handbook cross-link to PMA Diplomat summary in HANDBOOK_DRAFT

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
