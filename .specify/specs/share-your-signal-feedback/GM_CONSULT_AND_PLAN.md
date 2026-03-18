# Share Your Signal — Game Master Consultation & Implementation Plan

**Source**: Player feedback uploaded through the Share Your Signal quest in production.  
**Quest**: `system-feedback` (Share Your Signal) — Clean Up move, repeatable feedback quest.

---

## Persistence (Implemented)

**Regent/Architect**: Share Your Signal feedback is now persisted. Before deleting the PlayerQuest record (so the quest can reappear), the quest engine appends to `.feedback/cert_feedback.jsonl` with `questId: 'system-feedback'`, `passageName: 'Share Your Signal'`, and a combined `feedback` field (Resonance, Clarity, Transmission). The [cert-feedback-triage skill](../../.agents/skills/cert-feedback-triage/SKILL.md) can process these entries.

---

## Feedback (Paste Here)

> **To triage**: For feedback submitted *before* this persistence was deployed, paste it below. For feedback submitted *after*, run `tail -n 20 .feedback/cert_feedback.jsonl` and filter for `questId: "system-feedback"`.

```
[PASTE PLAYER FEEDBACK HERE]
```

**Example format** (from quest inputs):
- **Resonance (Overall Vibe)**: Emerald | Amber | Obsidian
- **Game Grammar (Clarity of Action)**: Clear Path | Foggy | Blind
- **Transmission**: Free-text feedback

---

## Game Master Consultation (System State)

Each face addresses the Share Your Signal flow and triage path. *Specific feedback content* will be addressed once pasted above.

### Regent (Order, structure)

*"The Regent maintains order. Feedback must flow into a system that can act on it."*

- **Flow (before fix)**: PlayerQuest completion → inputs stored → record deleted → **feedback discarded**. No triage path.
- **Flow (after fix)**: PlayerQuest completion → append to `.feedback/cert_feedback.jsonl` → delete record → cert-feedback-triage skill processes → backlog/spec.
- **Recommendation**: Persistence implemented. For feedback submitted *before* deploy: obtain via production DB query (if record still exists) or player/stakeholder paste. Run cert-feedback-triage when entries are present.

### Architect (Blueprint)

*"The Architect builds the blueprint. Before we fix, we specify."*

- **Root cause**: Quest engine deleted PlayerQuest after system-feedback completion; inputs were never persisted.
- **Spec**: Log to `.feedback/cert_feedback.jsonl` before delete; reuse cert format (`questId: 'system-feedback'`, `passageName: 'Share Your Signal'`) so existing triage skill works.
- **Recommendation**: Implemented in `quest-engine.ts`. Phase 2 tasks (F1–F3) will be filled when specific feedback is triaged.

### Shaman (Mythic threshold)

*"The Shaman holds the threshold between what the player experienced and what the system can receive."*

- **Recommendation**: Once feedback is pasted, assess Resonance (Emerald/Amber/Obsidian) and Transmission. Does the system honor the gradient, or flatten it?

### Challenger (Proving ground)

*"The Challenger tests under pressure. Vague feedback is not actionable."*

- **Recommendation**: Once feedback is pasted, extract Clarity (Clear Path/Foggy/Blind) and specific behaviors. What did the player expect? What did they get?

### Diplomat (Weave)

*"The Diplomat reads the relational field. Feedback is an invitation, not a demand."*

- **Recommendation**: Phase 3 (C1–C3) addresses loop closure: confirmation UX, admin dashboard, Obsidian/Blind alerts.

### Sage (Whole)

*"The Sage sees the whole. Does this feedback serve emergence?"*

- **Recommendation**: Share Your Signal feeds into the same triage pipeline as certification feedback. Both are player-reported signals; both become specs and backlog items. The system now receives.

---

## Implementation Plan (Template)

Once feedback is triaged and GM voices have responded, fill this plan.

### Phase 1: Persist Share Your Signal Feedback — DONE

- [x] **P1**: In `quest-engine.ts`, before `playerQuest.delete` for system-feedback: extract `inputs` (sentiment, clarity, feedback) and append to `.feedback/cert_feedback.jsonl` with `questId: 'system-feedback'`, `passageName: 'Share Your Signal'`.
- [ ] **P2**: (Optional) Add `POST /api/feedback/share-your-signal` if client-side submission is ever needed without full quest completion.
- [x] **P3**: Flow documented: Player completes Share Your Signal → feedback logged to `.feedback/cert_feedback.jsonl` → triage via [cert-feedback-triage skill](../../.agents/skills/cert-feedback-triage/SKILL.md) → backlog/spec.

### Phase 2: Response to Specific Feedback

- [ ] **F1**: [Specific fix from feedback — e.g. "Add placeholder text when generating from template"]
- [ ] **F2**: [Another fix if feedback contains multiple issues]
- [ ] **F3**: [UX improvement — e.g. "Show player their feedback was received with more presence"]

### Phase 3: Feedback Loop Closure

- [ ] **C1**: Consider: Does the player get any confirmation beyond "Thank you, your feedback has been logged"?
- [ ] **C2**: Consider: Should admins see Share Your Signal feedback in a dashboard?
- [ ] **C3**: Consider: Should high-Obsidian or high-Blind feedback trigger an alert?

---

## Next Steps

1. **Obtain feedback**:
   - **Production DB**: If production still has the old code (no delete), run `scripts/sync_feedback.ts` with `DATABASE_URL` pointing at production to pull completions into a log. *Note*: Current production code deletes the record, so older completions may already be gone.
   - **Manual**: Have the player/stakeholder paste the feedback content.
2. **Paste above**: Insert the feedback into the placeholder section.
3. **Run triage**: `tail -n 20 .feedback/cert_feedback.jsonl | jq -r 'select(.questId=="system-feedback") | "\(.timestamp) \(.playerName): \(.feedback)"'` — or use the [cert-feedback-triage skill](../../.agents/skills/cert-feedback-triage/SKILL.md).
4. **Fill Phase 2**: Convert GM recommendations into F1–F3 tasks.
5. **Create spec**: If the feedback warrants a new spec, create `.specify/specs/share-your-signal-feedback-[issue]/spec.md` and backlog prompt.

---

## Reference

- Quest: `system-feedback` (Share Your Signal) — [src/lib/seed-utils.ts](../../src/lib/seed-utils.ts)
- Completion flow: [src/actions/quest-engine.ts](../../src/actions/quest-engine.ts) — repeatable, cap at 5 rewards
- Cert feedback (different flow): `.feedback/cert_feedback.jsonl` — Report Issue during cert quests
- Cert triage skill: [.agents/skills/cert-feedback-triage/SKILL.md](../../.agents/skills/cert-feedback-triage/SKILL.md)
