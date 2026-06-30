# Spec: Lenses Lineage Stability Bridge

## Status

Bridge spec created after hostile review and six Game Master gap analysis of the first Lenses implementation slice.

Parent spec:

- `.specify/specs/lenses-observatory-intake/`

Related gap analysis:

- `.specify/specs/lenses-observatory-intake/SIX_GAME_MASTER_GAP_ANALYSIS.md`
- `.specify/specs/lenses-lineage-stability-bridge/SIX_GAME_MASTER_GAP_ANALYSIS.md`
- `.specify/specs/lenses-lineage-stability-bridge/SIX_GAME_MASTER_GAP_ANALYSIS_2.md`

## Purpose

Make Lenses lineage trustworthy before expanding visual polish or advanced product flows.

The current implementation can create a year frame, descend goals, attach Tap the Vein tasks to goals, and plant BARs with `lensGoalId`. The critical gap is that normal save/edit paths delete and recreate `LensGoal` rows. That breaks descendants, TTV task attachments, and BAR lineage.

This bridge makes authored goals durable living anchors instead of disposable form rows.

## Product Ruling

Lenses goals are identity-bearing practice artifacts.

They may be edited, parked, superseded, completed, or versioned. They must not be deleted as the normal save path once anything downstream points at them.

## Non-Negotiable Invariants

1. A `LensGoal.id` remains stable across ordinary title/description/satisfaction edits.
2. Saving a year frame must not orphan quarterly/monthly/weekly descendants.
3. Saving a descent pass must not orphan lower descendants.
4. A TTV task attached to a LensGoal must either keep a valid `lensGoalId` or preserve a lineage snapshot if the goal is archived later.
5. A BAR planted from TTV must not silently drop goal lineage.
6. The five-task TTV cap must be atomic enough that rapid submits cannot create task six.
7. Parked domains/goals must be recoverable through UI, not dead ends.
8. Title/domain/cadence matching is not a normal identity strategy. Stable keys are the identity strategy.
9. A lineage trace must label whether it is rendering from live goals or an immutable snapshot.

## Identity Rule

Every persisted workshop option that can become a `LensGoal` must have a stable key.

Required behavior:

1. The client may create a temporary `tempKey` for unsaved options inside the current editing session.
2. The server creates canonical `stableKey` values in one of two supported modes:
   - Autosaved draft mode: first persisted draft/option save assigns missing stable keys and returns them to the client.
   - Final-save normalization mode: final save assigns missing stable keys before any goal matching or creation occurs, then returns normalized keyed units to the client.
3. The server returns canonical `stableKey` values to the client after any save that receives unkeyed options.
4. The client carries canonical `stableKey` back on later edits.
5. Saved goals are matched by `stableKey`.
6. Title/domain/cadence fallback is allowed only for one-time migration/backfill of legacy rows, never for normal edit matching.
7. Two goals with the same title in the same domain must remain independently editable.

Stable key generation:

- Canonical `stableKey` values must be CUID/UUID-style globally unique strings.
- Because canonical keys are globally unique, `LensGoal.stableKey` may use a global unique constraint.
- If implementation cannot use globally unique keys, it must switch the DB invariant to compound uniqueness `(playerId, stableKey)` and update this spec before coding.
- Server-side save logic must tolerate legacy string options and client-only `tempKey` values, but no persisted `LensGoal` may be created without a canonical `stableKey`.

This means the implementation must extend workshop option payloads. A bare string list is no longer enough for persisted options.

Minimum option shape:

```ts
type LensWorkshopOption = {
  stableKey?: string
  tempKey?: string
  text: string
}
```

The server may accept legacy string arrays temporarily, but must normalize them into keyed options before saving.

## Removed-Goal State Machine

Referenced goals are never hard-deleted.

Use these states:

| State | Meaning | Trigger | Player Copy |
| --- | --- | --- | --- |
| `active` | Currently part of the living frame | Kept/saved | “Active” |
| `parked` | Set aside intentionally for focus | Player parks it | “Set aside for focus” |
| `superseded` | Replaced by a newer goal | Player replaces/removes it while adding a successor | “Replaced by a newer version” |
| `archived` | Kept for historical trace only | No longer active but still referenced | “Kept for history” |
| `complete` | Finished or fulfilled | Player marks complete | “Complete” |

Hard delete is allowed only for unreferenced drafts that have no descendants, no TTV tasks, and no BAR references.

Default implementation rule:

- explicit player park => `parked`
- remove while replacing with a new kept option => `superseded`
- remove without a successor but with references => `archived`
- unreferenced abandoned draft => delete

Allowed transitions:

| From | Allowed To | Notes |
| --- | --- | --- |
| `active` | `parked`, `superseded`, `complete`, `archived` | Normal living-goal transitions |
| `parked` | `active`, `archived` | Player can reactivate parked goals |
| `superseded` | `archived` | Superseded goals do not become active again; use their successor |
| `complete` | `active`, `archived` | Completion can be reopened by the player |
| `archived` | none by normal player flow | Admin/manual restore only |

Referenced-goal definition:

A goal is referenced, and therefore not hard-deletable, if any of these exist:

- child `LensGoal.parentGoalId`,
- `TapTheVeinTask.lensGoalId`,
- `CustomBar.lensGoalId`,
- `LensWorkshopDraft.parentGoalId`,
- `LensGoal.supersededById`,
- future explicit lineage table rows.

## Data Model Direction

Extend `LensGoal`:

```prisma
model LensGoal {
  stableKey       String   @unique
  supersededById  String?
  archivedAt      DateTime?
  lineageSnapshot Json?
}
```

The field names above are canonical for this bridge unless a migration constraint forces an alternative. If an alternative is used, document the mapping in this spec before implementation proceeds. The implementation must preserve:

- stable edit identity,
- supersession/archival history,
- lineage recovery for old TTV/BAR references.

Supersession validation:

- `supersededById` must point to a goal owned by the same player.
- By default, the successor must share the same domain and cadence as the superseded goal.
- A migration/admin backfill may override domain/cadence matching only when it writes a `lineageSnapshot` explaining the historical mapping.
- Player-facing replacement flows must not create cross-domain supersession links.

Relational policy:

- `LensGoal.lensId` should be a relation to `Lens` when practical.
- `TapTheVeinTask.dailySessionId` must remain a relation to `TapTheVeinDailySession`.
- `TapTheVeinTask.lensGoalId` may be nullable, but must either:
  - use a relation with `onDelete: SetNull` plus mandatory snapshot, or
  - remain a soft pointer only if snapshot creation is mandatory on attach.
- `CustomBar.lensGoalId` may remain a soft pointer because BARs are cross-system artifacts, but `plantSnapshot` is mandatory when a BAR is planted from a TTV task with lineage.

Extend `TapTheVeinTask`:

```prisma
model TapTheVeinTask {
  attachSnapshot Json?
}
```

Extend `CustomBar`:

```prisma
model CustomBar {
  plantSnapshot Json?
}
```

These names are canonical:

- `TapTheVeinTask.attachSnapshot`: the goal chain as it looked when the daily task was attached.
- `CustomBar.plantSnapshot`: the goal chain as it looked when the BAR was planted.
- Do not introduce a generic `lensGoalSnapshot` field unless the payload explicitly includes `source`, `capturedAt`, and lineage trace metadata, and this spec is updated first.

Snapshots should include enough to render a trace when the live goal is archived:

```json
{
  "goalId": "goal_id",
  "title": "Practice Qigong",
  "domain": "health",
  "cadence": "week",
  "parentChain": [
    { "id": "monthly_id", "title": "Sign up for Qigong", "cadence": "month" },
    { "id": "quarterly_id", "title": "Weekly Qigong practice", "cadence": "quarter" },
    { "id": "yearly_id", "title": "Practicing Tai Chi and Qi Gong daily", "cadence": "year" }
  ]
}
```

Snapshot precedence:

1. Resolve and render live goal lineage when the live chain is available.
2. Fall back to immutable snapshot only when the live chain cannot be resolved.
3. An `attachSnapshot` is created when a TTV task attaches to a goal.
4. A `plantSnapshot` is created when a TTV task is planted as a BAR.
5. BAR planting should build a fresh plant-time snapshot from live lineage when possible; if live lineage is unavailable, it may copy the task's attach snapshot as the BAR snapshot.
6. Snapshots are not mutated on ordinary goal edits.
7. Every lineage trace must show source: `live`, `attach_snapshot`, or `plant_snapshot`.

Lineage source vocabulary:

- `live`: current resolvable goal chain.
- `attach_snapshot`: the thread as it was when the TTV task was attached.
- `plant_snapshot`: the thread as it was when the BAR was planted.

Lineage trace display:

- The source badge vocabulary is exactly `live`, `attach_snapshot`, or `plant_snapshot`.
- A separate human label may say “Current thread”, “Attached then”, or “Planted then”, but the stored/source value must not collapse both snapshots into a generic `snapshot`.
- When live lineage resolves, show the live trace and optionally expose snapshot age in details; do not silently prefer stale snapshots over live goals.

## Backfill Rules

Legacy rows may exist from the first implementation slice or local prototypes.

Backfill must:

1. Assign globally unique `stableKey` values to every existing `LensGoal` before enforcing non-destructive matching.
2. Normalize legacy `LensWorkshopDraft.options` string arrays into keyed option objects when a draft is loaded or saved.
3. Preserve kept order by mapping old `keptOrder` indexes onto the newly keyed option list.
4. Attempt a one-time best-effort mapping from existing goal title/domain/cadence/order to draft options only during migration/backfill.
5. Never use title/domain/cadence matching during normal player saves after backfill.
6. Leave an unmapped historical goal active rather than deleting it.
7. Build `lineageSnapshot` only for historical repair cases where a successor/snapshot relationship cannot be represented by live pointers alone.

## Save Behavior

### Year Frame Save

The year-frame save action must:

1. Match incoming kept goals to existing yearly goals by `stableKey`.
2. Update matched goals in place.
3. Create new goals only for truly new kept items.
4. Park or supersede removed goals instead of deleting them when they have descendants, TTV tasks, or BARs.
5. Delete only draft/unreferenced goals that have no descendants or external references.
6. Never use title/domain/cadence matching except in an explicit migration/backfill path.

### Descent Save

The descent save action must follow the same behavior for children:

1. Match incoming kept child goals to existing children by `stableKey`.
2. Update matched children.
3. Create new children.
4. Park/supersede removed children if referenced.
5. Never delete a goal with active descendants.
6. Never use title/domain/cadence matching except in an explicit migration/backfill path.

## TTV Commit Behavior

Tap the Vein task creation must:

1. Enforce the five-task cap inside a transaction.
2. Assign a stable `priorityRank` without duplicate ranks.
3. Store `attachSnapshot` when a task attaches to a goal.
4. Prefer active weekly/monthly goals in the picker, while allowing higher-level goals when no lower-level goal exists.

Atomicity mechanism:

- Ranks are historical daily keep order. They are not reused after completion, composting, or carry.
- The active five-task cap is separate from rank history.
- Add a DB-level uniqueness invariant for daily ranks.
- Use unique index on `(dailySessionId, priorityRank)` where `priorityRank IS NOT NULL`.
- Allocate rank and create task in the same transaction.
- If a rank conflict occurs, return a humane retry message instead of exceeding the cap.

## BAR Plant Behavior

BAR planting from TTV must:

1. Require valid lineage or an existing snapshot.
2. Copy `lensId`, `lensGoalId`, and `plantSnapshot`.
3. Fail loudly if the task claims a `lensGoalId` but neither the goal nor a snapshot is available.
4. Show the lineage trace after planting.

Failure copy should be clear and non-shaming:

> This task was attached to an older goal thread I can’t resolve. Reattach it to a Lens goal before planting.

## Park/Reactivate Behavior

The UI must support:

- park domain,
- make active,
- park descent pass,
- resume descent pass,
- edit existing options without losing saved children.

Parking is focus, not failure.

## Lineage Viewer Contract

The lineage viewer must render from either live goals or snapshots.

Minimum display:

- current item title,
- domain,
- cadence,
- parent chain,
- status badge for each goal where available,
- source badge: `live` or `snapshot`,
- snapshot moment badge when applicable: `attach_snapshot` or `plant_snapshot`,
- “serves” language rather than assignment language.

Required surfaces:

- TTV task detail/card expansion,
- planted BAR confirmation,
- BAR detail/review surface when the BAR has `lensGoalId` or `lensGoalSnapshot`.

## Functional Requirements

- **FR1**: Editing a yearly goal title preserves the original `LensGoal.id`.
- **FR2**: Editing a yearly goal with quarterly children preserves those children.
- **FR3**: Removing a referenced yearly goal parks or supersedes it instead of deleting it.
- **FR4**: Editing a quarterly goal preserves monthly children.
- **FR5**: TTV task creation cannot exceed five active tasks under rapid duplicate submits.
- **FR6**: TTV tasks store `lensGoalSnapshot` when attached to a goal.
- **FR7**: BAR planting copies `lensGoalId` and `lensGoalSnapshot`.
- **FR8**: BAR planting refuses to silently drop lineage.
- **FR9**: Parked domains/goals can be reactivated through UI.
- **FR10**: Lineage viewer can render from live goals or snapshots.
- **FR11**: Saved goals are matched by stable key, not title/domain/cadence.
- **FR12**: Removed referenced goals follow the explicit state machine.
- **FR13**: TTV daily priority ranks are protected by a DB-level uniqueness invariant.
- **FR14**: Lineage traces label source as `live` or `snapshot`.
- **FR15**: Stable keys use CUID/UUID-style canonical server keys; client temp keys are pre-persistence only.
- **FR16**: Goal state changes follow the explicit transition table.
- **FR17**: TTV `priorityRank` is historical daily keep order and is not reused.
- **FR18**: BAR planting stores a plant-time snapshot when live lineage is available.

## Acceptance Criteria

- A player creates a year goal, descends it to quarter/month/week, edits the year goal title, and all descendants still point to the same year goal ID.
- A player plants a TTV task as a BAR, then edits the parent goal, and the BAR still shows the updated or snapshot lineage.
- A removed referenced goal appears as parked/superseded, not deleted.
- Rapidly clicking “Keep as task” cannot create more than five active TTV tasks for the day.
- Rapidly clicking “Keep as task” cannot create duplicate `priorityRank` values for the day.
- A parked domain can be made active and saved without rebuilding the whole intake.
- Two same-title goals in the same domain can be edited independently without identity collision.

## Out Of Scope

- Full analytics dashboard.
- AI-generated goal rewriting.
- Public accountability/social sharing.
- Full final visual polish of the Claude prototype.
- Replacing Tap the Vein with another daily workflow.

## Resolved Decisions

- **Stable keys**: Client may use `tempKey` before persistence. Server creates canonical CUID/UUID-style `stableKey` at first persistence and returns it to the client.
- **Identity matching**: Normal saves match by canonical `stableKey` only.
- **Removed referenced goals**: Explicit park becomes `parked`; replacement becomes `superseded`; referenced removal without successor becomes `archived`; unreferenced abandoned draft may be deleted.
- **Rank semantics**: `priorityRank` is historical daily keep order and is not reused. Active cap is enforced separately.
- **Snapshot timing**: TTV task stores `attachSnapshot`; BAR stores `plantSnapshot` when live lineage exists, otherwise falls back to attach snapshot.
- **Lineage display**: Compact cards show current item, domain, cadence, and source. Expanded trace shows full parent chain and statuses.
