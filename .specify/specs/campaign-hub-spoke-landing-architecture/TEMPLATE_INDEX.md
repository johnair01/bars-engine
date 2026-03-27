# CHS template / inventory index (living)

**Purpose:** Map **surfaces** → **passage patterns** → **emissions** → **vault impact**. Expand as new templates ship.

| Surface | Template / artifact | Entry | Emissions (v1) | Vault / gates |
|---------|----------------------|-------|------------------|---------------|
| Campaign portal CYOA | Seeded portal adventure (`seed-campaign-portal-adventure`, `campaign-portal-{ref}`) | `Portal_1`…`Portal_8` → move choice → `WakeUp_Emit` / `CleanUp_Emit` / `ShowUp_Emit` | BAR via [`emitBarFromPassage`](../../../src/actions/emit-bar-from-passage.ts) + face×move copy | Vault caps per BAR rules; **modal compost** per [vault-compost-minigame-modal](../vault-compost-minigame-modal/spec.md) when enforced on emit path |
| CYOA_SPOKE (intake) | AI-generated `CYOA_SPOKE` adventure | `findOrGenerateSpokeAdventure` — cache key `gmFace::moveType::s{spokeIndex}` + legacy | Terminal passages may emit BAR / quest hooks — **extend this row** when intake passages wire emit | Same vault policy as global BAR creation |
| Hub → landing | No Twine | `/campaign/landing?ref=&spoke=` | None (card copy + BB quest map) | N/A |
| Event invite BAR | JSON CYOA MVP | `/invite/[barId]` | event_invite flow | See [EVENT_INVITE_BAR_CYOA_MVP.md](./EVENT_INVITE_BAR_CYOA_MVP.md) |

**Epiphany-bridge minimum** (spoke): parameterized prompt context includes `spokeIndex`, `hexagramId`, `kotterStage` ([`spoke-generator.ts`](../../../src/lib/cyoa-intake/spoke-generator.ts)).

**Gaps (tasks):** enumerate each portal passage `actionType` / blueprint keys; align with quest grammar completion effects when portal quests graduate from stubs.
