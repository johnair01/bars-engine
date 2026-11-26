# Paper-doll best practices for the Sorceress WOKA pipeline

Research date: 2026-11-26. Trigger: 8 robe rolls failed the same way — the model designs
"a robe" as an outer layer over the base's baked under-tunic, so compositions read as a
sloppy layered costume instead of one clean garment.

Primary source: PixelDoll / PixelLab paper-doll system (Shilo/PixelDoll, MIT) — the most
thoroughly documented AI paper-doll pipeline found (spikes S1–S5, research rounds R1–R5,
909-generation A/B campaigns, adversarial review rounds). Everything below is their
measured finding unless noted.

## 1. The base body must be bare (validated — this is our exact bug)

PixelDoll measured the same failure we hit, in pixels:

| Base wore t-shirt | bleed-through |
|---|---|
| Tunics | 2–6 px of collar in the V-neck |
| Robes | 8–12 px showed through |
| Leather vest | 6–13 px per view |
| Open cloaks | 106–136 px of shirt under the open front |

Paper-doll systems (Ultima Online, LPC, Tibia) draw their bases unclothed for the same
reason: **items dress skin, never another garment.**

Their fix: a bare base body, shipped after a 140-generation wording campaign (no filter
refusals in 70 drawings). Tested clause, 0/8 garment draws:

> plain bald paperdoll base body, with plain bare skin everywhere, nothing worn,
> barefoot, no hair, no accessories, neutral standing pose with arms slightly away
> from the torso

Ablation: "everywhere" AND "nothing worn" are both required (dropping either draws
briefs/loincloths on men 2/4). Men are the hard case; women never drew garments once
"no clothes"/"nothing worn" appeared. Words avoided: nude, naked, unclothed, topless,
underwear, briefs, body-part words, negated anatomy ("no nipples" plants nipples).
Their current product default is **plain white underwear** (softer). Refusals, if any,
cost nothing.

## 2. Generate garments on a chroma mannequin, not on the dressed body

Proven pipeline (PixelDoll "Status: Proven"):

1. base character (bare) →
2. **chroma mannequin**: the base recolored to a continuous luminance ramp in a key hue
   (green ramp: (0,60,0) dark → (110,255,110) light; shading survives as darker greens) →
3. dress the mannequin ("solid bright green mannequin (chroma key color) wearing …") →
4. extract the garment (any pixel that scores as key is removed; everything else is the
   layer) →
5. verify + compose the garment over the bare body.

Why a mannequin instead of editing the dressed base:
- nothing underneath to bleed through; under-coverage leaves chroma → **measurable**
- the model can't reuse an existing outfit's colors/shapes in its design
- the bare body itself never passes through the image model, so no filter risk from it
- body redraw by the model is detectable (chroma residue metrics)

Measured specifics we must copy:
- **Continuous ramp, not flat fill.** Flat bright green drew olive-brown folds into red
  cloth (rejected after 420-gen test). Keep shading as darker key shades.
- **"no bright green" wording** in every dress prompt.
- **Key fallback order** (only on color collision): green → magenta → blue → azure.
  Our robes (slate, indigo, white, charcoal) are safe on green. Nation recolors are
  code recolors — no key risk.
- **Dark-outline recovery (`absorbOutline` rule c):** the model draws outlines darker
  than the ramp's darkest shade; naive keying deletes them (they lost 380 px in one A/B).
  Rule: keep a dark key pixel that touches the item, is >40 per channel from the ramp,
  and is darker than the ramp's darkest shade. Recovered 98% with no gate flips.
- **Despill narrowly:** only saturated, very dark, or bright-removed-neighbor pixels are
  despilled. (Steel is drawn blue-gray on EVERY mannequin hue; naive despill grayed
  1,356/1,577 helm pixels on azure before the fix.)
- The model tints outlines toward the key hue; expect green-tinted shadows in garments
  and despill them.

## 3. QA gates G1–G10 with automatic re-roll (their M3 report)

| Gate | Check | Action on fail |
|---|---|---|
| G1 | output count = cells, every output = cell size | re-roll |
| G2 | key kept ≥ 0.97 (base-opaque non-item px still key) | re-roll; twice → switch key if item allows |
| G3 | key px outside base alpha ≤ 0.02 | re-roll |
| G4 | every cell ≥ 50% of clip median area | re-roll |
| G5 | clip area CV ≤ max(0.15, body-band CV + 0.05) | re-roll |
| G6 | pixel-weighted palette distance to design ≤ 15 | soft warn |
| G7 | no layer px on cell borders except feet | re-roll |
| G10 | no 1-px shift fits the silhouette better (re-register) | re-roll |

Human override stays the final gate — "the gates were right to flag them" but trousers
(G5) and hair (G6) were accepted by human decision. Their known gate fixes:
- G5 wrong for legs: leg items vary in area when legs cross; allow the body band's own CV.
- G2 false-fails from cell edge erasure; pad the pose (their y+16).
- Score design (G6) pixel-weighted or one 2-px highlight reads 51 on an identical vest.

## 4. Prompt discipline for fitted edits (multi-reference guides concur)

- **Preservation clause on every edit:** keep every base pixel unchanged except where
  the addition naturally occludes; exact canvas size; exact background; do not redraw
  the character, do not move body parts.
- **One job per reference image.** Name the role: "Image 1 = the mannequin to paint on".
  Positive names the change; enumerate the failure modes you refuse.
- Fitted additions are edits anchored to the base frame — never standalone object
  generation ("produces unregistered loose parts").
- **Verification by recomposition:** base + extracted layer must reproduce the composite;
  layer transparent outside its region; no moved limbs, no duplicate body.
- On failure: retry with a SMALLER body-region prompt or a different route — never
  patch art manually in code.

## 5. Direct warnings for our current approach

- S1 (their spike): "Edit base → local diff → layer works only with slot masking.
  **Batch edits keep the design but redraw the body.**" Whole-sheet edits (our 3×4) are
  batch edits; the mannequin absorbs the body-redraw risk because the body is a stand-in,
  but per-cell pose drift must be verified (G10 / per-cell key metrics).
- Multi-ref role confusion: our current robe prompts passed BOTH the body ref and
  palette/trim refs — role language ("Image 1 is the sheet to paint on") was missing.
- Their item pipeline dresses the 3 rest views then RIGS poses in code; we have no rigger,
  so whole-sheet edits + per-cell gates are our pragmatic equivalent — with under-coverage
  and drift checks per cell.

## Adapted plan for the Sorceress pipeline

Phase A (code, free): derive chroma mannequin sheets from the approved bases
(whole-body → green luminance ramp, alpha preserved); add keyScore extraction +
absorbOutline + narrow despill + per-cell chroma-residue metrics to the toolchain.

Phase B (3 rolls): bare-foundation hero bodies (masc/fem/andro) from the approved
silhouette prompts with the tested bare clause; fallback to white-underwear clause.
These become the body layer under robes; the tan-tunic bases stay as the casual look.

Phase C (5 rolls + re-roll budget): re-cut all robe masters as mannequin dress edits —
"Image 1 is the mannequin sheet; dress it in X on every cell; leave the head chroma;
no bright green; keep every other chroma pixel unchanged." Extract, gate G1–G7,
per-cell under-coverage report, walk gifs for approval.

Ouroboros: each phase runs implement → self-review → independent review round(s)
(delegated, fed prior findings and unresolved objections) → fix → repeat until the
review passes; user deep-zoom approval gates every art release.

## Sources

- https://github.com/Shilo/PixelDoll (README, docs/architecture.md, spikes S1–S5)
- https://github.com/Shilo/PixelDoll/blob/main/docs/research/bare-skin-base-wording-2026-10-25.md
- https://github.com/Shilo/PixelDoll/blob/main/docs/research/2026-11-09-paperdoll-video-review/chroma-key.md
- https://github.com/Shilo/PixelDoll/blob/main/docs/testing/M3_report.md
- https://github.com/Shilo/pixellab-pip/blob/main/skills/pixellab-pip/references/paperdolling.md
- https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator
- Multi-reference prompt guides (PixAI, Qwen Image, Seedream) — role-per-image discipline
