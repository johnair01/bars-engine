# MVP Asset Research Project (5 Nations / 8 Classes / <$1000)

## Goal
Define a production-ready "toybox" (asset system) for a text-heavy, CYOA-driven 16-bit RPG MVP that can be built under `$1000` cash spend.

## Product Constraints (from user intent)
- 5 nations
- 8 character classes
- Basic player customization
- Farm + forest item/object set
- Heavy CYOA/text logic (asset-light relative to action RPGs)
- Keep hub-and-spoke architecture

## Core Hypothesis
If narrative depth is delivered via CYOA and text manipulation, then we can:
1. Reuse modular base assets across nations/classes
2. Limit bespoke animation states
3. Ship a compelling vertical slice under `$1000` with disciplined asset governance

## Six Face Research Tracks

### 🧠 Architect
- Define canonical asset schema:
  - `assets/base/` shared tiles, props, UI
  - `assets/nations/{nation}/` palette swaps + overlays
  - `assets/classes/{class}/` class overlays + portraits
  - `assets/items/{farm|forest}/`
  - `assets/ui/`
- Define manifest contract fields:
  - `id`, `type`, `path`, `frameSize`, `frames`, `license`, `source`, `variantOf`, `tags`
- Define acceptance tests: naming, dimensions, frame order, license metadata present

### 🏛 Regent
- Freeze MVP scope to one runtime pattern:
  - 4-direction walk only
  - No combat animation for MVP
  - Interaction via context + dialogue (CYOA-first)
- Require spoke isolation:
  - Nations may override visuals only
  - Nations cannot change core interaction contract

### ⚔️ Challenger
- Risk checks:
  - License contamination (GPL/CC-BY-SA mixed into commercial path)
  - Asset style drift from multi-tool generation
  - Hidden custom-art creep blowing budget
- Hard rules:
  - Every imported asset needs machine-readable license entry
  - No asset enters runtime without manifest validation pass

### 🎭 Diplomat
- Hybrid sourcing strategy:
  - Open packs for baseline (fast)
  - AI generation for missing deltas
  - Human touch-up only on "hero" visuals
- Define merge protocol:
  - Keep BARs logic APIs as hub
  - Game GUI layer consumes adapter endpoints only

### 🌊 Shaman
- Preserve emotional tone through style bible:
  - Palette families per nation
  - Symbol motifs per nation/class
  - Dialogue + UI microcopy carries most narrative differentiation
- Use visual transformation sparingly to avoid overproduction

### 📖 Sage
- Success metric for research phase:
  - Produce a complete asset BOM with unit costs and source licenses
  - Prove `<$1000` scenario with explicit assumptions
  - Identify exact "no-go" conditions that force over-budget

## Benchmarks Collected

Open-source references (scope and structure):
- `perquis/sprout_lands` (Python farming game; README links asset/UI packs)
- `mimikim/harvest-moon-phaser3-game` (Phaser top-down farming RPG loop)
- `jeremyckahn/farmhand` (PWA farming game, stable ongoing OSS)
- `kherrick/sprite-garden` (procedural farming/sandbox)
- `elliotfontaine/untitled-farming-sim` (Godot top-down farming)

Quick file-count snapshot from GitHub trees (for scope intuition, not direct target):
- `sprout_lands`: 487 PNG files
- `harvest-moon-phaser3-game`: 219 PNG files
- `farmhand`: 215 PNG files
- `untitled-farming-sim`: 381 PNG files

Interpretation:
- Mature/feature-rich farming repos often land in the 200–500 PNG range.
- A CYOA-heavy MVP can target well below this if variants are palette/overlay driven.

## MVP Asset Bill of Materials (initial target)

### A. Characters
- Base humanoid sheet templates (shared): 2
- Class overlays/equipment tokens: 8 classes x 4-8 pieces each
- Nation visual variants: palette + insignia overlays for 5 nations
- NPC base variants: 10-15

### B. World Tiles
- Shared core tileset (farm + forest + paths + interiors): 1-2 master sets
- Nation biome overlays (color/motif decals): 5 small overlay sets
- Props:
  - Farm objects: 30-50
  - Forest objects: 25-40

### C. UI
- Dialogue/CYOA panels, buttons, icons: 1 cohesive set
- Card/item frame variants by nation: 5 frame skins (same geometry)

### D. VFX (minimal)
- 8-12 lightweight effects (harvest, interaction, charge pulse)

## Cost Model (Research Baseline)

### Target Scenario (`$300-$900`)
- Engines/tools mostly free:
  - Phaser/Godot: $0
  - Open asset packs: $0-$150
  - Aseprite or equivalent: $0-$20
  - Optional AI tool month: $20-$100
  - Hosting/dev infra MVP: $0-$100
  - Contingency paid pack(s): $100-$400

### Overrun Triggers
- Bespoke hand animation per class+nation
- Frequent pack switching without style normalization
- Licensing incompatibilities forcing asset replacement

## Research Experiments (next 7 days)

1. Build Toybox v0 manifest and validator
- Output: JSON schema + CLI validator + fail report

2. Assemble candidate pack stack
- 2 open stacks + 1 paid fallback stack
- Log license, style fit, and per-category coverage
 - Status: Complete (see `docs/EXPERIMENT2_ASSET_STACK_RESULTS.md` and `content/assets/experiment2.stack-evaluation.v0.json`)

3. AI delta test
- Generate missing asset set (20 items)
- Measure:
  - generation minutes
  - cleanup minutes
  - accepted rate (%)

4. Nation skinning test
- Apply nation palette/overlay system to same base assets
- Measure differentiation score and production time
 - Status: Complete
 - Output:
   - `content/assets/experiments/exp4/variants/{nation}/*.png` (100 total)
   - `content/assets/experiments/exp4/reports/exp4_results.json`
   - `content/assets/experiments/exp4/reports/exp4_asset_scores.csv`
   - `content/assets/experiments/exp4/reports/EXPERIMENT4_NATION_SKINNING_RESULTS.md`
   - `content/assets/experiments/exp4/reports/exp4_nation_contact_sheet.png`
 - Measured:
   - Variants generated: `100/100`
   - Differentiation pass rate: `95.0%` (19/20 assets at min pairwise delta >= 18)
   - Seconds per variant: `0.0188`
   - Overall gate: `PASS`

5. GUI one-shot viability
- Prompt-generate a front-end shell
- Evaluate:
  - export cleanliness
  - ability to connect to BARs adapter APIs
  - refactor effort to repo standards
 - Status: In progress (vertical slice implemented)
 - Output:
   - `src/app/play/page.tsx`
   - `src/components/play/Experiment5PlayShell.tsx`
   - `src/app/api/play/resolve/route.ts`
   - `src/app/api/play/sprites/[nation]/[asset]/route.ts`
   - `docs/EXPERIMENT5_PLAY_SHELL.md`

## Decision Gate
Proceed with full MVP production only if:
1. Manifest validator catches 100% of intentional bad assets in test set
2. AI delta acceptance rate >= 60% with <= 10 min cleanup per accepted asset
3. Asset BOM can be covered in a documented `<$1000` spend plan
