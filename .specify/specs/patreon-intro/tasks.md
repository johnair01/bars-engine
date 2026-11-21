# Tasks: Patreon intro video

## Before the build

- [x] T001 [claude] FR-001 Run the falsification test in spec.md and record the result (falsify.md in the round folder).

## Build

- [ ] T002 [claude] FR-001 FR-002 FR-006 Record the walk from the land with `make/record.js`; write beats.json.
- [ ] T003 [claude] FR-003 FR-004 FR-005 Cut the Game-led and You-led versions with `make/cut.sh`, silent, end card with the four doors.
- [ ] T004 [claude] FR-007 Commit the recorder, engine, cut and check in the round folder.

## Steps only Wendell can take

- [ ] T005 [wendell] FR-003 **Do:** score the intro's two cuts
  **Where:** the shared Patreon pick page linked in the thread
  **Enter:** a channel, state and intensity per moment, and which dial setting
  **Check:** the page shows your score saved
  **Device:** phone | computer · **Safe to stop after:** yes

proof: the two cuts on the shared Patreon pick page

## Verify and ship

- [ ] T006 [claude] FR-001 `python3 council/tools/contract_check.py` on this folder exits 0.
