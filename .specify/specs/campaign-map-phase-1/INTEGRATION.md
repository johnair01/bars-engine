# Campaign Map Phase 1 — Integration with the Larger System

**Spec**: [spec.md](./spec.md) · **Tasks**: [tasks.md](./tasks.md)

## Why this work sits “above” recent vertical slices

Golden Path, charge→quest bridges, and daemon/321 work improved **pipelines**. Campaign Map Phase 1 is the **situational awareness** surface where players (and operators) see how those pipelines **compose** into a residency:

- **Narrative frame** (Opening Momentum / Kotter stage 1)
- **Strategic WHERE** (four allyship domains)
- **Living field** (BARs, completions, participation)
- **Tactical layer** (existing four-slot gameboard — unchanged contract, additive UI)

## Layers vs. other routes

| Surface | Role |
|---------|------|
| `/game-map` | Macro navigation / lobbies (future tighter bridge: [game-map-gameboard-bridge](../game-map-gameboard-bridge/spec.md)) |
| **`/campaign/board`** | **Meso** campaign map + gameboard (this spec) |
| Deck / slots | Micro — which quest is in which slot |

The board page already links **← Game Map**; DL makes `/campaign/board` the **canonical “where is the campaign?”** view for Bruised Banana–scale instances.

## Canonical keys

- **`campaignRef`** (e.g. `bruised-banana`) is the **primary** argument for `getCampaignPhaseHeader`, `getDomainRegionCounts`, and `getFieldActivityIndicators` in implementation.  
- **`instanceId`** appears in the spec’s API sketch for future tie-in to `Instance.kotterStage` / funding; Phase 1 fixes “Opening Momentum” copy. When instance-scoped config exists, resolve `campaignRef` → instance in one place (e.g. board page or lib helper) rather than duplicating.

## Domain regions (Layer 2)

Regions map 1:1 to allyship domains:

- `GATHERING_RESOURCES` → Gather Resources  
- `SKILLFUL_ORGANIZING` → Skillful Organizing  
- `RAISE_AWARENESS` → Raise Awareness  
- `DIRECT_ACTION` → Direct Action  

**Source of truth for counts**: quests reachable from the **gameboard deck / slots** for the given `campaignRef` and `period`, using each quest’s `allyshipDomain` (or equivalent on linked `Quest` / `CustomBar`). If a quest has no domain, exclude it from regional totals or bucket as “unspecified” only if product asks for it — Phase 1 spec focuses on the four regions.

**Active players per domain** (spec allows simplification): define as *distinct players with a non-terminal `PlayerQuest` row for a quest in that domain for this campaign context within a recent window* (e.g. last 30 days), or campaign-wide distinct actives if queries are costly. Document the chosen heuristic in code comments.

## Field activity (Layer 3)

Observational only — **no gating**:

- BARs: count recent `CustomBar` (or campaign-scoped BARs if filtered by ref/instance).
- Completions: recent terminal `PlayerQuest` (or completed status) for campaign quests.
- Active players: distinct players with recent activity in the campaign.

Optional `fundingProgress` stays behind instance/config when available.

**Emergent hint (FR10):** `computeEmergentFieldHint` in `campaign-map-shared.ts` turns BAR / completion / active-player ratios into a single informational line under field activity (no gameplay gating).

## Post-onboarding redirect

When `postOnboardingRedirect === 'campaign-map'`, send players to **`/campaign/board`** (with default or instance `ref`) so the **first collective surface** after onboarding is the map, not only the dashboard. Must not conflict with golden-path-specific deep links; **append or prefer explicit return URLs** when present.

**Config**: `AppConfig.features` JSON (singleton row). Merge into existing JSON, e.g.:

```json
{
  "postOnboardingRedirect": "campaign-map"
}
```

Implemented in `getPostOnboardingRedirect()` + `getDashboardRedirectForPlayer()` (`src/actions/config.ts`). Valid values: `dashboard` (default), `campaign-map`.

## Dependencies (backlog)

- **CY** — gameboard / quest generation: provides slots + period.  
- **DG** — dashboard orientation: redirect hooks.  
- **gameboard-campaign-deck** — board exists; DL extends it.

## Verification

- **cert-campaign-map-phase-1-v1** exercises layers 1–3 and domain click-through.

---

*Last updated: implementation start — keep this file aligned with `campaign-map.ts` and board UX as heuristics stabilize.*
