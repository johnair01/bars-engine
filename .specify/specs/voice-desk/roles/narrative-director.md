# Narrative director: what the desk itself may say

Role: narrative-director (ccgs-roles, council/toolbox.yaml), 2026-11-17.

**The desk is held to its own rule.** Every word on the desk screen names something drawn on it: slip, tray, stone,
book, bench, hatch, seal, chalk. Each of those is an object he can see before its name appears. The desk's own screen is
entry `admin/voice-desk` in `screens.yaml`, and its strings run through `copy-scan --strict` and `--lexicon` like any
player screen.

**The apprentice speaks only in stops.** It reads the slip's line as written and pauses; it does not comment, praise or
explain. Its one line of its own is the stop's `why`, which is the gate's plain reason ("No screen before this one shows
a ribbon."), never an AI sentence.

**The close names places, never numbers.** "Tap the Vein's ribbon screen got two new lines." is the shape; "You kept 2
of 5" is not allowed (FR-027).

**Proposed lines are proposals.** Every line in the spec's desk beats is a draft for step 6. Step 6 runs each through
`copy-scan --ask`, writes its "what, specifically?" answer beside it, and lists them in the look row, where he can use
the pencil on them.

**Face names.** Under vf-face-names-1 B, the desk may say "Shaman" only after it has said what the Shaman does in plain
words on the same screen; the desk never needs a face name, so it uses none.
