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

### What the dialogue found

Not yet. This section fills as rounds close.

## 1: Be it (first person, tested)

### Aligned actions

| Face | Analysis | Action |
|---|---|---|
| Shaman | The daemons are the cave's characters, and today they are sphere stacks. A character earns a body made with care. | Build the first daemon figure in the cloud, with no face, as the cave's design says. |
| Architect | The scripts run in the cloud and match the committed files, so the studio has a known base. | Add new pieces as scripts beside `build_kit.py`, each with a manifest row and a size budget. |
| Challenger | Polish is the risk: a studio can make beautiful pieces nobody loads. | Every piece is loaded in the cave at 390 by 844 before it counts as done. |
| Regent | The licence line is the one thing that cannot be fixed afterwards. | Manifest row first. ChatGPT-made art waits for his answer to `cs-chatgpt-ai-art`. |
| Diplomat | The wary community reads the credits. | Every piece that came from ChatGPT has a scripted or CC0 stand-in, and says so in the manifest. |
| Sage | Two caves, one studio, one list of pieces. | Build each shared piece once, as for the 3-2-1 chamber. |

### The test, and what it showed

**Falsification test (spec.md), run 2026-10-12:** rebuild the cave's figure, kit and spot table in the cloud from the
committed scripts and compare with the committed files.

**Result: passed.** `build_figure.py` took about 5 seconds and `build_kit.py` under 1 second. `figure.glb`
(204,264 bytes), `cave-kit.glb` (16,916 bytes) and `spots.json` (19,731 bytes) came out byte for byte identical to
the committed files. That makes "life now" for the next run: the cloud reproduces the cave's Blender pieces exactly,
so a new piece can be judged against a known base.
