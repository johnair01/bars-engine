# Onboarding Quest Generation — Unblock Analysis

## Purpose

Identify what's blocking testing of the onboarding quest generation function and outline paths to unblock. The generation process is brittle and inflexible; the goal is a clear flow from inputs → skeleton → feedback → flavor → finalization.

---

## 1. Desired Flow (Target State)

```
Inputs (Unpacking, Domain, Move, I Ching draw)
    → CYOA skeleton (structure only)
    → First choice point: developmental lens (derived from I Ching lines)
    → Admin reviews skeleton, gives feedback
    → Regenerate or modify skeleton
    → Accept outline
    → AI generates flavor text
    → Admin can manually add choices to nodes
    → Finalize
```

**Key insight:** Skeleton first, flavor second. Developmental lens as first choice (from I Ching lines), not as input.

---

## 2. Current State vs. Gaps

| Aspect | Current | Gap |
|--------|---------|-----|
| **Inputs** | Q1–Q6, Q7 (move), model, segment, nation, archetype, lens, expectedMoves, playerPOV | I Ching draw not in flow; Domain = Q1 (exists); Move = Q7 (exists) |
| **Developmental lens** | Admin selects in step 13 | Should be first choice point in output, derived from I Ching lines |
| **Output** | Full QuestPacket (heuristic text) → AI enriches all nodes | No skeleton-first phase; no structure-only output |
| **Feedback loop** | Regenerate with same inputs | No "modify skeleton + feedback" step; no iterative refinement |
| **Generation process** | 15 linear form steps (GenerationFlow) | Not a CYOA; admin cannot "play through" with back/forward like a story |
| **Grammar teaching** | Voice Style Guide, prompt context | No few-shot grammatical examples in prompt; AI learns from structure, not examples |

---

## 3. Blockers (Prioritized)

### Blocker 1: UI is not a CYOA flow

**Problem:** The quest-grammar-ux-flow spec says "the generation flow is itself a CYOA quest." Current implementation is 15 form steps with Next/Back. Admin does not experience it as a story; no sense of progression; easy to lose context.

**Unblock:** Refactor GenerationFlow into a playable CYOA — each step is a passage. Admin advances by "Continue" like a player. Back button = previous passage. Progress indicator. Feels like playing a quest to create a quest.

### Blocker 2: No skeleton-first phase

**Problem:** Current flow compiles directly to full packet (heuristic text). AI then enriches. There is no intermediate "skeleton" — structure (nodes, choices, transitions) without flavor. Admin cannot review structure before flavor.

**Unblock:** Add a skeleton phase. Output: node IDs, types, choice targets, beat structure. No prose. Admin reviews structure; gives feedback ("add branch at node 3", "lens choice should come first"). Regenerate skeleton. Only after acceptance → AI generates flavor.

### Blocker 3: Developmental lens as input, not first choice

**Problem:** User wants first choice point = choose developmental lens as function of I Ching lines. Currently lens is an admin input (step 13). The generated quest doesn't have "choose your lens" as the first player choice.

**Unblock:** I Ching draw → which lines are changing → which Game Master faces are "available" for this hexagram. Skeleton's first choice = pick one of those faces. Compiler/grammar must support depth branches or choice nodes that present lens options derived from I Ching.

### Blocker 4: I Ching draw not in the flow

**Problem:** I Ching draw is used in `generateGrammaticQuestFromReading` (player-facing) but not in the admin GenerationFlow. Admin cannot provide a hexagram when generating onboarding quests.

**Unblock:** Add I Ching draw step to generation flow. Options: (a) Admin casts I Ching (button → API → hexagram), (b) Admin selects hexagram from list, (c) Random draw for testing. Pass ichingContext to compileQuest.

### Blocker 5: No feedback-driven regeneration

**Problem:** Regenerate uses same inputs. No way to say "the structure is wrong, do X instead" and have the AI adjust.

**Unblock:** Add feedback field. On regenerate, pass `adminFeedback` to buildQuestPromptContext. AI incorporates feedback into next draft. Document in prompt: "Admin feedback: [X]. Adjust the structure accordingly."

### Blocker 6: No grammatical examples in prompt

**Problem:** AI generates from prompt context (signature, unpacking, etc.) but has no few-shot examples of valid quest structure. Output can be malformed.

**Unblock:** Add 1–2 golden path examples (from fixtures or generated-quest-example) to the system prompt. "Here is a valid skeleton. Generate something similar in structure." Constrains output shape.

---

## 4. Two Strategic Paths

### Path A: CYOA flow for generation (process fix)

**Idea:** Make the generation process itself a CYOA. Admin "plays" a quest whose passages collect inputs and produce the generated quest.

**Steps:**
1. Create an Adventure (or in-memory flow) for "Quest Generation" with passages: Input Domain, Input Move, Cast I Ching, Input Unpacking (Q1–Q6), Review & Generate, Skeleton Review, Feedback, Accept, Flavor Generation, Finalize.
2. Each passage = one step. Back = previous passage.
3. Data persists in session/state as admin moves.
4. "Generate" passage triggers skeleton compilation.
5. "Skeleton Review" passage shows structure; feedback input; regenerate.
6. "Accept" → flavor generation.
7. "Finalize" → publish.

**Pros:** Matches spec; admin can go back; clear progression; process mirrors player experience.
**Cons:** More UI work; need to design the generation adventure.

### Path B: Grammatical examples (output fix)

**Idea:** Teach the AI with few-shot examples. Use golden paths + generated-quest-example as prompts. AI produces structurally valid output more reliably.

**Steps:**
1. Add 1–2 minimal JSON skeletons to quest_generation_system_prompt.
2. Add "Generate a skeleton matching this structure" instruction.
3. Validate output against quest_generation_output_schema.
4. Simulate before accepting.
5. Expand examples over time (orientation_bar_create, orientation_handoff, etc.).

**Pros:** Improves output quality quickly; leverages fixtures we built; no UI change.
**Cons:** Doesn't fix process UX; AI may still drift.

**Recommendation:** Do both. Path B unblocks testing immediately (better output). Path A fixes the process long-term.

---

## 5. Minimal Unblock (Fastest Path)

To test onboarding quest generation **today** with minimal changes:

1. **Add I Ching draw to GenerationFlow** — One step: "Cast I Ching" (button or dropdown). Store hexagramId. Pass to compileQuestWithPrivileging via ichingContext.

2. **Add feedback field** — On generate step, show preview + text input "Feedback for regeneration". Pass to compileQuestWithPrivileging as adminFeedback. Regenerate button uses it.

3. **Add grammatical example to system prompt** — In quest-grammar.ts compileQuestWithAI, prepend a minimal valid skeleton (from orientation_linear_minimal.json) to the system prompt. "Generate structure like this."

4. **Reorder lens** — If I Ching present, derive available faces from hexagram; make first choice in skeleton = lens selection. Requires compileQuestCore or a wrapper to inject a lens-choice node before other content.

(4) is the most invasive. (1)–(3) are small changes.

---

## 6. Skeleton-First Architecture (Medium-Term)

To support skeleton → feedback → flavor:

1. **compileQuestSkeleton** — New function. Inputs: unpacking, domain, move, ichingContext. Output: SerializableQuestPacket with placeholder text ("[Node 1]", "[Choice A]") or minimal labels. Structure only. No AI.

2. **validateSkeleton** — Run through flow simulator. Reject if invalid.

3. **Admin reviews skeleton** — UI shows node graph or linear list. Feedback: "Add branch at X", "Lens choice first". Parse feedback (or freeform) → pass to AI.

4. **generateFlavorFromSkeleton** — AI takes skeleton + feedback. Output: same structure, prose filled in. Replace placeholders.

5. **Publish** — As today.

---

## 7. Summary: What to Build Next

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 1 | Add I Ching draw step to GenerationFlow | Low | Unblocks I Ching–driven generation |
| 2 | Add adminFeedback to regenerate | Low | Enables iterative refinement |
| 3 | Add grammatical example to AI prompt | Low | Improves output structure |
| 4 | Refactor GenerationFlow into CYOA passages | High | Fixes process UX; admin can go back |
| 5 | Skeleton-first phase (compileQuestSkeleton) | Medium | Enables structure review before flavor |
| 6 | Lens as first choice (from I Ching lines) | Medium | Aligns with user's desired flow |

**Suggested order:** 1, 2, 3 (quick wins) → 5 (skeleton phase) → 6 (lens first choice) → 4 (full CYOA process).
