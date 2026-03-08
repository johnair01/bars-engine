# Tasks: Admin Onboarding Graph View

## Phase 1: Graph rendering

- [x] Replace buildOrderedNodes with buildFlowGraph (LinearNode + ChoiceGroup)
- [x] Render LinearNode as single row
- [x] Render ChoiceGroup: parent, indented branches, convergence node
- [x] Preserve timeline visual (dots, line)

## Phase 2: Actionable links

- [x] Add "Play draft" link to /campaign/twine
- [x] Add "View API" link to flow API URL
- [x] Style links in header to match Edit Thread / Config

## Phase 3: Verification

- [x] Update cert quest or add graph-view verification step
- [x] npm run build and npm run check pass
