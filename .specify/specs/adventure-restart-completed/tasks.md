# Tasks: Restart Completed Adventures

## Phase 1: Restart on Adventures Page

- [x] **1.1** Create `AdventureRestartButton` client component (or inline in page): accepts `questId`, `storyId`, calls `restoreCertificationQuest`, on success navigates to `/adventures/${storyId}/play?questId=${questId}`.
- [x] **1.2** Adventures page: for `isCertCompleted` and `isAdmin`, render Restart button instead of Market link. For non-admin, keep Market link.
- [x] **1.3** Add loading state and error handling to Restart flow.

## Verification

- [ ] **V1** As admin, complete cert-quest-grammar-v1, return to Adventures, click Restart → lands on play page at START.
- [ ] **V2** As non-admin (if applicable), completed cert still links to Market.
- [ ] **V3** Restart fails gracefully (e.g. network error) with user-visible error.
