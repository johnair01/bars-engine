# Tasks: [Feature name]

<!-- Every task is numbered (T001), names the requirement it serves (FR-001), and is tagged [claude] or [wendell];
     [P] marks a task that can run beside the one before it. A [wendell] task passes the step test in
     council/pipeline.yaml: only he can take it. Each one carries the full step shape and is published to
     the steps page as one list for this feature before any build that depends on it. -->

## Before the build

- [ ] T001 [claude] Run the falsification test in spec.md and record the result here.

## Steps only Wendell can take

- [ ] T002 [wendell] FR-001 **Do:** [one action, starting with a verb]
  **Where:** [page, menu path or link]
  **Enter:** [what to type or choose; never a secret]
  **Check:** [what he will see when it worked]
  **Device:** phone | computer · **Safe to stop after:** yes | no

## Build

- [ ] T003 [claude] FR-001 [task]
- [ ] T004 [claude] The repo's checks pass; the preview builds.

proof: [the still on the board, or preview: the one-click link opened at the state to test]

## Verify and ship

- [ ] T005 [claude] `python3 council/tools/contract_check.py` on this folder exits 0.
- [ ] T006 [claude] Definition of done in spec.md, checked.
- [ ] T007 [claude] Board position: merges on the next board read unless flipped.
- [ ] T008 [claude] Ledger record written; this file ticked.
