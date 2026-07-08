# Tool Coverage vs Allyship Deck Coverage

## Question

How well does the generic Emotional Alchemy tool taxonomy cover the five moves, and how does that compare to the existing Allyship Deck?

The product direction is:

```text
draw allyship deck card
-> encounter blocker/charge
-> resolve emotional vector
-> card provides move lens
-> system recommends tools for the needed submove
-> player completes a BAR-loggable practice
```

## Short Answer

The Allyship Deck has **complete formal coverage** across the five moves. The tool taxonomy has **practical method coverage**, but it is intentionally uneven.

That is not a problem. It reveals the merge architecture:

- **Allyship Deck cards answer**: what kind of move is this, in which domain, through which operation?
- **Emotional vector routing answers**: what emotional transformation is needed?
- **Tools answer**: how does the player actually perform the submove?
- **BAR logging answers**: what proves the move happened?

The deck should not become the tool library. The deck should become the **move recommender / lens selector** that calls the tool library.

## Source Coverage

### Tool Taxonomy

Source: `generic-tool-taxonomy.md`

10 generic tools:

1. 321 Charge Dialogue
2. Find the Felt Thread
3. BAR Capture
4. Story Turnaround
5. Put It On The Board
6. Clean Line
7. Return to the Body
8. One True Next Move
9. Happy Apples
10. Make It Real

### Allyship Deck

Sources:

- `src/lib/allyship-deck/types.ts`
- `src/lib/allyship-deck/move-library.ts`
- `public/allyship-deck/allyship-deck.json`
- `.specify/specs/allyship-deck/spec.md`
- `.specify/specs/allyship-deck/move-library-core-rules.md`

Actual assembled deck coverage:

| Axis | Coverage |
|---|---:|
| Total move cards | 120 |
| Authored move cards | 120 |
| Instruction cards | 27 |
| Total cards | 147 |
| Wake Up cards | 24 |
| Open Up cards | 24 |
| Clean Up cards | 24 |
| Grow Up cards | 24 |
| Show Up cards | 24 |
| Cards per domain | 30 |
| Cards per operation | 20 |

The deck is perfectly balanced:

```text
5 moves x 6 operations x 4 domains = 120 move cards
```

## Matrix 1: Tool Coverage Across the Five Moves

| WAVE Move | Strong Tools | Medium Tools | Weak Tools | Notable Strength | Notable Gap |
|---|---:|---:|---:|---|---|
| Wake Up | 4 | 5 | 1 | Excellent awareness and signal detection coverage | Needs stronger social/field Wake Up tools beyond mapping |
| Open Up | 4 | 3 | 3 | Strong receiving/regulation/appreciation/ritual coverage | Weak for boundary/action tools; needs better "receive charge without collapse" protocols |
| Clean Up | 3 | 5 | 2 | Strong for 321, felt sense, belief inquiry | Needs more channel-specific cleanup tools, especially sadness and neutrality |
| Grow Up | 5 | 5 | 0 | Best overall coverage; many tools can become capacity practice | Risk of overusing reflection as maturity |
| Show Up | 3 | 5 | 2 | Strong concrete action coverage through Clean Line, Command Bridge, Ritual | Internal Show Up needs first-class artifact handling |

### Interpretation

The taxonomy is healthiest for **Grow Up** and **Wake Up**. It is workable for **Clean Up** and **Show Up**, but those require careful tool selection. **Open Up** has good tools but is philosophically delicate: it is easy to confuse "receive charge" with "process charge" or "act from charge."

## Matrix 2: Allyship Deck Coverage Across the Five Moves

| WAVE Move | Cards | Output BAR | Deck Purpose | Current Tool Depth |
|---|---:|---|---|---|
| Wake Up | 24 | Awareness | Detect charge | Prompts/remediation only; no method selection |
| Open Up | 24 | Experience | Receive charge | Strongest authored conceptual slice historically; still not a tool protocol |
| Clean Up | 24 | Insight | Transform charge | Good questions, but emotional vector/tool selection happens elsewhere |
| Grow Up | 24 | Wisdom | Develop capability | Good capacity prompts; needs tool-backed practice reps |
| Show Up | 24 | Artifact | Invest capacity | Strong domain/action grammar; needs internal/external Show Up distinction |

### Interpretation

The Allyship Deck already covers the **move grammar** better than the tool taxonomy does. But it does not yet cover the **method layer**. A card can say "Allow discomfort" or "Create relationship," but it does not reliably tell the player whether to use 321, Focusing, Inquiry, a boundary script, grounding, or a quest seed ritual.

## Matrix 3: Where Deck Cards and Tools Naturally Meet

| Deck Move | What Card Contributes | Tool Family It Should Prefer | Example |
|---|---|---|---|
| Wake Up | Operation + domain lens for noticing | Find the Felt Thread, BAR Capture, Put It On The Board, 321 Charge Dialogue | `WAKE-SO-SHAMAN` helps notice organizing charge; tool turns it into a felt handle or field map |
| Open Up | Permission to receive/allow/stay with charge | Return to the Body, Find the Felt Thread, Happy Apples, Make It Real, 321 Charge Dialogue | `OPEN-GR-CHALLENGER` surfaces avoided need; tool helps the player feel the ask without bypass |
| Clean Up | Missing move/channel/story question | 321 Charge Dialogue, Story Turnaround, Find the Felt Thread, Put It On The Board | `CLEAN-RA-CHALLENGER` challenges interpretation; tool tests the story and produces a replacement |
| Grow Up | Capacity to practice | BAR Capture, Story Turnaround, Put It On The Board, Clean Line, 321 Charge Dialogue | `GROW-DA-REGENT` asks what deserves practice; tool creates a capacity rep |
| Show Up | Artifact/domain/action shape | One True Next Move, Clean Line, Make It Real, BAR Capture | `SHOW-DA-CHALLENGER` creates intervention; tool turns it into message/action/commitment |

## Matrix 4: Operation-to-Tool Affinity

The six Allyship Deck operations should influence tool choice after the emotional vector is known.

| Operation | Deck Verb | Tool Affinity | Why |
|---|---|---|---|
| Shaman | Notice | Find the Felt Thread, 321 Charge Dialogue, BAR Capture | Shaman wants contact with what is here |
| Challenger | Challenge | Story Turnaround, Clean Line, One True Next Move | Challenger wants resistance, story, or intervention |
| Regent | Steward | BAR Capture, Put It On The Board, Clean Line | Regent wants responsibility and continuity |
| Architect | Amplify | Put It On The Board, Happy Apples, One True Next Move | Architect wants leverage, resources, and structure |
| Diplomat | Care | Clean Line, 321 Charge Dialogue, Make It Real | Diplomat wants relationship and power dynamics handled cleanly |
| Sage | Integrate | BAR Capture, Story Turnaround, Make It Real, 321 Charge Dialogue | Sage wants meaning and artifact |

## Matrix 5: Domain-to-Tool Affinity

The four allyship domains should shape expression, not emotional routing.

| Domain | Tool Affinity | Output Bias |
|---|---|---|
| Gather Resources | Put It On The Board, Clean Line, Happy Apples, One True Next Move | ask, inventory, resource map, receiving practice |
| Raise Awareness | BAR Capture, Story Turnaround, Find the Felt Thread, Make It Real | insight, story, post, question, visibility artifact |
| Direct Action | One True Next Move, Clean Line, Return to the Body, Put It On The Board | intervention, boundary, step, action commitment |
| Skillful Organizing | Put It On The Board, BAR Capture, Clean Line, One True Next Move | role map, sequence, handoff, process artifact |

## Product Finding

### The Deck Is Complete, But It Is Not Yet Executable Enough

The Allyship Deck has:

- complete five-move coverage
- complete operation coverage
- complete domain coverage
- authored card copy
- primary and campaign question modes
- remediation text

But the deck does not yet have:

- tool capability metadata
- emotional-vector mapping
- protocol composition
- completion schema per card
- internal vs external Show Up artifact typing
- a way to say "this card recommends these tools for this vector"

### The Tool Taxonomy Is Executable, But It Is Not Contextual Enough

The tool taxonomy has:

- concrete protocols
- WAVE capability ratings
- BAR-loggable outputs
- completion criteria
- "when not to use" notes

But it does not yet have:

- deck card linkage
- domain-specific expression
- operation-specific weighting
- card art/product packaging
- player-facing draw/consult ritual

### Therefore

The correct merge is:

```text
Allyship Deck card = move lens
Emotional vector = transformation need
Tool registry = executable method
Recommendation composer = playable practice
Move attempt/BAR = proof of practice
```

## Recommended Merge Model

### 1. Keep Cards and Tools Separate

Do not turn every deck card into a unique tool.

That would explode into:

```text
120 cards x 10 tools x 5 satisfaction spirits x blockers/domains/superpowers
```

Instead:

```text
card metadata selects/prioritizes tool families
tool protocol gets composed with card context
```

### 2. Add Tool Affinity Metadata to Cards

Each card should eventually gain optional metadata:

```ts
type DeckCardToolAffinity = {
  preferredToolIds: string[]
  avoidToolIds?: string[]
  waveLens: 'wake_up' | 'open_up' | 'clean_up' | 'grow_up' | 'show_up'
  operation: Operation
  domain: AllyshipDomain
  outputBar: OutputBar
}
```

This can be inferred initially from move + operation + domain, then overridden for authored cards.

### 3. Add Tool Recommendation Metadata to Tools

Each tool should declare:

```ts
type ToolRecommendationProfile = {
  waveRatings: Record<WaveLens, ToolRating>
  operationAffinity: Partial<Record<Operation, ToolRating>>
  domainAffinity: Partial<Record<AllyshipDomain, ToolRating>>
  channelRatings: Record<EmotionChannel, ToolRating>
  moveRoleRatings: Record<'metabolize' | 'translate' | 'transcend', ToolRating>
  outputKind: ToolOutputKind
}
```

### 4. Compose Instead of Authoring Every Combination

The composer should take:

```text
card.move
card.operation
card.domain
present dissatisfaction
desired satisfaction
blocker/story
orientation internal/external
subject self/other/collective
superpower
```

And return:

```text
recommended tool(s)
selected submove
tool protocol
card-context translation
expected BAR output
completion criteria
```

## Example Merge

### Drawn Card

```text
OPEN-GR-CHALLENGER
The Ask You're Avoiding
Move: Open Up
Operation: Challenger
Domain: Gather Resources
```

### Player Intake

```text
Current dissatisfaction: loss/distance -> sadness:dissatisfied
Desired satisfaction: triumph -> anger:satisfied
Blocker: Need resources
Story: If I ask, I become a burden
```

### System Reasoning

```text
Vector route:
sadness:dissatisfied -> sadness:neutral
sadness:neutral -> anger:neutral
anger:neutral -> anger:satisfied

Card lens:
Open Up + Challenger + Gather Resources

Tool needs:
Open Up can receive sadness/need without collapse.
Challenger can test the avoided ask/story.
Gather Resources wants a concrete ask or resource map.
```

### Tool Recommendations

1. **Find the Felt Thread**: receive the sadness/need and identify the felt handle.
2. **Story Turnaround**: test the burden story.
3. **Clean Line**: draft the actual ask once the charge is cleaner.

The card remains the lens. The tools perform the reps.

## Biggest Coverage Gaps Before Merge

1. **Open Up protocol clarity**
   - Allyship Deck has 24 Open Up cards.
   - Tool taxonomy has Open Up support, but three tools are weak.
   - Need stricter rules for when Open Up uses grounding, felt sense, appreciation, ritual, or 321.

2. **Clean Up semantic specificity**
   - Deck Clean Up asks strong questions.
   - Earlier recommendation reviews showed bad primitive matches for sadness, neutrality, and fear satisfaction.
   - Tool choice should use vector-family metadata before generic card move metadata.

3. **Show Up internal artifact support**
   - Deck Show Up currently implies artifact/action.
   - Tool taxonomy correctly says Show Up can be external action or internal commitment artifact.
   - MoveAttempt/BAR output should distinguish: message, ask, boundary, quest seed, vow, rule, ritual, plan, map.

4. **Operation weighting**
   - The deck's six operations are powerful but not yet connected to tool scoring.
   - Without operation weighting, `Challenger` cards may recommend soft witnessing when inquiry/action is more appropriate, or `Diplomat` cards may recommend action without relational care.

5. **Domain expression**
   - Domain should change the expression of a tool, not the underlying emotional route.
   - Example: Clean Line in Gather Resources becomes an ask; in Direct Action becomes a boundary/intervention; in Skillful Organizing becomes a role/handoff; in Raise Awareness becomes a message/post/question.

## MVP Merge Recommendation

Do not try to merge the full 120-card deck with all tools at once.

Start with a deterministic adapter:

```text
deck card -> preferred tool families
```

Use only the MVP tool shortlist:

1. 321 Charge Dialogue
2. Find the Felt Thread
3. BAR Capture
4. Story Turnaround
5. One True Next Move

Then add two action/output tools:

6. Clean Line
7. Put It On The Board

This gives enough coverage for:

- Wake Up: Felt Thread, BAR Capture, Board
- Open Up: Felt Thread, 321, maybe BAR Capture
- Clean Up: 321, Story Turnaround, Felt Thread
- Grow Up: BAR Capture, Board, 321
- Show Up: One True Next Move, Clean Line, BAR Capture

## Implementation Shape

### Phase 1: Analysis Metadata

Add a pure helper:

```ts
getDeckCardToolAffinities(card: MoveCard): ToolAffinityHint[]
```

No UI changes yet. Test all 120 cards return at least two viable tool hints.

### Phase 2: Recommendation Composer

Extend charge-metabolism recommendations:

```ts
recommendToolsForDeckCard({
  card,
  vectorRoute,
  blocker,
  orientation,
  subject,
})
```

The service should rank:

1. vector-family tool fit
2. card move fit
3. operation fit
4. domain fit
5. blocker/story fit
6. output BAR fit

### Phase 3: Work This Card UI

Replace generic recommendation copy with:

```text
This card is asking you to Open Up through Challenger in Gather Resources.
Given your vector, use Find the Felt Thread first.
Expected output: felt handle + ask seed.
```

### Phase 4: BAR Reflection

Move attempt reflection should snapshot:

- deck card id
- card move/operation/domain
- emotional vector
- selected tool
- selected submove
- output kind
- artifact/reflection/outcome

## Final Product Principle

An Allyship Deck card should not merely recommend an emotional move. It should become the **lens that selects the right tool for the player's live charge**.

The card says:

```text
Practice this kind of allyship move.
```

The vector says:

```text
This is the emotional transformation required.
```

The tool says:

```text
Here is exactly how to do it.
```

The BAR says:

```text
This rep happened, and here is what changed.
```

