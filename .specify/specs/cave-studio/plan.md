# Plan: Cave studio

<!-- Architect and Regent. Spec: ./spec.md. -->

## Approach

Reuse what exists. The cave already builds its figure and kit by script in Blender, and the cloud reproduces them
exactly, so new pieces follow the same shape: a script beside `build_kit.py`, a committed `.glb`, a manifest row. The
studio tools in `tools/blender-cloud/` supply the fetch, the preview and the licence gate. The first piece is chosen by
Wendell (`cs-first-piece`), with the daemons as the council's lean because both caves use them. ChatGPT art is held
until he answers `cs-chatgpt-ai-art` and `cs-asset-kind`, because the answers decide whether it is a reference, a
texture, an image-to-3D input or a finished model.

## Files touched

| File | Change |
|---|---|
| `content/ontology-game/cave/build_<piece>.py` (new, per piece) | Script that builds the piece |
| `content/ontology-game/cave/<piece>.glb` (new) | Committed output |
| `content/ontology-game/cave/manifest.json` | One row per piece, with source, licence, bytes, budget |
| `content/ontology-game/cave/cave.js` | Load the piece in place of the code-drawn one, with the code-drawn one as the fallback |
| `content/ontology-game/cave/cave-test.mjs` | Check the piece loads at 390 by 844 and the size budget holds |
| `tools/blender-cloud/` | Small additions as the first piece needs them |

## Order

1. The falsification test from the spec (done 2026-10-12, passed).
2. Wendell's answers on the three board questions.
3. Contracts: the manifest row shape for a ChatGPT-made piece.
4. The first piece, as a script, with its preview, then its manifest row, then its load in the cave.
5. The browser test and the size check.
6. Wendell looks at the preview.

## What Wendell does, and when

Two steps on the Your steps tab: put one ChatGPT-made file in the Drive folder (due 2026-10-19), and an optional
check that Blendkit search works from his machine without a key (due 2026-10-19). The first piece waits on his
answer to `cs-first-piece` only.
