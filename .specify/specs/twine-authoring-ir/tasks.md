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

- [ ] Add irDraft column to Adventure or TwineStory (if needed)
- [ ] Implement publish flow: irDraft → compile → parseTwee → persist

## Phase 3: Admin UI

- [ ] Create /admin/twine/ir page (or IR tab on adventures)
- [ ] Create IRNodeEditor component (type, body, choices, emits)
- [ ] Add template insert (informational, choice_node)
- [ ] Add Compile button (preview twee)
- [ ] Add Publish button (compile + persist)
- [ ] Responsive / mobile-friendly layout

## Phase 4: Versioning (Deferred)

- [ ] Add compiled_twee_versions table
- [ ] Insert version on publish
- [ ] Rollback UI
