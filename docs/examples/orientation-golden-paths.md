# Orientation Golden Paths

## Purpose

Hand-authored examples of valid onboarding quest/BAR flows for Bruised Banana Residency. These are reference patterns for validation, AI generation, and simulation. Each is simple, complete, state-valid, user-legible, and suitable for simulation.

**JSON fixtures** (machine-readable) live in `fixtures/flows/`. Each fixture includes: `flow_id`, `campaign_id`, `start_node_id`, `nodes`, `completion_conditions`, `expected_events`. Nodes have `id`, `type`, `copy`, `actions`; actions have `type`, `requires`, `emits`, `next_node_id`. See [flow-simulator-contract.md](../architecture/flow-simulator-contract.md) for simulation expectations.

---

## Fixture 1: Minimal Linear Orientation

**File:** `fixtures/flows/orientation_linear_minimal.json`

**Flow summary:** 4 nodes. Enter → Read → Choose → Complete. No branching.

| Step | Node | Type | Text | Action | Next |
|------|------|------|------|--------|------|
| 1 | intro_1 | introduction | The Conclave has convened. Five nations. A heist at the Robot Oscars. You're joining the crew. | read | prompt_1 |
| 2 | prompt_1 | prompt | What draws you most right now? Understanding, connecting, or acting? | read | action_1 |
| 3 | action_1 | action | Choose your lens. | choose | completion_1 |
| 4 | completion_1 | completion | You've chosen your path. Welcome to the Conclave. | — | (terminal) |

**Choices at action_1:** choose → completion_1

**Actor actions:** read (2×), choose (1×)

**BAR interactions:** None

**Completion condition:** Actor reaches completion_1

**Emitted events:** orientation_viewed, prompt_viewed, choice_selected, quest_completed

**Why valid:** Start, one action (choose), visible response (completion), terminal. ≤12 nodes. No prior BAR.

**Simulation:** Intro → prompt → action (choose) → completion. Expected events: orientation_viewed, prompt_viewed, choice_selected, quest_completed.

---

## Fixture 2: BAR Creation Flow

**File:** `fixtures/flows/orientation_bar_create.json`

**Flow summary:** 5 nodes. Intro → Prompt for BAR → Create BAR → Validation → Completion.

| Step | Node | Type | Text | Action | Next |
|------|------|------|------|--------|------|
| 1 | intro_1 | introduction | The crew is assembling. The heist needs your input. | read | prompt_1 |
| 2 | prompt_1 | prompt | What's one thing you want to contribute? Write a short note. | read | bar_capture_1 |
| 3 | bar_capture_1 | BAR_capture | Share your contribution. | create_BAR | bar_validation_1 |
| 4 | bar_validation_1 | BAR_validation | Your contribution is recorded. The Conclave hears you. | confirm | completion_1 |
| 5 | completion_1 | completion | You've crossed the first threshold. Welcome. | — | (terminal) |

**Actor actions:** read (2×), create_BAR (1×), confirm (1×)

**BAR interactions:** BAR created at bar_capture_1; validation at bar_validation_1 (condition: BAR_exists). BAR creation occurs before validation.

**Completion condition:** Actor reaches completion_1; BAR_created_before_validation satisfied.

**Expected events:** orientation_viewed, prompt_viewed, bar_created, bar_validated, quest_progressed, quest_completed

**Why valid:** BAR_capture before BAR_validation. Condition BAR_exists ensures validation only after creation. Completion reachable.

**Simulation:** Proves BAR lifecycle integration; confirms bar_created before bar_validated.

---

## Fixture 3: Orientation → First Quest Handoff

**File:** `fixtures/flows/orientation_handoff_first_quest.json`

**Flow summary:** 4 nodes. Intro → Orientation action (signup) → Progress → Handoff (unlock next quest).

| Step | Node | Type | Text | Action | Next |
|------|------|------|------|--------|------|
| 1 | intro_1 | introduction | The Conclave has convened. Cross the threshold to join. | read | action_1 |
| 2 | action_1 | action | Create your account. You are now an Early Believer. | signup | progress_1 |
| 3 | progress_1 | quest_progress | Account created. Orientation complete. | confirm | handoff_1 |
| 4 | handoff_1 | handoff | Continue to your first quest. | unlock_next_step | (external: dashboard) |

**Actor actions:** read (1×), signup (1×), confirm (1×)

**BAR interactions:** None

**Completion condition:** Handoff triggered; step_unlocked emitted; target_ref: dashboard.

**Expected events:** orientation_viewed, identity_created, quest_progressed, handoff_triggered, step_unlocked

**Why valid:** One clear action (signup). Handoff unlocks first non-orientation quest. Aligns with postSignupRedirect.

**Simulation:** Confirms onboarding can unlock the first non-orientation quest.

---

## Golden Path 2: Onboarding Flow with One Choice (Reference)

**Flow summary:** 5 nodes. Intro → Prompt → Choice (2 options) → Branch → Complete.

| Step | Node | Type | Text | Action | Next |
|------|------|------|------|--------|------|
| 1 | intro | introduction | Welcome to the Conclave. The heist needs every kind of pilot. | read | prompt |
| 2 | prompt | prompt | Each nation channels a different emotional energy. Which calls to you? | read | choice |
| 3 | choice | choice | Argyra: clarity. Pyrakanth: fire. Virelune: hope. Meridia: calm. Lamenth: flow. | choose | nation_a or nation_b |
| 4a | nation_a | quest_progress | You chose Argyra. The Silver City. Architects of precision. | confirm | completion |
| 4b | nation_b | quest_progress | You chose Pyrakanth. The Burning Garden. Gardeners of fire. | confirm | completion |
| 5 | done | completion | Your nation is set. Continue to choose your role. | — | (terminal) |

**Actor actions:** read (2×), choose (1×), confirm (1×)

**BAR interactions:** None

**Completion condition:** Actor reaches done via either branch

**Emitted events:** orientation_viewed, prompt_viewed, choice_selected, quest_progressed, quest_completed

**Why valid:** One choice, two branches, both reach completion. Clear path. ≤6 nodes.

---

## Golden Path 3: Onboarding Flow with BAR Creation

**Flow summary:** 6 nodes. Intro → Prompt → BAR capture → Progress → Completion.

| Step | Node | Type | Text | Action | Next |
|------|------|------|------|--------|------|
| 1 | intro | introduction | The crew is assembling. The heist needs your input. | read | prompt |
| 2 | prompt | prompt | What's one thing you want to contribute to this campaign? Write a short note. | read | BAR_capture |
| 3 | capture | BAR_capture | Share your contribution. | create_BAR | quest_progress |
| 4 | progress | quest_progress | Your contribution is recorded. The Conclave hears you. | confirm | completion |
| 5 | done | completion | You've crossed the first threshold. Welcome. | — | (terminal) |

**Actor actions:** read (2×), create_BAR (1×), confirm (1×)

**BAR interactions:** BAR created at capture; no validation step (onboarding simplification)

**Completion condition:** Actor reaches done after BAR creation

**Emitted events:** orientation_viewed, prompt_viewed, bar_created, quest_progressed, quest_completed

**Why valid:** BAR_capture before any BAR_validation. One clear action. Completion reachable.

---

## Golden Path 4: Onboarding Flow with Guide/Librarian Interaction

**Flow summary:** 6 nodes. Intro → Guide prompt → Choice (learn more or continue) → Branch → Completion.

| Step | Node | Type | Text | Action | Next |
|------|------|------|------|--------|------|
| 1 | intro | introduction | A Conclave Steward greets you. "The Robot Oscars. The heist of the century. We need you." | read | prompt |
| 2 | prompt | prompt | The steward shows you a dossier. "Which story calls to you? The nations, the archetypes, or the heist itself?" | read | choice |
| 3 | choice | choice | Learn about nations | choose | guide_nations or continue |
| 4a | guide_nations | prompt | The steward explains: Argyra (clarity), Pyrakanth (fire), Virelune (hope), Meridia (calm), Lamenth (flow). | read | completion |
| 4b | continue | quest_progress | You nod. "Let's go." | confirm | completion |
| 5 | done | completion | The steward hands you a token. "You're in. Choose your path." | — | (terminal) |

**Actor actions:** read (2–3×), choose (1×), confirm (0–1×)

**BAR interactions:** None

**Completion condition:** Actor reaches done via guide or continue

**Emitted events:** orientation_viewed, prompt_viewed, choice_selected, quest_progressed, quest_completed

**Why valid:** Guide provides optional depth; both branches complete. No social coordination (guide is system content).

---

## Golden Path 5: Onboarding Flow with Handoff to First Non-Orientation Quest

**Flow summary:** 5 nodes. Intro → Action (signup) → Progress → Handoff.

| Step | Node | Type | Text | Action | Next |
|------|------|------|------|--------|------|
| 1 | intro | introduction | The Conclave has convened. Cross the threshold to join. | read | action |
| 2 | signup | action | Create your account. You are now an Early Believer — a Catalyst who crossed before the crowd. | signup | progress |
| 3 | progress | quest_progress | Account created. Orientation complete. | confirm | handoff |
| 4 | handoff | handoff | Continue to your first quest. | — | (external: dashboard) |

**Actor actions:** read (1×), signup (1×), confirm (1×)

**BAR interactions:** None

**Completion condition:** Handoff triggered; actor redirected to dashboard

**Emitted events:** orientation_viewed, identity_created, quest_progressed, handoff_triggered

**Why valid:** One clear action (signup). Handoff to next flow. Aligns with postSignupRedirect.

---

## Summary Table

| Path | Fixture | Nodes | Branches | BAR | Actions | Terminal |
|------|---------|-------|----------|-----|---------|----------|
| 1. Minimal linear | orientation_linear_minimal.json | 4 | 0 | No | choose | completion |
| 2. BAR creation | orientation_bar_create.json | 5 | 0 | Yes | create_BAR, confirm | completion |
| 3. Handoff | orientation_handoff_first_quest.json | 4 | 0 | No | signup, confirm | handoff |
| 4. One choice | (reference only) | 6 | 1 | No | choose, confirm | completion |
| 5. Guide interaction | (reference only) | 6 | 1 | No | choose, read | completion |

**JSON fixtures** (1–3) are simulation-ready. Paths 4–5 are reference patterns; fixtures may be added later.

All paths: ≤12 nodes, first action by node 5, no prior BAR required, completion or handoff reachable.
