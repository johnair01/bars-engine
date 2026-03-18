# Individuation Engine — Spec

**Slug**: `individuation-engine`
**Ambiguity**: 0.16
**Status**: Ready for Phase 1 implementation
**Synthesized**: 2026-03-17 via strand (Shaman → Diplomat → Sage) + Socratic interview pass

---

## Telos

An emotional charge enters the system, is shaped by archetype grammar, accumulated by a Daemon reagent, routed through a weighted encounter table, and situated inside a Nation-Face era container. Inner change and outer change are not parallel activities — they are the same action recorded in two different ledgers.

The five source specs (Archetype Action Grammar, BAR→Quest UI Scene, Daemon Codex, Emotional Alchemy Encounter Table, Nation-Face Era Teleology) resolve into a single claim: **individuation is the game**. A player who completes a 321 Shadow Process does not earn a badge; they earn a Daemon codex entry, a BlessedObject, and a shifted encounter table weight — three consequences that feed forward into the next loop.

---

## Source Documents

1. `archetype_action_grammar_v0.md` — 8 archetypes as runtime action grammars
2. `bar_quest_ui_scene_spec.md` — BAR→Quest transition ceremony
3. `daemon_codex_spec.md` — Daemon as field journal + reagent
4. `emotional_alchemy_encounter_table_spec.md` — weighted encounter table driven by emotional state
5. `nation_face_era_teleology_v0.md` — GM Faces as developmental eras within Nations
6. `Language of Emotions (Karla McLaren)` — emotions as messengers with gifts/questions/obstruction signs

---

## Ontological Model

### Existing Infrastructure (all confirmed present in codebase)

| Entity | Location | Status |
|--------|----------|--------|
| `ArchetypeInfluenceProfile` + `applyArchetypeOverlay()` | `/src/lib/archetype-influence-overlay/` | Present, **not yet wired** |
| `Daemon` model | `prisma/schema.prisma` | Present, missing codex fields |
| `AlchemySceneTemplate` | `prisma/schema.prisma` | Present, missing bias fields |
| `resolveMoveDestination()` | `/src/lib/alchemy/wuxing.ts` | Present + wired |
| `selectScene()` | `/src/lib/alchemy/select-scene.ts` | Present, not daemon-aware |
| `BlessedObjectEarned` | `prisma/schema.prisma` | Present, `metadata Json?` used for extensions |

### New Infrastructure Required

| Entity | Type | Phase |
|--------|------|-------|
| `QuestSeedContext` interface | TypeScript only | Phase 1 |
| `buildQuestSeedInput()` | New file: `/src/lib/quest-seed-composer.ts` | Phase 1 |
| `Daemon.voice/desire/fear/shadow/evolutionLog` | Schema migration | Phase 2 |
| `CustomBar.archetypeKey` | Schema migration | Phase 2 |
| `AlchemySceneTemplate.kotterStageBias/campaignFrontBias` | Schema migration | Phase 2 |
| `NationFaceEra` model | Schema migration | Phase 3 |

### Key Invariants

1. A `ChargeBar.archetypeKey` is stamped at creation time, never mutated. If null, overlay is silently skipped — no default applied.
2. `Daemon.evolutionLog` is append-only. No entries deleted.
3. `selectScene()` is the single gate for encounter table selection. All modifiers flow through it.
4. One active `NationFaceEra` per Instance at any time. Previous era closed before new one opens. (Phase 3)
5. Every Shaman/GM influence on a Daemon flows through a BAR, not direct codex mutation. Player-only codex writes.

---

## The Loop

**1. Charge Capture**
Player names channel (anger / joy / sadness / fear / neutrality) and altitude (dissatisfied / neutral / satisfied). System reads `Player.archetypeId`, stamps `archetypeKey` on the `CustomBar`. `resolveMoveDestination()` determines `sceneType` (transcend / generate / control), stored in `inputs` JSON.

**2. Archetype Grammar Shaping**
Before generating quest suggestions, `buildQuestSeedInput()` assembles a `QuestSeedContext` — archetype profile, active Daemon channel/altitude, active Kotter stage (Phase 1 proxy for era), scene type. `applyArchetypeOverlay()` shapes quest suggestions before returning to player. Null archetype = silent skip.

**3. Transition Ceremony**
After BAR creation, before quest suggestions appear: a ceremony screen shows the resolved `sceneType` as large text with the current Kotter stage below. No buttons. Duration: 2500ms (design token `--transition-ceremony-ms`). Player can tap to interrupt. This is the silence.

**4. Daemon Memory**
Quest completion appends an `evolutionLog` entry to the active Daemon: `{ date, event, channelBefore, channelAfter, altitudeBefore, altitudeAfter }`. BlessedObject unlocks pass `daemonId` in `metadata.daemonId`. Daemon's `channel` and `altitude` update to reflect emotional destination.

**5. Encounter Table Selection**
`selectScene()` receives daemon's channel/altitude as low-weight (3) signals alongside archetype bias (10). Phase 2: also scores `kotterStageBias` and `campaignFrontBias` on each `AlchemySceneTemplate`. Phase 3: adds collective Daemon channel via union aggregation.

**6. Nation-Face Era Container**
Phase 3: `NationFaceEra` record provides the developmental container. Phase 1 proxy: `kotterStage` from active `GameboardInstance`. Face era transitions are GM-declared via Regent "Declare period" BAR. Automatic triggers are deferred.

---

## Resolved Design Decisions

### Daemon Codex Write Authority
**Player-only** at the action layer. Shaman/GM influence flows through BARs only:
1. Shaman executes face move → creates a BAR (`gameMasterFace: shaman`, `type: insight`)
2. BAR surfaces to player in hand
3. Player promotes BAR content to `DaemonMoveCreation`
Shaman has no direct codex mutation path. Two-ledger integrity preserved.

### NationFaceEra Transitions
**GM-only** for Phase 1 and Phase 3 initial release. Automatic triggers (aggregate player behavior) deferred to a follow-on spec. GM declares transition via Regent "Declare period" BAR; `openFaceEra()` closes the previous era and opens the new one.

### archetypeKey Null Behavior
**Silent skip.** Matches existing codebase contract at `/src/lib/archetype-influence-overlay/index.ts` lines 44–45. Prompting the player belongs at the UI call site, not inside the overlay function.

### Collective Daemon Aggregation
**Union semantics** — consistent with how `getActiveDaemonMoves()` already merges `moveIds` across summons using `Set<string>`. No weighted averaging until `communityScope` has real production data.

### BlessedObjectEarned daemonId
**metadata.daemonId only for Phase 1.** No FK column. Phase 2 migration adds FK when computational queries over daemon provenance are needed.

### Transition Ceremony
**Not a hard timeout.** CSS transition with `onTransitionEnd` callback. Player can interrupt via tap. Duration is a design token (`--transition-ceremony-ms: 2500`). If per-instance tuning is needed, store in `AppConfig`.

---

## Community Context

Portland community has a strong allergy to AI. The non-AI path must remain first-class:
- `applyArchetypeOverlay()` works without AI — it modifies prompt strings and style tokens, not LLM calls
- `selectScene()` scoring is deterministic math, no AI
- Daemon codex fields are player-authored text, no AI
- Quest generation degrades to template-based output when AI is unavailable
- The transition ceremony works with no AI whatsoever

---

## Open Questions (post-interview — residual)

None are blocking for Phase 1 implementation. Two residual scoping questions:

1. **Transition ceremony UI ownership**: Which component owns the ceremony screen? Recommend: new `<TransitionCeremony />` in `/src/components/charge-capture/` called from `ChargeCaptureForm.tsx` after BAR creation and before phase change. But confirm with GM since it sits at a domain boundary.

2. **Per-instance `TRANSITION_CEREMONY_MS` config**: Should this be in `AppConfig` (existing table) or hardcoded as a constant? For Phase 1, hardcode as a module-level constant with a comment marking it as a future config candidate.
