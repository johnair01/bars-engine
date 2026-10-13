# Request: Cave studio, Blender in the cloud for the cave

<!-- Feature request move, run 2026-10-12. Procedure: council/moves/feature-request.md in wendell-britt/six-faces-council.
     Round 1 is on the Council Board as battle fr-cave-studio. His answers are recorded below as he saves them. -->

## The ask

> "ok let's go ahead and do a project intake for the council board. I want to use blender in the cloud to continue
> development work on the cave lessons and bigmind work as well as integrating some asset work that I'm doing in
> ChatGPT"
> (Wendell, 2026-10-12, cloud session that built the Blender cloud tools, bars-engine PR #281)

## 3: Face it (third person)

### What are we trying to create or experience?

Wendell wants sessions in the cloud to make and improve the 3D pieces of the cave, the Cave of Lessons and its fork
the Big Mind cave, using Blender as a Python module. Two kinds of material feed it: pieces built by script or taken
from CC0 libraries, and art Wendell makes in ChatGPT. A session takes the material, builds a piece that fits the
cave's budget, renders a preview, records the piece's source and licence, and hands back a file the cave loads. The
player of the cave meets figures and places that look made by one hand, and never meets a licence problem.

### What is life like now?

- **The cave's Blender pieces are built by script and committed.** `content/ontology-game/body/build_figure.py`
  writes `figure.glb` (204,264 bytes, 9,613 faces, 79 anchors). `content/ontology-game/cave/build_kit.py` writes
  `cave-kit.glb` (16,916 bytes, six unit pieces: wall_ring, floor, pool, gate_stones, portal_arch, path_tube) and
  `spots.json` (79 places). Both need `bpy` 5.2.2 on Python 3.13, which is what the cloud runs.
  `content/ontology-game/cave/manifest.json` lists every asset with its source and licence.
- **The daemons and most of the cave's other figures are drawn by code in the page.** `buildDaemon` in
  `content/ontology-game/cave/cave.js` (line 543) stacks spheres. They are not Blender pieces.
- **The Big Mind cave is a fork.** Its design is `content/ontology-game/bigmind/DESIGN.md`, on bars-engine PRs
  #278 and #282, not yet on main. It adds chambers between hallways with a voice blocking the path, a sit-down, and
  charge spirits.
- **Rules already standing.** Assets are own work or CC0 only (`c3d-cc0-only`). The kit stays under about 3 MB
  (`c3d-phone-budget`). The player writes every line and the system never writes a daemon's words
  (`cave-321-player-writes`). The 3-2-1 chamber is built once for both caves (`cave-321-one-build`).
- **The cloud tools exist.** `tools/blender-cloud/` (PR #281) fetches a CC0 asset, decodes it, builds a scene,
  renders a 480p preview and refuses any model that is not CC0. Spec: `.specify/specs/blender-cloud-hardening/`.
- **The ChatGPT work is new to the record.** The 9 October pass guessed that concept images could come from ChatGPT or
  Codex ("inferred, not checked against his plan"). Nothing records what he is making there.

### The grammar, the council's first answers

| Question | The council's answer | His correction |
|---|---|---|
| Who is being helped? | The player of both caves, whose cave looks and feels like one place. Wendell as maker, who gets pieces without opening Blender. A future session, which finds the recipe written down. Wendell's need leads. | |
| What satisfaction are they looking for? | Inside, wonder, then peace in the chambers. Outside, daemons and spirits that look made, a cave that loads fast on a phone, and a maker's path that any session can run. | |
| What altitudes does the help need? | Shaman (magenta) for the felt look of a daemon or spirit. Architect (orange) for the build and its budget. Regent (amber) for the licence and the manifest. Diplomat (green) for the community that is wary of AI. | |

## 2: Talk to it (second person)

**Casts** (three coins, `cast.py --json`, 2026-10-12; a first printout cut off after four faces was not used):

| Face | Hexagram | How it bears on the request |
|---|---|---|
| Shaman | Fog, becoming Stillness | The Shaman does not yet know what the ChatGPT assets are, and the reading says to ask before building. |
| Architect | Fullness, becoming Candour | The pipeline is at its peak in the cloud already, so the Architect saves capacity for the first real piece. |
| Challenger | Noon, becoming Adornment | There is a lot visible, and the Challenger checks that the polish is doing real work. |
| Regent | Ascent, becoming The Cauldron | Growth too slow to see day to day, with raw material going in: the manifest keeps the vessel from tipping. |
| Diplomat | Reserves, becoming Fog | Stored for later and never named a day: the Diplomat asks where ChatGPT files will arrive. |
| Sage | Sprouting, becoming Fellowship | Early, and the mess is not a verdict. Two caves, one studio. |

### Round 1

Three questions on the board, each with the council's lean marked: `cs-chatgpt-ai-art` (may ChatGPT-made art ship, and
how is it marked), `cs-first-piece` (which piece first), `cs-asset-kind` (what the ChatGPT assets are). Seven
positions stand unless he flips them. His answers will be quoted here, with the date, when he saves them.

**His answers, saved on the board 2026-10-12 between 22:25 and 22:29 UTC** (ledger `2026-10-12-pull-222843.json` and
`2026-10-12-pull-222920.json` in six-faces-council):

| Row | His turn | His words |
|---|---|---|
| `cs-chatgpt-ai-art` | Concept only. Nothing from ChatGPT ships. | "for now it's for concept, we will need an additional production step to rebuild the pieces ourselves" |
| `cs-first-piece` | Chamber dressing for the kit. | (no steer) |
| `cs-asset-kind` | Pictures to build from. | "I'd need to see and trust blenders ability to take pictures to build from" |
| `cs-cc0-or-own` | Overruled. | "How are people getting around this? Well not around but if royalty free can be extracted then what's the point of this" |
| `cs-rebuild-proof`, `cs-manifest-row`, `cs-one-studio`, `cs-no-written-words`, `cs-stand-in`, `cs-chatgpt-by-drive`, `cs-first-test` | Stand. | |

### What the dialogue found

- **ChatGPT pictures are concept art.** The production step he names is the studio itself: a session rebuilds each
  piece in Blender, by script, from his picture, and that rebuilt piece is what ships. Its licence is own work, and
  its manifest row names the picture it was built from. No ChatGPT pixels go into the cave.
- **The first piece has to earn his trust in that step.** So it is the chamber dressing built from pictures, shown
  beside the pictures it came from, with a number for how closely each model's outline matches its picture.
- **The overrule on `cs-cc0-or-own`, and the answer to his question.** Blendkit's Royalty Free licence covers renders,
  images, prints and software whose models a third party cannot separate or open (terms, article 5, read 2026-10-12).
  Its Licensing FAQ says a game may use them "if these can't be extracted by the users in an easy way". A plain GLB in
  a web page can be extracted, so a page cannot carry one. Games get around this by shipping models inside their own
  protected asset bundles, and a page can show a render or a video instead. CC0 has no such limit. With pictures to
  build from, every piece is own work, so the overrule changes nothing for the first piece, and the studio's CC0 gate
  in `tools/blender-cloud/` stays until he rules otherwise.
- **His first picture, 2026-10-12.** `cave-crystal-growth.png` (ChatGPT, Drive inbox) built as a crystal cluster at
  0.829 outline match. Outline alone scored 0.88 and looked like a blob, so the studio gained a crystals mode, and a
  high outline match is now read as necessary, not enough. Whether he trusts the step is board step `cave-studio-03`.
