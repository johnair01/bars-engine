# Six Game Master Gap Analysis: Lineage Stability Bridge Spec

## Verdict

The bridge spec correctly identifies the core danger: Lenses goals must become durable identity-bearing artifacts. But the spec still leaves too much room for implementation ambiguity in exactly the places where lineage can fail.

The three most dangerous ambiguities are:

1. how incoming goals are matched to existing goals,
2. what removed goals become,
3. when snapshots are authoritative versus fallback.

Those must be resolved before implementation.

## Shaman Gap

**Protects:** living continuity, ritual truth, the player’s felt thread.

**What the spec gets right:**
- It names goals as “identity-bearing practice artifacts.”
- It refuses ordinary delete/recreate behavior.
- It understands that editing a goal should not sever the thread.

**Gap:**
- Snapshot semantics are vague. If snapshots sometimes update and sometimes freeze, the ritual record becomes unclear.

**Risk:**
- The player cannot tell whether a BAR is carrying the living goal, a historical memory of the goal, or a silently degraded copy.

**Close the gap:**
- Define snapshot precedence:
  - live goal chain wins when resolvable,
  - snapshot is immutable historical fallback,
  - snapshot gets created at task attach / BAR plant,
  - snapshot is not mutated on ordinary goal edits.

**Gate:**
- A lineage trace must label itself as `live` or `snapshot`.

## Challenger Gap

**Protects:** real choice, sharp boundaries, consequence.

**What the spec gets right:**
- It requires atomic TTV five-task cap behavior.
- It requires parked goals to be recoverable.
- It rejects silent BAR lineage loss.

**Gap:**
- The TTV cap requirement does not name the concrete enforcement mechanism.
- “Park or supersede” lets implementation dodge a real choice.

**Risk:**
- We get a transaction-shaped patch that still races, and archival behavior that depends on whatever was easiest in the moment.

**Close the gap:**
- Require a DB-level rank invariant:
  - unique index on `(dailySessionId, priorityRank)`,
  - rank allocation inside a transaction,
  - cap checked inside the same transaction.
- Define removed-goal rules:
  - explicit player parking => `parked`,
  - replacement with a new goal => `superseded`,
  - unreferenced abandoned draft => delete,
  - referenced goal never hard-deleted.

**Gate:**
- Tests simulate rapid duplicate commits and prove no task six / duplicate rank.

## Regent Gap

**Protects:** law, order, data stewardship.

**What the spec gets right:**
- It names stable IDs, lineage snapshots, and failure-on-stale-lineage.
- It recognizes that internal lineage cannot be allowed to rot.

**Gap:**
- It does not define foreign-key policy.
- It does not define archival state transitions tightly enough.

**Risk:**
- The schema keeps soft pointers everywhere, and the app depends on discipline instead of structural protection.

**Close the gap:**
- Add explicit relational policy:
  - `LensGoal.lensId` should relate to `Lens`.
  - `TapTheVeinTask.dailySessionId` relates to session.
  - `TapTheVeinTask.lensGoalId` can be nullable but should either FK with `SetNull` plus snapshot, or stay soft only with mandatory snapshot.
  - `CustomBar.lensGoalId` may remain soft if BARs are cross-system artifacts, but must have snapshot.
- Add state transition table for `active`, `parked`, `superseded`, `archived`, `complete`.

**Gate:**
- A referenced goal cannot disappear without an explicit preserved trace.

## Architect Gap

**Protects:** structural clarity, implementation economy, one source of truth.

**What the spec gets right:**
- It calls for lineage helpers.
- It calls for replacing delete/recreate behavior.
- It calls for shared workshop/cadence handling.

**Gap:**
- Goal matching is underspecified and still allows title/domain/cadence fallback.
- `stableKey` generation is left open.

**Risk:**
- The implementation “fixes” deletion by matching the wrong row, which is worse because the corruption looks intentional.

**Close the gap:**
- Require stable keys for every persisted workshop option.
- Server creates `stableKey` at first persisted draft/option.
- Client must carry `stableKey` afterward.
- Title/domain/cadence can be used only for one-time migration/backfill, never as normal edit matching.

**Gate:**
- Two goals with identical titles in the same domain can be edited independently without identity collision.

## Diplomat Gap

**Protects:** trust, understandable recovery, humane support.

**What the spec gets right:**
- It treats parked goals as recoverable.
- It wants UI for reactivation and resume.

**Gap:**
- It does not define the player-facing language for removed/superseded/archived goals.
- It does not define what the player sees when lineage is stale.

**Risk:**
- The system may technically preserve lineage but communicate it in a way that feels like failure, loss, or confusion.

**Close the gap:**
- Define copy rules:
  - `parked`: “set aside for focus”
  - `superseded`: “replaced by a newer version”
  - `archived`: “kept for history”
  - stale lineage: “carrying an earlier snapshot”
- Add recovery CTA:
  - make active,
  - view newer version,
  - review lineage.

**Gate:**
- A player can understand why an old goal still appears in a lineage trace.

## Sage Gap

**Protects:** perspective, living frame, non-attachment.

**What the spec gets right:**
- It wants a lineage viewer.
- It recognizes that the year frame should remain living.

**Gap:**
- The lineage viewer is named but not specified deeply enough.
- The spec does not distinguish “living trace” from “historical trace.”

**Risk:**
- The user sees raw hierarchy but not meaning. The trace becomes a breadcrumb list instead of a contemplative review.

**Close the gap:**
- Minimum lineage viewer:
  - current item,
  - domain,
  - cadence,
  - parent chain,
  - status badges,
  - source badge: `live` or `snapshot`,
  - “serves” language instead of “assigned to.”
- Show lineage viewer in:
  - TTV task detail,
  - planted BAR confirmation,
  - BAR detail/review surface.

**Gate:**
- A player can answer: “What larger goal does this serve, and is that trace live or historical?”

## Priority Spec Patches

1. **Define stable key rule**
   - Server creates `stableKey` at first persisted draft/option.
   - Client carries it thereafter.
   - Title matching is migration/backfill only.

2. **Define removed-goal state machine**
   - explicit park => `parked`
   - replacement => `superseded`
   - history-only => `archived`
   - completion => `complete`
   - referenced goals are never hard-deleted.

3. **Define snapshot precedence**
   - live lineage wins,
   - immutable snapshot fallback,
   - trace labels source.

4. **Define relational policy**
   - hard relations where safe,
   - soft BAR pointers only with mandatory snapshots.

5. **Define atomic TTV commit mechanism**
   - transaction plus unique rank invariant.

6. **Define lineage viewer minimum**
   - domain/cadence/parent chain/status/source.

## Recommendation

Patch the bridge spec before implementation. The next implementation should not begin until the spec answers:

- How is identity matched?
- What happens to removed referenced goals?
- Which lineage source wins: live or snapshot?
- What database invariant prevents task-rank races?

