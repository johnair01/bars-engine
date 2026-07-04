# Implementation Plan

## Phase 1: Public Quiz Slice

- Add canonical myth/item data and a deterministic scorer in `src/lib/mastering-allyship`.
- Add focused scorer tests.
- Add a client quiz component under `src/app/mastering-allyship/myths-read`.
- Add a public route page with metadata.

## Phase 2: Verification

- Run the focused scorer test.
- Run route validation or type checking where feasible.

## Phase 3: Follow-up

- Apply the `myth_reads` migration in shared environments.
- Wire the Chapter 0 manuscript/page pointer to this route once its source location is confirmed.
- Replace the generic seeded BAR redirect with exact single-player campaign scene routes once confirmed.
