# BAR Polarity Extraction + Library Spec v2 (Implementation Grade)

## Status
Draft v2 — implementation-oriented  
Audience: BARs engine developers, admin tool builders, quest-generation pipeline designers

---

## 1. Intent

The BARs engine needs a robust way to transform raw BAR artifacts into structured polarity objects that can power:

- quest generation
- campaign design
- player intake and reflection
- emotional alchemy loops
- recommendation systems
- social and relational mechanics
- library browsing and clustering
- future simulation / orchestration layers

This spec defines:

1. the **ontology** for BAR polarity extraction  
2. the **pipeline** from raw BAR to canonical library entry  
3. the **data model** for storage and retrieval  
4. the **admin workflow** for curation  
5. the **player workflow** for lightweight confirmation  
6. the **quest hooks** and **emotional alchemy hooks**  
7. the **normalization rules** needed to keep the library coherent without flattening weirdness

---

## 2. Design Thesis

A BAR is not primarily an idea.

A BAR is a **compression artifact of tension**.

A polarity is the reusable structure latent inside that BAR.

If BARs are the vivid local artifacts players generate, then the polarity library is:

> the atlas of recurring tensions that make those BARs reusable

This means the system should optimize for:

- preserving aliveness
- extracting reusable structure
- supporting humor, metaphor, and cultural specificity
- reducing ontology drift
- enabling downstream gameplay

---

## 3. Core Concepts

## 3.1 BAR
A BAR is a player-generated artifact carrying some combination of:
- felt experience
- social signal
- meme compression
- symbolic or poetic content
- latent tension
- actionable leverage

A BAR may be:
- one-sided
- two-sided
- fragmentary
- absurd
- archetypal
- incomplete
- culturally encoded
- clarifying only after discussion

## 3.2 Polarity
A polarity is a reusable tension structure extracted from a BAR.

A polarity may be:
- a binary tension
- a developmental gradient
- an operational tradeoff
- an identity or relational axis
- a threshold or conversion point
- a multi-axis field that should not be prematurely flattened

## 3.3 Library Entry
A library entry is the canonical form of a polarity:
- normalized language
- linked examples
- known failure modes
- quest patterns
- emotional alchemy overlays
- related axes

---

## 4. Scope

This spec covers:
- BAR → polarity extraction
- polarity normalization
- library matching / merge flow
- player confirmation prompts
- admin curation interfaces
- polarity-driven quest hooks

This spec does **not** fully define:
- final quest generator logic
- full campaign interview engine
- vibeulon minting rules
- full emotional alchemy engine
- final recommender ranking model

It does, however, define the hooks required for all of them.

---

## 5. Core Data Model

## 5.1 BAR

```yaml
BAR:
  id: string
  raw_text: string
  front_text: string?
  back_text: string?
  image_refs: string[]

  source_context:
    player_id: string?
    campaign_id: string?
    encounter_id: string?
    created_at: datetime?
    ingestion_mode: enum(manual, image_parse, imported, generated)

  metadata:
    title: string?
    notes: string?
    language: string?
    confidence: float?
```

Notes:
- A one-sided BAR may still carry a usable polarity vector.
- A two-sided BAR may explicitly encode a tension, inversion, or reframe.
- Keep raw text intact even after normalization.

---

## 5.2 Polarity Extraction

```yaml
PolarityExtraction:
  id: string
  bar_id: string

  interpretation:
    summary: string
    surface_read: string?
    deeper_read: string?

  primary_axis:
    left: string
    right: string
    axis_name: string?
    axis_gloss: string?

  type: enum(
    binary_axis,
    developmental_axis,
    operational_axis,
    relational_axis,
    identity_axis,
    cultural_axis,
    epistemic_axis,
    threshold_axis,
    multi_axis
  )

  confidence: float

  secondary_axes:
    - left: string
      right: string
      axis_name: string?

  developmental_gradient:
    - stage: string
      description: string

  move_name: string?

  rationale: string

  hooks:
    emotional_alchemy: []
    quest_generation: []
    social: []
    campaign_intake: []
    recommendation: []

  tags: []
  related_library_entry_ids: []

  provenance:
    extracted_by: enum(ai, admin, player, mixed)
    reviewed_by: string?
    reviewed_at: datetime?
```

---

## 5.3 Polarity Library Entry

```yaml
PolarityLibraryEntry:
  id: string

  canonical_axis:
    left: string
    right: string
    axis_name: string
    axis_gloss: string?

  type: enum(
    binary_axis,
    developmental_axis,
    operational_axis,
    relational_axis,
    identity_axis,
    cultural_axis,
    epistemic_axis,
    threshold_axis,
    multi_axis
  )

  description: string

  recurring_signals: []
  related_axes: []

  opposite_failure_modes:
    left_shadow: []
    right_shadow: []

  developmental_path:
    - stage: string
      description: string

  emotional_alchemy_links: []
  quest_patterns: []
  intake_prompts: []
  example_bars: []
  example_bar_ids: []

  synonyms:
    left: []
    right: []

  tags: []

  stats:
    times_matched: integer
    times_confirmed: integer
    times_rejected: integer
```

---

## 5.4 Player Polarity Position (future-facing but worth storing now)

```yaml
PlayerPolarityPosition:
  id: string
  player_id: string
  library_entry_id: string

  current_position:
    leaning: enum(left, right, middle, oscillating, unclear)
    note: string?

  recent_examples:
    - bar_id: string
      direction: enum(left, right, mixed)

  updated_at: datetime
```

This object is optional in v2, but the schema should anticipate it.

---

## 6. Polarity Types

## 6.1 binary_axis
A relatively stable opposition or tension.

Examples:
- Private Meaning ↔ Shared Meaning
- Consensus ↔ Discovery
- Vibe ↔ Function

Use when:
- both poles are clearly present
- the BAR is best understood as a tension between two viable positions

---

## 6.2 developmental_axis
A gradient where one side matures into, metabolizes into, or converts toward the other.

Examples:
- Capacity ↔ Graciousness
- Holding Pain ↔ Dancing With Pain
- Potential Love ↔ Active Love

Use when:
- the BAR is not asking for “balance”
- the tension behaves more like growth than choice

---

## 6.3 operational_axis
A tension governing action, intervention, or strategic movement.

Examples:
- Remediation ↔ Communication
- Being Moved ↔ Moving the Field
- Default ↔ Spellcasting

Use when:
- the BAR primarily changes how action is taken

---

## 6.4 relational_axis
A polarity about intimacy, signaling, witness, or social positioning.

Examples:
- Indirect Desire ↔ Direct Desire
- Self-Witnessing ↔ Co-Witnessing
- Caring About ↔ Caring For

Use when:
- the BAR primarily governs interpersonal movement

---

## 6.5 identity_axis
A polarity about role, persona, selfhood, naming, or identity mutation.

Examples:
- Identity as Truth ↔ Identity as Tool
- Self-Defined ↔ Socially Assigned
- Fixed Identity ↔ Fluid Identity

Use when:
- the BAR acts as a self-construction or self-translation mechanic

---

## 6.6 cultural_axis
A polarity carried by group norms, memory, taboo, membership, or social immunity.

Examples:
- Expression ↔ Boundaries
- Flavor ↔ Survival
- Inclusion ↔ Protection

Use when:
- the BAR speaks in “we,” signal codes, or cultural memory structures

---

## 6.7 epistemic_axis
A polarity about seeing, knowing, discovering, interpreting, or revealing.

Examples:
- Description ↔ Revelation
- Map ↔ Perception
- What is already known ↔ What has not yet been seen

Use when:
- the tension is primarily about how reality is perceived or known

---

## 6.8 threshold_axis
A polarity about endings, passage, initiation, transformation, or crossing between states.

Examples:
- End ↔ Passage
- Rupture ↔ Transition
- Power ↔ Preparedness

Use when:
- the BAR marks a crossing, edge, death, rebirth, or initiation

---

## 6.9 multi_axis
The BAR carries multiple irreducible tensions and should not yet be collapsed to one.

Example:
- Red Green Color Blind Pride Puzzle

Use when:
- flattening would destroy meaning
- several axes are equally active and useful
- the BAR is genuinely a prism, not a line

---

## 7. Extraction Workflow

## 7.1 Input
Inputs may include:
- raw handwritten or typed BAR
- front and back text
- player clarification
- surrounding conversation
- campaign context
- known prior polarities

---

## 7.2 Structural Parse
Classify the BAR’s surface form:
- phrase
- joke
- metaphor
- title
- question
- archetype reference
- split phrase
- list
- paradox
- instruction
- fragment
- socially coded statement

This is not the final type, only the surface wrapper.

---

## 7.3 Lived Interpretation
Before extracting an axis, summarize the BAR in lived language.

Questions:
- What is this BAR actually *doing*?
- What kind of situation or tension does it point to?
- What social/emotional/cognitive move is hidden inside it?

This step prevents dead formalism.

---

## 7.4 Generate Candidate Axes
Produce up to 3 candidate axes:
1. literal axis
2. deeper interpretive axis
3. system-native axis

Example:

```yaml
BAR: "Nice spellbook what time does it open?"

literal_axis:
  left: mysticism
  right: scheduling

deeper_axis:
  left: aesthetic fascination
  right: operational access

system_native_axis:
  left: vibe
  right: function
```

---

## 7.5 Select Primary Axis
Choose the axis that is:
- most reusable
- most alive
- most likely to power quests or insight
- least morally flattening
- most faithful to the BAR’s actual charge

---

## 7.6 Normalize
Convert the winning axis into canonical, reusable language.

Good normalization:
- Caring About ↔ Caring For
- Identity as Truth ↔ Identity as Tool
- Being Moved ↔ Moving the Field

Bad normalization:
- Good ↔ Bad
- Healthy ↔ Unhealthy
- Real ↔ Fake

---

## 7.7 Classify Type
Assign polarity type.

---

## 7.8 Attach Hooks
Attach any available:
- quest hooks
- emotional alchemy links
- social hooks
- intake prompts
- library tags

---

## 7.9 Match or Create Library Entry
Search for similar canonical entries.

If match confidence is high:
- attach BAR as example
- enrich stats / synonyms / examples

If match is weak:
- create candidate library entry

---

## 8. Extraction Heuristics

## 8.1 Interpret before compress
Always explain the BAR in lived language before reducing it to an axis.

Bad:
```yaml
axis: authenticity ↔ performance
```

Better:
```yaml
This BAR is about how identity gets worn, amplified, and seen.
axis: Identity as Truth ↔ Identity as Tool
```

---

## 8.2 Preserve humor as signal
Absurdity, jokes, slang, and cultural wit often carry the real payload.

Do not strip these too early.

Examples:
- Grim no Reaper
- Nice spellbook what time does it open
- ass shaking elves know me as…

These are not noise. They are compressed truth.

---

## 8.3 Distinguish binary from gradient
Some BARs are about balance.  
Others are about maturation.

Example:
- Capacity ↔ Graciousness should be developmental_axis, not simple binary_axis.

---

## 8.4 Preserve cultural specificity
Do not over-universalize culturally encoded BARs.

Example:
- “we use seasoning” and “ain’t no Black Donner Party” should retain their group-encoded meaning even when normalized into a reusable cultural axis.

---

## 8.5 Use system-native language when it earns it
When possible, name axes in a way that supports future gameplay.

Examples:
- Subject ↔ Operator
- Witness ↔ Participant
- Stored Care ↔ Expressed Care

---

## 8.6 Allow multi-axis ambiguity
If a BAR genuinely carries multiple productive readings, mark it multi_axis and preserve the secondary axes.

---

## 8.7 Prefer actionable clarity over theoretical elegance
The axis should be useful, not just impressive.

---

## 9. Library Construction Rules

## 9.1 Canonicalize recurring structures
Different BARs may collapse into the same deeper axis.

Example cluster:
- “When is your love and compassion gonna grow arms and legs”
- “BARs are player generated leverage”
- “love in rehearsal” type BARs

Canonical entry:
```yaml
left: Caring About
right: Caring For
axis_name: Witness ↔ Participant
```

---

## 9.2 Keep multiple original examples
Each canonical entry should retain multiple examples to preserve range and teach the engine how the axis manifests.

---

## 9.3 Expand synonyms
Store synonymous or adjacent language for each pole.

Example:
```yaml
left:
  - indirect desire
  - hinting
  - signaling
right:
  - direct desire
  - naming
  - owning
```

---

## 9.4 Cross-link related axes
Example:
- Caring About ↔ Caring For
- Potential Love ↔ Active Love
- Witness ↔ Participant

These may be sibling or parent/child entries.

---

## 9.5 Track acceptance / rejection
If admins or players repeatedly reject a proposed mapping, the entry needs refinement.

---

## 10. Seed Canonical Library Entries

The following are strong canonical seeds derived from previously surfaced BARs.

## 10.1 Witness ↔ Participant

```yaml
left: Caring About
right: Caring For
axis_name: Witness vs Participant
type: relational_axis
```

Description:
Care as feeling versus care as enacted behavior.

Examples:
- “When is your love and compassion gonna grow arms and legs”
- compassion becoming embodied

---

## 10.2 Subject ↔ Operator

```yaml
left: Being Moved
right: Moving the Field
axis_name: Subject vs Operator
type: operational_axis
```

Description:
The tension between being shaped by events and acting as an interventionist within them.

Examples:
- Destiny Swap
- Accidental ↔ Voodoo

---

## 10.3 Solitude ↔ Relationship

```yaml
left: What I write for myself
right: What I write for us
axis_name: Solitude vs Relationship
type: relational_axis
```

Description:
The shift from private meaning-making to co-witnessed meaning.

Examples:
- Shared Journaling

---

## 10.4 Transformation ↔ Identification

```yaml
left: I suffer and transform
right: I suffer and become known for it
axis_name: Transformation vs Identification
type: developmental_axis
```

Description:
Whether suffering becomes alchemy or identity capital.

Examples:
- Humanist Christ figures as gold medalists in the trauma Olympics

---

## 10.5 Description ↔ Revelation

```yaml
left: Naming
right: Seeing Through
axis_name: Description vs Revelation
type: epistemic_axis
```

Description:
The difference between organizing what is visible and perceiving what the surface conceals.

Examples:
- X-Ray something Martha Stewart doesn’t know

---

## 10.6 Identity as Truth ↔ Identity as Tool

```yaml
left: Identity as Truth
right: Identity as Tool
axis_name: Self as Fact vs Self as Instrument
type: identity_axis
```

Description:
Whether identity is treated as fixed essence or adaptive instrument.

Examples:
- Theater Makeup — Book / Baddie / Tameka

---

## 10.7 End ↔ Passage

```yaml
left: Death as rupture
right: Death as transition
axis_name: End vs Passage
type: threshold_axis
```

Description:
Whether endings are treated as collapse or threshold.

Examples:
- Grim no Reaper + barbershop quartet @ funerals

---

## 10.8 Expression ↔ Boundaries

```yaml
left: We share flavor
right: We don’t cross certain lines
axis_name: Expression vs Boundaries
type: cultural_axis
```

Description:
How culture simultaneously attracts and protects.

Examples:
- “we use seasoning”
- “ain’t no Black Donner Party”

---

## 10.9 Potential Care ↔ Active Care

```yaml
left: Potential Energy of Love
right: Kinetic Energy of Love
axis_name: Stored Care vs Expressed Care
type: developmental_axis
```

Description:
Care as latent feeling versus care as embodied movement.

Examples:
- compassion growing arms and legs

---

## 10.10 Consensus ↔ Discovery

```yaml
left: What is already known
right: What has not yet been seen
axis_name: Consensus vs Discovery
type: epistemic_axis
```

Description:
The edge between accepted expertise and reality that remains unnoticed.

Examples:
- Martha Stewart X-Ray BAR

---

## 10.11 Holding Pain ↔ Dancing With Pain

```yaml
left: Holding Pain
right: Dancing With Pain
axis_name: Containment vs Transmutation
type: developmental_axis
```

Description:
Pain as something endured versus pain as something alchemized.

Examples:
- Capacity
- Graciousness

---

## 10.12 Private Signal ↔ Shared Signal

```yaml
left: Inner Signal
right: Socially Legible Signal
axis_name: Inner World vs Shared World
type: relational_axis
```

Description:
When an inner reality becomes socially visible and therefore transformed.

Examples:
- Shared Journaling
- Nerdy Flirting

---

## 11. Quest Generation Hooks

Each library entry should expose a reusable quest pattern surface.

## 11.1 Reflection Quest
Prompt the player to locate themselves on the axis.

Example:
- Where are you currently sitting: Caring About or Caring For?

## 11.2 Translation Quest
Move from one side toward the other in a concrete context.

Example:
- Give your compassion arms and legs today.

## 11.3 Recognition Quest
Spot the axis in another person, scene, or system.

Example:
- Find one place culture expresses flavor and one place it draws a survival boundary.

## 11.4 Metabolization Quest
Transform the emotional charge tied to one side.

Example:
- Take one pain you are merely holding and find one way to dance with it.

## 11.5 Artifact Quest
Create a new BAR that exemplifies or evolves the polarity.

---

## 12. Emotional Alchemy Hooks

Each polarity may optionally map into Emotional Alchemy.

This is advisory, not mandatory.

### Example 1
```yaml
axis: Holding Pain ↔ Dancing With Pain
hooks:
  - sadness → poignance
  - neutrality → containment
  - joy → metabolized play
```

### Example 2
```yaml
axis: Remediation ↔ Communication
hooks:
  - anger → corrective impulse
  - earth → pause / hold
  - joy or water → relational truth
```

### Example 3
```yaml
axis: Witness ↔ Participant
hooks:
  - sadness → empathy
  - fire → action
  - wood → embodied care
```

---

## 13. Admin UX

## 13.1 Review Pane
When an admin clicks a BAR, show:
- raw BAR text
- images
- live interpretation
- candidate axes
- selected primary axis
- polarity type
- confidence
- similar library entries
- editable rationale
- add / merge / reject actions

## 13.2 Merge Flow
Admin can:
- attach BAR to existing canonical entry
- create new entry
- store as multi-axis
- flag for future review

## 13.3 Curation Actions
- confirm axis
- edit left / right labels
- rename axis
- change type
- add hooks
- add synonyms
- mark culturally specific
- mark as joke / absurdity preserving

---

## 14. Player UX

## 14.1 Lightweight Confirmation
Players should never be forced into ontology labor.

Offer:
- “This BAR seems to hold a tension between X and Y. Does that feel right?”
- options:
  - yes
  - not quite
  - rename it
  - I see something else

## 14.2 Optional Reflection
If player opts in:
- Which side feels more alive right now?
- Does this feel like a balance, a growth edge, or a threshold?

---

## 15. API Sketch

## 15.1 Extract polarity from BAR

```http
POST /api/bars/:barId/extract-polarity
```

Response:
```json
{
  "barId": "bar_123",
  "interpretation": {
    "summary": "This BAR turns private reflection into co-witnessed meaning."
  },
  "primaryAxis": {
    "left": "What I write for myself",
    "right": "What I write for us",
    "axisName": "Solitude vs Relationship"
  },
  "type": "relational_axis",
  "confidence": 0.89,
  "rationale": "The tension lies between solitary meaning-making and shared witness."
}
```

---

## 15.2 Confirm or edit extraction

```http
POST /api/polarities/:extractionId/confirm
POST /api/polarities/:extractionId/edit
```

---

## 15.3 Match against library

```http
POST /api/polarities/:extractionId/match-library
```

---

## 15.4 Create canonical library entry

```http
POST /api/polarity-library
```

---

## 15.5 Browse library

```http
GET /api/polarity-library?type=relational_axis&tag=care
```

---

## 16. Prisma-Oriented Schema Sketch

```prisma
model Bar {
  id            String   @id @default(cuid())
  rawText        String
  frontText      String?
  backText       String?
  imageRefs      Json?
  sourceContext  Json?
  metadata       Json?
  createdAt      DateTime @default(now())

  extractions    PolarityExtraction[]
}

model PolarityExtraction {
  id              String   @id @default(cuid())
  barId            String
  interpretation   Json
  primaryAxis      Json
  type             String
  confidence       Float
  secondaryAxes    Json?
  developmental    Json?
  moveName         String?
  rationale        String
  hooks            Json?
  tags             Json?
  provenance       Json?
  createdAt        DateTime @default(now())

  bar              Bar @relation(fields: [barId], references: [id])

  libraryMatches   PolarityLibraryEntry[] @relation("ExtractionToLibrary")
}

model PolarityLibraryEntry {
  id                String   @id @default(cuid())
  canonicalAxis     Json
  type              String
  description       String
  recurringSignals  Json?
  relatedAxes       Json?
  failureModes      Json?
  developmentalPath Json?
  emotionalHooks    Json?
  questPatterns     Json?
  intakePrompts     Json?
  exampleBars       Json?
  synonyms          Json?
  tags              Json?
  stats             Json?
  createdAt         DateTime @default(now())

  extractions       PolarityExtraction[] @relation("ExtractionToLibrary")
}
```

Note:
- `Json` fields are acceptable for v2 speed.
- Normalize further only after real use patterns stabilize.

---

## 17. Prompt Template for AI Extraction

```text
You are extracting a polarity from a BAR.

Given a raw BAR:

1. Interpret the BAR in lived language.
2. Generate up to 3 candidate axes:
   - literal axis
   - deeper interpretive axis
   - system-native axis
3. Select one primary axis.
4. Classify the polarity type.
5. Explain why this axis is the best fit.
6. Add optional:
   - developmental gradient
   - emotional alchemy hooks
   - quest hooks
   - related library entries
7. Preserve humor, metaphor, taboo, and cultural specificity.
8. Do not moralize the axis.
9. If the BAR is genuinely multi-valent, mark it multi_axis and preserve secondary axes.
10. Prefer language that supports future gameplay.
```

---

## 18. Example Extraction Outputs

## 18.1 Shared Journaling

```yaml
bar: "Shared Journaling"

interpretation:
  summary: |
    This BAR names the threshold where private reflection becomes a relational artifact.
    The act of sharing changes the journal from self-witnessing into co-witnessing.

primary_axis:
  left: What I write for myself
  right: What I write for us
  axis_name: Solitude vs Relationship

type: relational_axis

rationale: |
  The deepest tension is between internal meaning-making and meaning held by more than one mind.

quest_hooks:
  - Share a fragment before it feels polished
  - Notice what changes when your journal becomes legible to another
```

---

## 18.2 Capacity / Graciousness

```yaml
bar: "Capacity / Graciousness"

interpretation:
  summary: |
    This BAR begins with endurance and matures into alchemical enjoyment.
    It describes pain first as something one can survive, then as something one can metabolize.

primary_axis:
  left: Holding Pain
  right: Dancing With Pain
  axis_name: Containment vs Transmutation

type: developmental_axis

developmental_gradient:
  - stage: endure
    description: carry pain without collapse
  - stage: allow
    description: stay open to the charge
  - stage: metabolize
    description: pain becomes signal
  - stage: enjoy
    description: graciousness emerges
```

---

## 18.3 Nerdy Flirting

```yaml
bar: "Nerdy flirting — look at my new journal, it's so skimpy"

interpretation:
  summary: |
    This BAR encodes desire moving through artifact-sharing rather than direct statement.
    It uses nerd-coded objects as a relational bid.

primary_axis:
  left: Indirect Desire
  right: Direct Desire
  axis_name: Hinting vs Owning

type: relational_axis

rationale: |
  The key tension is between safe signaling and explicit desire.
```

---

## 19. Anti-Patterns

Avoid:
- flattening BARs into generic therapy language
- moralizing one pole as good and the other as bad
- stripping humor and absurdity
- forcing binary structure where a gradient is more accurate
- over-normalizing culturally specific BARs
- privileging “clean” interpretations over live ones
- generating axes that sound smart but cannot generate quests

---

## 20. Rollout Plan

## v2.0
- store BARs
- run extraction
- show candidate axes in admin UI
- allow manual merge / create library entry
- browse library

## v2.1
- player confirmation prompts
- stats on matches
- synonym expansion
- quest hook previews

## v2.2
- emotional alchemy overlays
- campaign intake prompts using library
- recommendation hooks
- player polarity positions

---

## 21. Final Thesis

BARs are local artifacts.  
Polarities are reusable engine grammar.

If BARs are the strange, vivid notes players leave behind, then the polarity library becomes:

> the engine’s growing map of the recurring tensions that shape human play, identity, relation, and transformation

This library is not metadata.  
It is the deep structure that makes BARs generative.

It is how local weirdness becomes reusable reality technology.
