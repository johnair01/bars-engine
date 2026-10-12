# Tasks: Cave studio

## Before the build

- [x] [claude] Run the falsification test in spec.md and record the result here.
  Result 2026-10-12: passed. `build_figure.py` and `build_kit.py` ran in the cloud (bpy 5.2.2, Python 3.13) in about 6
  seconds and reproduced `figure.glb`, `cave-kit.glb` and `spots.json` byte for byte.
- [ ] [claude] Read Wendell's answers to `cs-chatgpt-ai-art`, `cs-first-piece` and `cs-asset-kind` from the board, and record them in request.md.

## Steps only Wendell can take

- [ ] [wendell] **Do:** Make a Google Drive folder for the cave studio and put one ChatGPT-made asset in it.
  **Where:** drive.google.com, signed in as the account the Drive connector uses
  **Enter:** the folder name `Cave studio inbox`; any one file you have made in ChatGPT for the cave
  **Check:** the file appears in the folder, and the next session lists it
  **Device:** computer · **Safe to stop after:** yes · **Due:** 2026-10-19
- [ ] [wendell] **Do:** (optional) Check whether Blendkit search works without a key from your own machine.
  **Where:** a terminal on your computer, outside the cloud container
  **Enter:** `curl -s "https://api.blenderkit.com/api/v1/search/?query=chair&page_size=1" | head -c 300`
  **Check:** JSON starting with `{"count":` means it works unauthenticated; an error message means a key is needed
  **Device:** computer · **Safe to stop after:** yes · **Due:** 2026-10-19

## Build

- [ ] [claude] Write the manifest row shape for a ChatGPT-made piece (`made_with`, `stand_in`) and add it to the cave's DESIGN.md.
- [ ] [claude] Build the first piece as `build_<piece>.py`, with a 480p preview and a size report.
- [ ] [claude] Add its manifest row, load it in `cave.js` with the code-drawn figure as the fallback, and extend `cave-test.mjs`.
- [ ] [claude] The repo's checks pass; the preview builds.

## Verify and ship

- [ ] [claude] Definition of done in spec.md, checked.
- [ ] [claude] Board position: merges on the next board read unless flipped.
- [ ] [claude] Ledger record written; this file ticked.
