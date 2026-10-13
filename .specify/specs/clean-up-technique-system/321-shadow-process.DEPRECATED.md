# 321-shadow-process.json is deprecated (2026-10-10)

Board steer (cave-321-not-breath-count, Wendell): explore how the file is used and deprecate it if it has diverged.

## What was found

- `321-shadow-process.json` is a Twine-style CYOA fixture written for the clean-up technique system
  (`spec.md`, Definition of Done: "First three technique content sets"). It arrived in #202 as a spec asset.
- Nothing loads it. No file in `src/`, `packages/`, `scripts/` or `prisma/` reads the file or the id
  `tech-321-shadow-process`. Mentions elsewhere are spec prose, backlog prompts and the wiki route
  `/wiki/321-shadow-process`, which is a separate page that already describes the real 3-2-1.
- It has diverged. The file runs a breath count (feel it for three breaths, imagine it leaving, one breath of
  arrival) and the player never speaks as "you" or "I". The game's 3-2-1 is `Clean321Flow`
  (`src/components/clean321/`, launched from the NOW page): 3 face it in the third person, 2 talk to it in the
  second person with two voices, 1 be it in the first person speaking as the block, with charge sliders before and
  after and `completeClean321` writing the BAR and rewards.

## What changed

- The JSON carries a `deprecated` key pointing here and at `Clean321Flow`. Its content is untouched, so the
  other technique fixtures in this folder still sit beside it as before.
- No code changed. The `/shadow/321` links, the wiki page and `Clean321Flow` are not touched, and neither is
  the Cave 3-2-1 chat port.

## Left for a later pass

- `spec.md` still lists 321 as one of the first three technique content sets. When the technique system is
  built, the 321 entry should point at `Clean321Flow` as its content and drop this file.
