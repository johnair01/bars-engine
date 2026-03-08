# Plan: Twine Authoring IR + Twee Compiler + Mobile Admin UI v0

## Summary

Add a structured IR for story authoring, compile IR → .twee, validate before compile, expose APIs. Admin UI edits IR. Publish writes to TwineStory or Adventure. No runtime changes. Compiler-first; UI iterative.

## Phases

### Phase 1: IR Schema + Compiler + APIs (No New Tables)

1. **Types** — Create src/lib/twine-authoring-ir/types.ts with IRNode, IRChoice, IRStory.
2. **Compiler** — Create src/lib/twine-authoring-ir/irToTwee.ts. Reuse questPacketToTwee patterns. Emits → `<<run emitEvent("x")>>`.
3. **Validator** — Create src/lib/twine-authoring-ir/validateIrStory.ts. Check: duplicate node_ids, missing targets, empty node_id, invalid type.
4. **Compile API** — POST /api/admin/twee/compile. Auth: admin. Input: story_nodes, story_metadata. Output: twee_file, warnings, errors. Validate first; if errors, return errors only.
5. **Validate API** — POST /api/admin/story/validate. Auth: admin. Input: story_nodes. Output: valid, errors, warnings.

### Phase 2: Storage Bridge (Minimal)

6. **irDraft column** — Add Adventure.irDraft String? (JSON) or TwineStory.irDraft String?. Optional for v0.
7. **Publish flow** — Server action: load irDraft → irToTwee → parseTwee → update TwineStory.parsedJson or upsert Passages. Reuse existing update paths.

### Phase 3: Admin UI

8. **IR authoring page** — /admin/twine/ir or tab on /admin/adventures/[id]. List nodes. Add/edit/delete nodes.
9. **IRNodeEditor** — Form: type (passage, choice_node, informational), body (textarea), choices (dynamic list: text, next_node), emits (comma-separated or tag input). Template insert.
10. **Compile + Publish** — Compile button: call API, show twee preview in modal/collapsible. Publish: compile + persist to TwineStory/Adventure.

### Phase 4: Versioning (Deferred)

11. **compiled_twee_versions** — New table. On publish, insert. Rollback UI later.

## File Impacts

| File | Action |
|------|--------|
| src/lib/twine-authoring-ir/types.ts | Create |
| src/lib/twine-authoring-ir/irToTwee.ts | Create |
| src/lib/twine-authoring-ir/validateIrStory.ts | Create |
| src/lib/twine-authoring-ir/index.ts | Create (exports) |
| src/app/api/admin/twee/compile/route.ts | Create |
| src/app/api/admin/story/validate/route.ts | Create |
| prisma/schema.prisma | Optional: Adventure.irDraft or TwineStory.irDraft |
| src/app/admin/twine/ir/page.tsx | Create (Phase 3) |
| src/components/admin/IRNodeEditor.tsx | Create (Phase 3) |

## Compiler Logic (irToTwee)

```
1. Build node_id set
2. Emit :: StoryTitle, :: StoryData (start, format)
3. For each node:
   - bodyText = Array.isArray(body) ? body.join('\n\n') : body
   - links = choices?.map(c => `[[${c.text}|${c.next_node}]]`).join('\n') ?? ''
   - emitsBlock = emits?.map(e => `<<run emitEvent("${e}")>>`).join('\n') ?? ''
   - passage = bodyText + (links ? '\n\n' + links : '') + (emitsBlock ? '\n\n' + emitsBlock : '')
   - Emit :: node_id \n passage
4. For external targets (next_node not in nodes), emit stub :: node_id \n [End — node_id]
```

## Validation Logic (validateIrStory)

```
errors = []
warnings = []
nodeIds = new Set(nodes.map(n => n.node_id))
allTargets = new Set()

for each node:
  if !node.node_id or node.node_id.trim() === '' → errors.push('Empty node_id')
  if nodeIds.has(node.node_id) (duplicate) → errors.push('Duplicate node_id')
  for each choice.next_node: allTargets.add(next_node)
  if node.next_node: allTargets.add(next_node)

for each target in allTargets:
  if !nodeIds.has(target): errors.push(`Missing target: ${target}`)

return { errors, warnings }
```

## Dependencies

- parseTwee (round-trip check)
- questPacketToTwee (patterns)
- Admin auth (existing)
