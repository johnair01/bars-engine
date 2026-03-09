# Tasks: Twine Authoring IR + Twee Compiler + Mobile Admin UI v0

## Phase 1: IR Schema + Compiler + APIs

- [x] Create src/lib/twine-authoring-ir/types.ts (IRNode, IRChoice, IRStory)
- [x] Create src/lib/twine-authoring-ir/irToTwee.ts
- [x] Create src/lib/twine-authoring-ir/validateIrStory.ts
- [x] Create src/lib/twine-authoring-ir/index.ts (exports)
- [x] Create POST /api/admin/twee/compile route
- [x] Create POST /api/admin/story/validate route
- [x] Add tests for irToTwee and validateIrStory
- [x] Run npm run build and npm run check

## Phase 2: Storage Bridge (Optional)

- [x] Add irDraft column to Adventure or TwineStory (if needed)
- [x] Implement publish flow: irDraft → compile → parseTwee → persist

## Phase 3: Admin UI

- [x] Create /admin/twine/ir page (or IR tab on adventures)
- [x] Create IRNodeEditor component (type, body, choices, emits)
- [x] Add template insert (informational, choice_node)
- [x] Add Compile button (preview twee)
- [x] Add Publish button (compile + persist)
- [x] Responsive / mobile-friendly layout

## Phase 4: Versioning (Deferred)

- [x] Add compiled_twee_versions table
- [x] Insert version on publish
- [x] Rollback UI
