# Analysis: Twine Authoring IR + Twee Compiler + Mobile Admin UI v0

**Source**: ChatGPT-generated spec kit feature request. This analysis maps the proposal to the BARS Engine codebase and assesses feasibility for deft integration.

---

## What They're Pitching

1. **IR (Intermediate Representation)** — JSON/YAML schema for story nodes (passage, choice_node, option_set, system_action, quest_emit, bar_emit) with fields: node_id, type, title, body, choices, emits, tags, metadata.

2. **Twee Compiler** — IR → .twee. Compile emits into SugarCube macros (e.g. `<<run emitEvent("campaign_intro_viewed")>>`).

3. **Story Validation** — Detect missing targets, duplicate node_ids, invalid emissions, unreachable nodes.

4. **Mobile Admin UI** — Story outline, node editor, template library, flow preview, compile + publish. Edit IR only, never raw .twee.

5. **Storage** — story_nodes, story_edges, story_templates, compiled_twee_versions.

6. **Versioning** — Every compile produces a version; rollback support.

---

## Current BARS Engine Architecture

### Story Authoring Flows (Today)

| Flow | Storage | Authoring | Runtime |
|------|---------|-----------|---------|
| **TwineStory** (quests, certs) | TwineStory.parsedJson, sourceText | HTML upload, Stitcher wizard, seed scripts | PassageRenderer, parsedJson |
| **Adventure + Passage** (campaign) | Adventure, Passage | Admin passages CRUD | /api/adventures/[slug]/[nodeId] |
| **Onboarding draft** | .twee file on disk | PATCH /api/admin/onboarding/draft/passages/:id | CampaignReader (twee) or TwineStory |
| **Quest Grammar** | QuestPacket (ephemeral) | Unpacking form → compileQuest | questPacketToTwee → Adventure |
| **MicroTwine** | MicroTwineModule (canonicalJson, tweeSource) | MicroTwineWizard form | compileMicroTwine → htmlArtifact |

### Key Existing Pieces

| Component | Location | Purpose |
|-----------|----------|---------|
| parseTwee | src/lib/twee-parser.ts | .twee → ParsedTwineStory |
| parseTwineHtml | src/lib/twine-parser.ts | Twine HTML → parsedJson |
| questPacketToTwee | src/lib/quest-grammar/questPacketToTwee.ts | QuestPacket → .twee (nodes, links, StoryData) |
| translateTweeToFlow | src/lib/twee-to-flow/translateTweeToFlow.ts | .twee → Flow JSON; extracts emits from tags |
| TwineBinding | prisma | Links passage names to system actions |
| Passage | prisma | nodeId, text, choices (JSON), metadata |
| Admin passage edit | /admin/onboarding, PassageEditModal | Per-passage PATCH on .twee file |
| StitcherWizard | /admin/twine/stitcher | createStitchedStory, updatePassage → parsedJson |

### Emits / Bindings Today

- **twee-to-flow**: `emits:nation_selected bar_created` in passage tags → FlowAction.emits
- **TwineBinding**: storyId + scopeType/scopeId + actionType + payload. Executed by `executeBindingsForPassage` in twine.ts
- **Passage.metadata**: JSON for actionType, castIChingTargetId, etc.

---

## Overlap and Gaps

### Strong Overlap

| Spec Proposal | BARS Equivalent | Notes |
|---------------|-----------------|-------|
| IR node types | Passage + metadata; QuestPacket nodes | Passage has text, choices; metadata holds actionType. QuestPacket has nodes + choices. |
| emits | TwineBinding; twee tags `emits:...` | We use bindings (DB) and tag parsing. Spec wants first-class `emits` in IR. |
| Compile to .twee | questPacketToTwee; compileMicroTwine | We compile structured data → .twee. No generic IR→twee. |
| Validate links | parseTwee; translateTweeToFlow | We parse and build flow; no explicit "validate targets" API. |
| Node editor | PassageEditModal; EditPassageForm | We edit passages. Spec wants IR-focused editor. |
| Template library | StitcherWizard (Kotter, Epiphany); MicroTwine moments | We have templates. Spec wants reusable IR templates. |

### Gaps (Spec Has, We Don't)

| Spec Proposal | BARS Gap |
|---------------|----------|
| **Unified IR schema** | We have Passage, QuestPacket, parsedJson — no single canonical IR. |
| **IR → .twee compiler** | questPacketToTwee is QuestPacket-specific. No generic IR→twee. |
| **story_nodes / story_edges tables** | We have Passage (flat). No explicit edges table. |
| **compiled_twee_versions** | No versioning of compiled output. |
| **POST /twee/compile, POST /story/validate** | No such HTTP APIs. |
| **Mobile-first admin** | Admin UI exists but not mobile-optimized. |
| **.twee as canonical runtime** | We use parsedJson (TwineStory) or Passage API. .twee is authoring source for onboarding draft only. |

### We Have, Spec Doesn't Mention

- **TwineBinding** — DB-driven passage→action mapping; more flexible than inline emits.
- **Adventure + Passage** — API-driven campaign nodes; not .twee at runtime.
- **Quest Grammar** — Full unpacking → QuestPacket → Adventure; different pipeline.
- **CampaignReader** — Fetches nodes from API; supports templates, instance content.

---

## Feasibility Assessment

### High Feasibility (Deft Integration)

1. **IR schema as extension of Passage** — Add `emits`, `type` (choice_node, passage, etc.) to Passage or a new StoryNode model. Map to existing Passage.text, Passage.choices, Passage.metadata.

2. **IR → .twee compiler** — New `irToTwee(irNodes)` in src/lib/. Reuse questPacketToTwee patterns (escapeTweeText, choicesToLinks). Add `<<run emitEvent("x")>>` for emits. Deterministic, no AI.

3. **Validation API** — `validateStory(irNodes)` → { errors, warnings }. Check: all link targets exist, no duplicate node_ids, valid emits. Can wrap as POST /api/story/validate.

4. **Compile API** — `compileIrToTwee(irNodes)` → { twee, warnings, errors }. POST /api/twee/compile. Reuse existing parseTwee for round-trip validation.

### Medium Feasibility (Requires Design Choices)

5. **Storage** — Option A: Extend Passage with type, emits. Option B: New story_nodes table (mirrors spec). Option C: Store IR JSON in Adventure or a new StoryDraft model. Recommendation: Extend Passage + metadata for v0; avoid new tables if possible.

6. **Versioning** — Add compiled_twee_versions (story_id, twee_content, created_at, created_by). Requires deciding: version per Adventure? Per TwineStory? Per "story" abstraction?

7. **Mobile admin UI** — Responsive design on existing admin. Story outline = list of Passages. Node editor = enhanced PassageEditModal with type, emits, template picker. No new architecture; polish existing UI.

### Lower Feasibility / Scope Creep

8. **.twee as canonical runtime** — Our runtime is parsedJson (TwineStory) or Passage API. Switching to "load .twee at runtime" would require a new runtime path. Recommendation: Keep current runtime; use .twee as compile target for persistence/versioning, then import into TwineStory.parsedJson or Adventure Passages as today.

9. **quest_emit, bar_emit as first-class node types** — We use TwineBinding and metadata. Adding these as IR types means compiler must emit SugarCube that triggers our backend. We already have executeBindingsForPassage. Need to align "emit" in IR with binding execution.

10. **Template library** — We have Stitcher templates. A formal story_templates table is new. Could start with hardcoded templates (informational, choice_node, option_set) in the UI.

---

## Deft Integration Strategy

### Phase 1: IR Schema + Compiler (No New Tables)

- Define TypeScript types: `IRNode`, `IRChoice`, `IRStory`. Mirror spec's structure.
- Implement `irToTwee(nodes: IRNode[]): string`.
- Implement `validateIrStory(nodes: IRNode[]): { errors, warnings }`.
- Add POST /api/admin/twee/compile (admin only). Input: IR JSON. Output: twee string, warnings, errors.
- **Reuse**: Passage-like structure; questPacketToTwee patterns; parseTwee for validation.

### Phase 2: Bridge to Existing Storage

- **Option A (minimal)**: Store IR JSON in a new column `Adventure.irDraft` or `TwineStory.irDraft`. Compile on publish → update sourceText/parsedJson or Passage rows.
- **Option B (spec-aligned)**: Add story_nodes table. Migration from existing Passages possible. Compiler reads from story_nodes.

### Phase 3: Admin UI Enhancements

- Extend PassageEditModal (or create IRNodeEditor) with: type dropdown, emits field, template insert.
- Story outline: list nodes by cluster (reuse quest cluster concept if any).
- "Compile to .twee" button → call compile API, show result, "Publish" writes to TwineStory or Adventure.

### Phase 4: Versioning (Optional)

- compiled_twee_versions table. On publish, insert row. Rollback = load prior version into TwineStory/Passage.

---

## Recommendations

1. **Adopt IR schema as a schema-first contract** — Define it in .specify, use for compile/validate. Don't require new DB tables for v0; store IR as JSON in existing models.

2. **Compiler first, UI second** — Build irToTwee and validateIrStory. Expose via API. UI can be iterative.

3. **Don't change runtime** — Keep TwineStory.parsedJson and Adventure+Passage as runtime. Compiler output (.twee) is an intermediate artifact; "publish" means: compile IR → .twee → parseTwee → update TwineStory.parsedJson or upsert Passages. Same as today's flow, with IR as the new authoring front-end.

4. **Align emits with TwineBinding** — When compiler emits `<<run emitEvent("nation_selected")>>`, ensure our runtime (PassageRenderer, executeBindingsForPassage) can execute it. We may need a small runtime hook that maps emit names to binding execution. Or: compiler emits SugarCube that our existing binding system understands.

5. **Mobile-first is a UX pass** — Responsive admin, touch-friendly forms. No new architecture.

6. **Defer** — story_edges (derive from choices), story_templates table (use hardcoded), round-trip .twee→IR (future).

---

## Summary

| Aspect | Verdict |
|--------|---------|
| **IR schema** | Feasible. Align with Passage + metadata. |
| **Twee compiler** | Feasible. Reuse questPacketToTwee, parseTwee. |
| **Validation** | Feasible. Deterministic checks. |
| **Storage** | Prefer JSON in existing models over new tables for v0. |
| **Mobile admin** | Feasible as responsive enhancement. |
| **Versioning** | Feasible. New table, simple. |
| **.twee as runtime** | Not recommended. Keep parsedJson/Passage API. |
| **Integration** | Deft: compiler + validate API first; bridge to TwineStory/Adventure; enhance admin UI. |

The spec is well-aligned with our direction. The main adaptation: treat IR as the authoring layer and .twee as a compile target, while keeping our current runtime (parsedJson, Passage API) unchanged. This avoids a risky "replace everything" migration.
