# Spec: Twine Authoring IR + Twee Compiler + Mobile Admin UI v0

**Source**: ChatGPT-generated feature request. Integrated per [ANALYSIS.md](./ANALYSIS.md).

## Purpose

Enable mobile-friendly story authoring via a structured Intermediate Representation (IR) that compiles to .twee. Admins edit IR nodes, not raw .twee. The compiler produces valid SugarCube .twee; publish writes to TwineStory or Adventure. Runtime unchanged (parsedJson, Passage API).

**Problem**: Editing raw .twee is error-prone and desktop-centric. Admins need structured, mobile-safe authoring with validation and compile-to-publish.

**Practice**: Deftness Development — IR schema first, compiler before UI, deterministic (no AI). Extend existing models; avoid replacing runtime.

## Design Decisions

| Topic | Decision |
|-------|----------|
| IR format | JSON. TypeScript types: IRNode, IRChoice, IRStory. |
| Node types (v0) | passage, choice_node, informational. Defer option_set, system_action, quest_emit, bar_emit. |
| Storage (v0) | Store IR JSON in existing model (Adventure.irDraft or TwineStory.irDraft). No new story_nodes table. |
| Compile target | .twee (SugarCube). Emits → `<<run emitEvent("x")>>`. |
| Runtime | Unchanged. Publish = compile IR → .twee → parseTwee → update TwineStory.parsedJson or Passages. |
| Validation | validateIrStory(nodes) → { errors, warnings }. Before compile. |
| Mobile admin | Responsive enhancement of existing admin. Touch-friendly forms. |

## Conceptual Model

| WHO | WHAT | WHERE |
|-----|------|-------|
| Admin | Edits IR nodes | /admin/twine/ir or /admin/adventures/[id]/ir |
| System | Compiles IR → .twee | irToTwee(), POST /api/admin/twee/compile |
| System | Validates story | validateIrStory(), POST /api/admin/story/validate |
| Admin | Publishes | Compile → parseTwee → TwineStory/Adventure |
| Player | Plays story | PassageRenderer, CampaignReader (unchanged) |

## IR Schema

### IRNode

```ts
type IRNodeType = 'passage' | 'choice_node' | 'informational'

interface IRChoice {
  text: string
  next_node: string
  tags?: string[]
}

interface IRNode {
  node_id: string
  type: IRNodeType
  title?: string
  body: string | string[]   // prose; array = paragraphs joined by \n\n
  choices?: IRChoice[]
  emits?: string[]
  tags?: string[]
  next_node?: string       // for non-choice nodes
  metadata?: Record<string, unknown>
}
```

### IRStory

```ts
interface IRStory {
  story_metadata?: { title?: string; start_node?: string }
  story_nodes: IRNode[]
}
```

### Example IR Node

```json
{
  "node_id": "intro_03",
  "type": "choice_node",
  "title": "How does this land for you?",
  "body": ["You've arrived while this next chapter is beginning."],
  "choices": [
    { "text": "This sounds exciting.", "next_node": "aligned_response", "tags": ["emotional_branch"] },
    { "text": "I'm curious.", "next_node": "curious_response", "tags": ["emotional_branch"] }
  ],
  "emits": ["campaign_intro_viewed"]
}
```

## API Contracts

### irToTwee (Library)

**Input**: `IRNode[]`, `options?: { title?: string; startNode?: string }`  
**Output**: `string` (valid .twee)

- Generates `:: StoryTitle`, `:: StoryData`, `:: node_id` passages.
- Choices → `[[text|next_node]]`.
- emits → `<<run emitEvent("event_name")>>` at end of passage.
- Deterministic. Reuse questPacketToTwee patterns.

### validateIrStory (Library)

**Input**: `IRNode[]`  
**Output**: `{ errors: string[]; warnings: string[] }`

- Duplicate node_ids.
- Missing link targets (next_node, choices[].next_node not in node_ids).
- Empty node_id.
- Invalid type.
- Unreachable nodes (optional; from start_node).

### POST /api/admin/twee/compile

**Auth**: Admin only.

**Input**: `{ story_nodes: IRNode[]; story_metadata?: { title?: string; start_node?: string } }`

**Output**: `{ twee_file: string; warnings: string[]; errors: string[] }`

- Calls validateIrStory. If errors.length > 0, return errors, no twee.
- Calls irToTwee. Returns twee_file, warnings.
- Round-trip: parseTwee(twee_file) to verify valid.

### POST /api/admin/story/validate

**Auth**: Admin only.

**Input**: `{ story_nodes: IRNode[] }`

**Output**: `{ valid: boolean; errors: string[]; warnings: string[] }`

- Calls validateIrStory. valid = errors.length === 0.

## User Stories

### P1: Admin compiles IR to .twee

**As an admin**, I want to POST IR nodes to /api/admin/twee/compile and receive valid .twee, so I can publish stories without editing raw files.

**Acceptance**: POST with valid IR → 200, twee_file string. POST with invalid IR (missing target) → 200, errors array, no twee_file.

### P2: Admin validates story before compile

**As an admin**, I want to validate IR nodes via POST /api/admin/story/validate, so I catch errors before compiling.

**Acceptance**: Returns errors (duplicate node_id, missing target) and warnings (unreachable). valid = errors.length === 0.

### P3: Admin edits IR in mobile-friendly UI (Phase 2)

**As an admin**, I want to edit nodes in a structured form (title, body, choices, emits) on my phone, so I can author on the go.

**Acceptance**: Story outline lists nodes; node editor has type, body, choices, emits. Compile + Publish buttons. Responsive layout.

## Functional Requirements

### Phase 1: IR Schema + Compiler + APIs

- **FR1**: Define IRNode, IRChoice, IRStory types in src/lib/twine-authoring-ir/types.ts.
- **FR2**: Implement irToTwee(nodes, options) in src/lib/twine-authoring-ir/irToTwee.ts. Emits → `<<run emitEvent("x")>>`.
- **FR3**: Implement validateIrStory(nodes) in src/lib/twine-authoring-ir/validateIrStory.ts.
- **FR4**: POST /api/admin/twee/compile — admin auth, calls validate + irToTwee, returns { twee_file, warnings, errors }.
- **FR5**: POST /api/admin/story/validate — admin auth, returns { valid, errors, warnings }.

### Phase 2: Storage Bridge (Optional for v0)

- **FR6**: Add irDraft (String?, JSON) to Adventure or TwineStory. Store IR when editing. Load on open.
- **FR7**: Publish flow: load irDraft → compile → parseTwee → update TwineStory.parsedJson or upsert Passages.

### Phase 3: Admin UI

- **FR8**: /admin/twine/ir or extend /admin/adventures/[id] with IR tab. Story outline (list nodes).
- **FR9**: IRNodeEditor: type, body, choices (add/remove), emits. Template insert (informational, choice_node).
- **FR10**: Compile button → fetch compile API, show twee preview. Publish button → compile + persist.

### Phase 4: Versioning (Deferred)

- **FR11**: compiled_twee_versions table. On publish, insert. Rollback = load prior version.

## Non-Goals (v0)

- Full Twine graph editor
- .twee round-trip (twee → IR import)
- story_nodes, story_edges tables
- option_set, system_action, quest_emit, bar_emit node types
- Multiplayer editing
- AI-assisted generation

## Non-Functional Requirements

- Deterministic: no AI in compile or validate.
- Compiler output must parse with parseTwee (round-trip validation).
- Admin-only APIs. Use existing admin auth.

## Verification Quest (Optional)

- **ID**: cert-twine-authoring-ir-v1
- **Steps**: Create IR nodes via API or UI; validate; compile; publish to TwineStory; play story; confirm content matches IR.

## Dependencies

- [admin-onboarding-passage-edit](.specify/specs/admin-onboarding-passage-edit/spec.md) — passage edit patterns
- [quest-grammar-compiler](.specify/specs/quest-grammar-compiler/) — questPacketToTwee patterns
- parseTwee, twine-parser — existing

## References

- [ANALYSIS.md](./ANALYSIS.md)
- [src/lib/twee-parser.ts](../../src/lib/twee-parser.ts)
- [src/lib/quest-grammar/questPacketToTwee.ts](../../src/lib/quest-grammar/questPacketToTwee.ts)
- [src/lib/twee-to-flow/translateTweeToFlow.ts](../../src/lib/twee-to-flow/translateTweeToFlow.ts)
