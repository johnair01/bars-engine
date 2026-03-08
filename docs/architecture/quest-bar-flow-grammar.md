# Quest/BAR Flow Grammar v0

## Purpose

Define the allowed shapes of generated quest and BAR-related flows. This is a **computational grammar** for validation and generation quality control. Unblocks AI-generated onboarding and quest flows for Bruised Banana Residency.

---

## 1. Design Goal

Generated quest flows must be:

- **Valid in system terms** — Compatible with state transitions, permissions, event emission
- **Understandable to users** — Concrete, action-oriented, low-ambiguity copy
- **Finite or intentionally persistent** — No infinite loops; completion or handoff reachable
- **Capable of completion or meaningful continuation** — At least one terminal path
- **Compatible with event-driven state transitions** — Emits events; aligns with [state-transitions.md](state-transitions.md)

**Onboarding preference:** Clarity and momentum over complexity.

---

## 2. Core Flow Units

| Unit | Type | Description |
|------|------|-------------|
| **Node** | Structural | A step or state in the flow; has id, type, text, choices |
| **Action** | Structural | Something an actor can do; may mutate state |
| **Transition** | Structural | Movement between nodes via choices; targetId |
| **Condition** | Structural | Requirement for a transition (permission, state, BAR exists) |
| **BAR event** | Structural | BAR created, attached, validated, or completed |
| **Completion check** | Structural | How progress or success is determined |
| **Prompt copy** | Descriptive | Human-facing text for the step |

**Structural** units affect flow validity. **Descriptive** units affect UX but do not change structural validity.

---

## 3. Allowed Node Types

| Node Type | Purpose | Required Inputs | Allowed Outputs | User-Facing | Emits Events |
|-----------|---------|-----------------|-----------------|-------------|---------------|
| **introduction** | Orient; set context | — | prompt, choice | Yes | orientation_viewed |
| **prompt** | Present information; request attention | — | choice, action, reflection | Yes | prompt_viewed |
| **choice** | Present options; branch | options[] | prompt, action, handoff, completion | Yes | choice_selected |
| **action** | Actor performs action (signup, donate, join) | actionType | validation, progress, handoff | Yes | action_performed |
| **BAR_capture** | Actor creates or submits BAR | — | BAR_validation, progress | Yes | bar_created |
| **BAR_validation** | Validate existing BAR | barRef | progress, BAR_capture (retry) | Yes | bar_validated |
| **quest_join** | Actor takes quest | questRef | progress, prompt | Yes | quest_joined |
| **quest_progress** | Record progress; advance | progressRef | completion, handoff, choice | Yes | quest_progressed |
| **reflection** | Actor reflects; optional input | — | prompt, choice, action | Yes | reflection_submitted |
| **handoff** | Transfer to next quest/flow | targetRef | (external) | Yes | handoff_triggered |
| **completion** | Quest complete; rewards | — | (terminal) | Yes | quest_completed |
| **blocked** | Unreachable or waiting | — | redirect | Yes | — |
| **redirect** | Recovery path from blocked | — | prompt, choice, handoff | Yes | — |

**Onboarding subset:** introduction, prompt, choice, action, BAR_capture, quest_progress, completion, handoff. Avoid: BAR_validation (unless BAR created earlier in same flow), blocked (prefer clear paths).

---

## 4. Allowed Action Types

| Action Type | Required Permissions | Required State | Resulting Events | Onboarding-Safe |
|-------------|---------------------|----------------|------------------|------------------|
| **read** | observe | — | prompt_viewed | Yes |
| **choose** | observe | options available | choice_selected | Yes |
| **submit** | observe, propose | form valid | form_submitted | Yes |
| **create_BAR** | create | — | bar_created | Yes |
| **attach_BAR** | create, modify | BAR exists | bar_attached | No (requires prior BAR) |
| **join_quest** | join | quest open | quest_joined | Yes |
| **message_actor** | converse | target actor | message_sent | No (social coordination) |
| **confirm** | observe | — | confirmed | Yes |
| **reflect** | observe | — | reflection_submitted | Yes |
| **unlock_next_step** | (system) | completion met | step_unlocked | Yes |
| **enroll_ally** | join, create | campaign context | ally_enrolled | No (social) |
| **signup** | (public) | anonymous | identity_created | Yes |
| **donate** | (public) | — | donation_recorded | Yes |

**Onboarding-safe:** read, choose, submit, create_BAR, join_quest, confirm, reflect, unlock_next_step, signup, donate.

---

## 5. Legal Transition Patterns

### Legal

| From | To | Notes |
|------|-----|------|
| introduction | prompt, choice | |
| prompt | choice, action, reflection | |
| choice | prompt, action, quest_progress, handoff, completion | |
| action | validation, quest_progress, handoff, completion | |
| BAR_capture | BAR_validation, quest_progress | |
| BAR_validation | quest_progress, BAR_capture | Retry only |
| quest_join | quest_progress, prompt | |
| quest_progress | completion, handoff, choice | |
| reflection | prompt, choice, action | |
| handoff | (external flow) | Terminal for this flow |
| completion | (terminal) | |
| blocked | redirect | |
| redirect | prompt, choice, handoff | |

### Illegal

| Pattern | Reason |
|---------|--------|
| completion → any | Completion is terminal |
| completion before any user action | Flow must require at least one actor action |
| BAR_validation before BAR_capture | BAR must exist before validation |
| blocked with no redirect | Dead-end; must have recovery |
| choice → choice (no intermediate) | Avoid branch explosion; insert prompt or action |
| introduction → completion | No user engagement |
| prompt → prompt (unbounded) | Risk of loop; max 2 consecutive prompts |

### Discouraged (Onboarding)

| Pattern | Reason |
|---------|--------|
| >3 branches from single choice | Complexity |
| >5 nodes before first action | Delayed engagement |
| BAR_validation without prior BAR_capture | Assumes prior inventory |
| message_actor before first completion | Social before solo loop |

---

## 6. Quest Arc Requirements

### Minimum Structure (Any Quest)

- **Initiation** — introduction or prompt
- **One or more actionable steps** — choice, action, BAR_capture, or quest_join
- **Visible progress** — quest_progress or equivalent
- **Completion or handoff** — completion or handoff node

### Onboarding Arc (Stronger Minimum)

1. **Orientation** — introduction (story context)
2. **One clear action** — signup, donate, choose, create_BAR, or join_quest
3. **One visible response** — System feedback (progress, unlock, confirmation)
4. **One completion or unlock** — completion or handoff to next quest

**Length:** Onboarding arcs should be ≤12 nodes. Prefer 5–8.

---

## 7. BAR Lifecycle in Flows

| Phase | Allowed After | Allowed Before |
|-------|---------------|----------------|
| **prompted** | introduction, prompt | BAR_capture |
| **created** | prompt, reflection, choice | BAR_validation, quest_progress |
| **validated** | BAR_capture | quest_progress, attach |
| **attached** | BAR_validation | quest_progress, completion |
| **converted** | attach, quest_progress | event_logged |
| **event_logged** | converted | (terminal) |

**Rules:**
- BAR creation allowed after prompt or reflection
- BAR validation requires BAR created in same flow or prior session
- BAR attachment requires valid target (quest, slot, thread)
- BAR completion cannot substitute for all quest progress unless flow explicitly designs for it (e.g., BAR-only quest)

**Onboarding:** Prefer BAR_capture → quest_progress (skip validation for first flow). Validation adds friction.

---

## 8. Copy Constraints for Generated Flows

Generated copy must be:

- **Concrete** — Specific actions, not abstract concepts
- **Action-oriented** — "Choose your nation" not "Consider the nations"
- **Low-ambiguity** — One clear interpretation
- **Short** — ≤80 words per node for onboarding
- **Emotionally legible** — Tone matches story_context; no over-explaining

**Avoid:**
- Vague mystical language
- Abstract architecture terms (e.g., "BAR", "quest packet")
- Overly long instructions (>150 words)
- Unclear next steps ("Continue" without context)

**First-time users** should follow without system lore.

---

## 9. Onboarding-Specific Constraints

For Bruised Banana onboarding:

- **Branching** — ≤3 choices per node; ≤2 levels of branching
- **BAR inventory** — Do not require prior BARs
- **Social coordination** — No message_actor, enroll_ally before first completion
- **Terminology** — Use story language (Conclave, heist, nations); avoid jargon
- **Session length** — Completion within 5–10 minutes
- **Core loop** — Touch at least once: enter → prompt → action → response → complete

**Suggested loop:**
1. Enter orientation
2. Receive prompt (story beat)
3. Create or respond (BAR, choice, signup)
4. Complete one quest step
5. Unlock next path (handoff or completion)

---

## 10. Minimal Flow Schema

```ts
interface Flow {
  flow_id: string
  campaign_id: string
  quest_template_id?: string
  nodes: FlowNode[]
  transitions: Transition[]
  required_permissions: string[]
  emitted_events: string[]
  completion_conditions: CompletionCondition[]
  copy_payloads?: Record<string, string>
}

interface FlowNode {
  id: string
  type: NodeType
  text: string
  choices?: Choice[]
  actionType?: ActionType
  barRef?: string
  targetRef?: string
}

interface Transition {
  fromId: string
  toId: string
  condition?: string
}

interface CompletionCondition {
  nodeId: string
  type: 'terminal' | 'handoff'
}
```

**NodeType:** introduction | prompt | choice | action | BAR_capture | BAR_validation | quest_join | quest_progress | reflection | handoff | completion | blocked | redirect

**ActionType:** read | choose | submit | create_BAR | attach_BAR | join_quest | confirm | reflect | unlock_next_step | signup | donate

---

## Mapping to Current Schema

| Grammar | Current |
|---------|---------|
| Node | QuestNode (beatType, text, choices) |
| introduction | beatType: orientation |
| prompt | beatType: rising_engagement, tension |
| choice | QuestNode with choices; depth branches |
| action | isActionNode: true; actionType |
| completion | beatType: consequence |
| handoff | choices → external targetId (e.g., char_lens) |
| Flow | SerializableQuestPacket |
| Transition | Choice.targetId |
