# Tasks: Cave studio

## Before the build

- [x] [claude] Run the falsification test in spec.md and record the result here.
  Result 2026-10-12: passed. `build_figure.py` and `build_kit.py` ran in the cloud (bpy 5.2.2, Python 3.13) in about 6
  seconds and reproduced `figure.glb`, `cave-kit.glb` and `spots.json` byte for byte.
- [x] [claude] Read Wendell's answers to `cs-chatgpt-ai-art`, `cs-first-piece` and `cs-asset-kind` from the board, and record them in request.md.
  Done 2026-10-12: concept only, chamber dressing, pictures to build from; `cs-cc0-or-own` overruled (request.md, Round 1).

## Steps only Wendell can take

- [ ] [wendell] **Do:** Make a Google Drive folder for the cave studio and put one ChatGPT-made asset in it.
  **Where:** drive.google.com, signed in as the account the Drive connector uses
  **Enter:** the folder name `Cave studio inbox`; any one file you have made in ChatGPT for the cave
  **Check:** the file appears in the folder, and the next session lists it
  **Device:** computer · **Safe to stop after:** yes · **Due:** 2026-10-19
- [x] [wendell] **Do:** (optional) Check whether Blendkit search works without a key from your own machine.
  Done 2026-10-12, his note: "works". Blendkit search answers without a key from his Mac.
  **Where:** a terminal on your computer, outside the cloud container
  **Enter:** `curl -s "https://api.blenderkit.com/api/v1/search/?query=chair&page_size=1" | head -c 300`
  **Check:** JSON starting with `{"count":` means it works unauthenticated; an error message means a key is needed
  **Device:** computer · **Safe to stop after:** yes · **Due:** 2026-10-19

## Build

- [x] [claude] Manifest row shape for a piece built from a picture: `dressing[]` on `cave.kit` names the picture each
  piece was `built_from`, how, and its `outline_match`. No ChatGPT pixels ship (`cs-chatgpt-ai-art`), so `made_with`
  is not needed; the picture row (`cave.pictures`) carries `ships: false`.
- [x] [claude] The picture-to-model tool, `tools/blender-cloud/from_picture.py`: reads the outline, builds by lathe
  or by inflate (metaballs), fits a face budget, scores the outline match, renders front and three-quarter views.
- [x] [claude] The first piece: chamber dressing (stone_spire 0.987, glow_cap 0.974, root_curl 0.89 outline match),
  built from stand-in pictures in `content/ontology-game/cave/pictures/` by `build_kit.py` into `cave-kit.glb`
  (17 KB to 47 KB of 3 MB). `cave.js` dresses every chamber with it; an older kit leaves the chamber bare.
- [x] [claude] `cave-test.mjs` checks the kit carries the pieces and the chamber is dressed: 126 of 126 pass at 390 by 844.
- [x] [claude] Comparison page for Wendell: https://claude.ai/artifact/568K2pwc7Lz5X9Kyftbzza

## Next

- [ ] [wendell] Look at the comparison page and say whether the models are close enough to trust (board step).
- [ ] [wendell] The Drive step above, with the prompt on the comparison page: one ChatGPT picture in `Cave studio inbox`.
- [ ] [claude] Build his first picture with `from_picture.py`, add it as a `DRESSING` row in `build_kit.py`, show it.

## Verify and ship

- [ ] [claude] Definition of done in spec.md, checked.
- [ ] [claude] Board position: merges on the next board read unless flipped.
- [ ] [claude] Ledger record written; this file ticked.
