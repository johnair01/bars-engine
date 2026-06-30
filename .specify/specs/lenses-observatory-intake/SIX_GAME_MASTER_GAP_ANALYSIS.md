# Six Game Master Gap Analysis: Lenses Implementation

## Verdict

The current implementation has the right product spine, but the lineage layer is not yet trustworthy enough. The main gap is not visual polish or flow coverage. It is that saved goals are treated like replaceable form rows, while the product promise treats them as living anchors that TTV tasks and BARs can carry forward.

Until goal identity is stable, Lenses can create meaning, then accidentally erase the references that make that meaning durable.

## Shaman Gap

**Protects:** threshold, ritual continuity, the felt life of the goal.

**Current strength:**
- The onboarding flow begins with vague movement and free-writing.
- Dream notes and discarded options exist in the data model.
- Planting a BAR is explicit enough to feel like a ritual threshold.

**Gap:**
- Revising a year frame currently deletes and recreates goals. This breaks ritual continuity. The player experiences the goal as “same living thread,” but the system treats it as a disposable row.

**Risk:**
- The product becomes spiritually false: it invites the player to author a living year, then quietly severs the thread when they revise.

**Close the gap:**
- Add stable goal identity.
- Saving should update, park, or version goals instead of deleting them.
- Dream notes should be visibly recoverable, not only technically persisted.

**Gate:**
- A player can revise a yearly goal title without breaking quarterly/monthly/weekly descendants, TTV tasks, or BAR lineage.

## Challenger Gap

**Protects:** real choice, focus, meaningful consequence.

**Current strength:**
- Keep caps exist: 10 options, 5 kept.
- TTV has a five-task cap.
- Planting a BAR requires an explicit action.

**Gap:**
- The five-task cap is race-prone because count and create are separate.
- Parking can be too easy in some places and too hard to recover from in others.

**Risk:**
- The system’s challenge becomes fake. Players can accidentally exceed the cap, while parked goals can become accidental dead ends.

**Close the gap:**
- Make TTV commit atomic.
- Add a unique daily task rank or transaction-level guard.
- Give parked domains/goals an explicit “make active” path.
- Ask for a lightweight parked reason or revisit intention.

**Gate:**
- Two rapid task submissions cannot create task six or duplicate priority ranks.
- A parked domain can be reactivated without reconstructing the whole workshop from scratch.

## Regent Gap

**Protects:** law, coherence, stewardship, data integrity.

**Current strength:**
- The schema names the correct entities: `Lens`, `LensGoal`, `LensWorkshopDraft`, `TapTheVeinDailySession`, `TapTheVeinTask`.
- BARs can carry `lensId` and `lensGoalId`.
- Descent requires parent context at the action layer.

**Gap:**
- The migration uses mostly soft pointers and lacks relational protections.
- Deleting/recreating goals creates orphan risks.
- TTV BAR planting silently drops `lensGoalId` if the goal has disappeared.

**Risk:**
- The app can claim lineage while the database quietly loses it.

**Close the gap:**
- Add foreign keys where ownership is internal and stable.
- If soft pointers are intentional for BARs, add explicit orphan handling and lineage snapshots.
- Do not silently promote a task to BAR if its attached goal is gone.

**Gate:**
- No lower-level goal, TTV task, or BAR can end up pointing to a deleted internal LensGoal without either a preserved snapshot or a clear “goal archived” state.

## Architect Gap

**Protects:** structure, abstraction, implementation economy.

**Current strength:**
- The reusable workshop logic is emerging in `src/lib/lenses/workshop.ts`.
- Prompt seeds and domain constants are separated from the UI.
- The descent route covers all active parent goals instead of only Health.

**Gap:**
- Onboarding and descent duplicate workshop behavior in client components.
- `nextCadence` exists in one file while `nextLensCadence` exists in another, creating drift risk.
- Descent state is not preloaded from previous drafts, so revisiting a parent goal feels blank even if saved before.

**Risk:**
- Future changes to the workshop loop will fork across screens.

**Close the gap:**
- Consolidate cadence helpers into one module.
- Extract a reusable workshop state/component or hook.
- Load existing descent drafts/goals into the descent UI for editing.

**Gate:**
- Year, quarter, month, and week use the same workshop rules from one source of truth.

## Diplomat Gap

**Protects:** trust, translation, support, non-extractive offers.

**Current strength:**
- Lenses and TTV copy mostly avoids shame.
- Guided support is adjacent rather than forced.
- TTV uses “resonates with” language instead of assignment language.

**Gap:**
- The Calendly CTA is still a placeholder/fallback.
- Weekly drop-in Lenses support is not modeled yet.
- The UI does not distinguish “self-guided,” “schedule an hour,” and “do this with Wendell” clearly enough.

**Risk:**
- Players who need facilitation may get stuck, while the support product remains invisible or feels bolted on later.

**Close the gap:**
- Add env-backed real Calendly config and empty-state copy when absent.
- Add a lightweight support offer surface after entry, save-for-later, and multiple parked domains.
- Keep it opt-in and non-shaming.

**Gate:**
- A player who cannot finish alone can schedule or join support without feeling like they failed.

## Sage Gap

**Protects:** spaciousness, perspective, living frame.

**Current strength:**
- The flow says “not a life sentence.”
- Parked goals are framed as focus.
- TTV can connect today’s action back to a larger frame.

**Gap:**
- The system currently treats “descended” as `childCount > 0`, which is too crude.
- There is no review mode showing the whole lineage from year to today.
- BAR lineage display is minimal: a badge, not a contemplative trace.

**Risk:**
- The player gets mechanics without enough perspective. They can create a hierarchy but not easily witness the shape of their life frame.

**Close the gap:**
- Add a lineage viewer for any LensGoal and promoted BAR.
- Track descent completeness by expected cadence, not just child count.
- Add a quiet review moment after saving descent and after planting a BAR.

**Gate:**
- A player can click a weekly task/BAR and see the thread: week -> month -> quarter -> year.

## Priority Gap List

1. **Stable LensGoal identity**
   - Replace delete/recreate saves with update/archive/version behavior.

2. **Lineage preservation**
   - Prevent orphaned descendants, TTV tasks, and BARs.
   - Add lineage snapshots where soft pointers are unavoidable.

3. **Atomic TTV commit**
   - Enforce the five-task cap safely.
   - Preserve unique priority rank.

4. **Park/reactivate UX**
   - Make parked domains and descent passes recoverable.

5. **Shared workshop/cadence module**
   - Remove duplicate cadence logic.
   - Reuse workshop behavior across onboarding/descent.

6. **Lineage viewer**
   - Show the goal chain on TTV tasks and planted BARs.

7. **Support offer integration**
   - Add real Calendly config and weekly drop-in offer placement.

## Recommended Next Patch

Do not start with UI polish. The next patch should be a Regent/Architect patch:

1. Add stable `clientKey` or edit identity for workshop options/goals.
2. Change `saveYearLensFrame` and `saveLensGoalDescent` to update existing goals instead of deleting them.
3. Archive removed goals only when they have no active descendants; otherwise mark `parked` or `superseded`.
4. Make TTV BAR planting fail loudly when attached lineage is invalid.
5. Add tests for preserving descendant IDs across goal edits.

