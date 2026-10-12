# Spec: Cave studio

<!-- Six-faces pipeline spec. The ask and the dialogue are in request.md. Stages and owners: council/pipeline.yaml
     in wendell-britt/six-faces-council. bars-engine's own rules win on conventions. -->

## The ask

> "I want to use blender in the cloud to continue development work on the cave lessons and bigmind work as well as
> integrating some asset work that I'm doing in ChatGPT" (Wendell, 2026-10-12, in the cloud session for bars-engine PR #281)

**Who it is for:** the player of the Cave of Lessons and the Big Mind cave; Wendell as maker; a future session.
**What they feel now, and what should change:** the daemons are sphere stacks drawn by code and the ChatGPT art has no
path into the game. The player should meet daemons and spirits that look made, and Wendell should get pieces without
opening Blender.

## Purpose

A repeatable studio for the cave's 3D pieces: a session builds or sources a piece, fits it to the budget, previews
it, records its source and licence in the manifest, and commits a file the cave loads. It serves both caves.

## User stories

### A daemon with a body

**As the player**, I want a daemon in my path that looks like someone, so the 3-2-1 feels like meeting a person.
**Acceptance:** one daemon figure, built in the cloud, loads in the cave at 390 by 844, has no face, and the cave's
browser test still passes under the size budget.

### ChatGPT art that arrives

**As Wendell**, I want art I make in ChatGPT to reach the cave through one path, so I do not carry files between tools by hand.
**Acceptance:** a file he drops in the agreed place becomes a manifest row with a source and a licence, and either a
piece in the cave or a stated reason it waits.

## Design decisions

| Decision | Choice | Whose |
|---|---|---|
| Licence of every asset | Own work or CC0 only; Royalty Free models never go into a page | Wendell (`c3d-cc0-only`); Blendkit terms art. 5, read 2026-10-12 |
| Size | The kit stays under about 3 MB; each piece has its own budget in the manifest | Wendell (`c3d-phone-budget`) |
| Words | The studio makes things to see. It never writes a daemon's or spirit's words | Wendell (`cave-321-player-writes`) |
| One studio, two caves | Shared pieces are built once | Wendell (`cave-321-one-build`, `st-which-three` steer) |
| Where ChatGPT files arrive | A Google Drive folder the session reads | council (marked) |
| Stand-ins | Each ChatGPT-made piece has a scripted or CC0 stand-in so the cave plays the same without it | council, from bars-engine's dual-track rule |

## Contracts

- **Manifest row** (`content/ontology-game/cave/manifest.json`): `id`, `file`, `kind`, `source`, `licence`, `status`,
  `bytes`, optionally `budget_bytes`. A ChatGPT-made piece adds `made_with: "ChatGPT"` and `stand_in: <asset id>`.
- **Studio tools:** `tools/blender-cloud/` (fetch, prepare, scene, viewer).
- **Build scripts:** one `build_<piece>.py` per piece, run with `bpy` 5.2.2, writing a committed `.glb`.

## Reserved items

- Whether ChatGPT-made art may ship at all, and how it is marked: board question `cs-chatgpt-ai-art`. Consent and a
  person's likeness are reserved too: no piece is made from a photograph of a real person.

## How we will know it failed

- **The cheap test, run before building:** rebuild the cave's figure, kit and spot table in the cloud and compare
  with the committed files. **Run 2026-10-12: passed**, all three byte for byte identical.
- **The result that stops the work:** the first new piece (a daemon figure) cannot be built under its budget, or
  loads in the cave and fails the 390 by 844 browser test, after two honest attempts. Then the studio's scripted
  path is the wrong tool for characters, and the council rethinks, with image-to-3D as the next thing to try.

## Definition of done

- [ ] The first piece is built in the cloud, committed with a manifest row, and loads in the cave at 390 by 844.
- [ ] The cave's browser test passes and the kit stays under budget.
- [ ] The repo's checks pass and the preview builds.
- [ ] Wendell has looked at the piece's preview. It goes on his steps list.
