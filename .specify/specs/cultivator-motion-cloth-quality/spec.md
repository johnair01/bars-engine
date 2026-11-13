# Spec: Cultivator motion and cloth quality

**Status:** Draft for review, 2026-11-12. The body-size viewer slice is underway; cloth implementation follows this spec.

## The ask

> “Let's create a spec kit for how best with our current resources and capacity improve the quality of these models. and then we'll work on getting the cloth right. I also need to see how the different body sized we accepted in ‘your looks’ are applied to these runs.” — Wendell, chat, 2026-11-12

**Who it is for:** Wendell as the visual reviewer, the artists and models building code-native assets, and players who use the chosen look.
**What they feel now, and what should change:** Motion passes numeric checks while its weight and cloth can still look wrong. Each iteration should show the exact body, garment, phase, and camera that failed, and improve a shared contract rather than accumulate a private correction.

## Purpose

Make the existing cultivator pipeline increasingly deterministic about body proportions, contact, cloth movement, and aesthetic review. Keep the Mac light: build and capture the review matrix in cloud CI, and use the local viewer for targeted judgment and notes.

## Existing structures and known gaps

| Structure | What exists | Gap to close |
|---|---|---|
| `make/parts.json`, `make/figure.js`, `make/mix.js` | One recipe accepts body, build, height, outfit; garments are cut on the built figure | `round` is accepted in the creator menu but has no 3D build recipe |
| `walker.js` and motion lab | Same rig can show walk, captured-limb run, authored jump, body-only and robe views | The viewer had hardcoded `average` and two heights; body-matrix inspection is newly being added |
| `motion.js`, `mocap-reference.js`, `run-dynamics.js` | Named phases, captured limb directions, authored root trajectories | Absolute metre offsets and contact corrections are not yet calibrated over the height range |
| `motion-cloth.js`, `make/shells.js` | A bounded preview hem offset over a pelvis/thigh-skinned rigid skirt | No collision, inertia or material-specific drape; preview offset is not a game-ready cloth model |
| `motion_review_capture.mjs`, GitHub Actions | Cloud screenshots and basic numeric gates | No body-size contact/cloth matrix or visual regression against approved reference frames |
| `review-notes.jsonl` | Notes carry motion, time, controls and camera | Notes must also carry build and height and link to the capture and change they prompted |

## User stories and acceptance

### P1 — See the accepted looks in motion

As reviewer, I can select both existing body bases, slight/average/broad builds and any height from 1.50 to 1.95 m in the same run and jump viewer. The active recipe and actual stature are visible and saved with my note. `Round` is labeled as accepted but unavailable until its 3D recipe and fit gate exist.

### P1 — Reproduce a bad moment

As an artist or model, I can reproduce a report from body recipe, outfit, clip, normalized phase, camera, version, and note. A deterministic cloud capture includes front, side and three-quarter frames at strike, compression, toe-off, flight, landing and recovery as applicable.

### P1 — Judge contact and cloth separately

As reviewer, I can inspect body-only, rigid robe, and proposed cloth response at the same frame. Numeric checks flag floating/penetrating feet, knee overlap, body/garment intersections, hem-ground contact and temporal jumps. A green numeric report does not label the motion visually approved.

### P2 — Ship a repeatable cloth method

As a model in another environment, I receive the exact body/garment recipe, rig map, contact phases, units, allowable parameter ranges, camera list, generated captures and failure notes. I can implement a bounded change and produce the same report without access to a particular chat or model.

## Requirements

- **FR-001** The review viewer MUST build from the current `parts.json` recipe and show the body key, build key, requested height, actual stature and outfit.
- **FR-002** The viewer MUST support every built build (`slight`, `average`, `broad`) and the accepted 1.50–1.95 m range on both body bases. It MUST identify `round` as unimplemented until an actual recipe passes the same gates.
- **FR-003** A saved note MUST include the body recipe, motion, time, camera and controls. A cloud report MUST include the source commit and capture identity.
- **FR-004** The technical gate MUST measure foot-to-ground distance during contact, bilateral knee clearance, robe/body and hem/ground penetration, and frame-to-frame displacement at fixed phases. Thresholds are chosen from baseline captures and recorded, not guessed in the spec.
- **FR-005** Motion distances and cloth offsets MUST be specified as either body-relative or world metres. A height change MUST not silently change a contact or cloth ratio; the matrix must reveal any fixed-metre behavior.
- **FR-006** Cloth candidates MUST preserve the approved B2 silhouette at rest and at walk, keep the cross collar and sash readable, and show a delayed release after run push-off and jump landing without visible oscillation or leg clipping.
- **FR-007** The first cloth experiment MUST compare current rigid skinning, bounded phase-driven deformation, and a low-cost constrained secondary-motion layer on the same five body/height combinations per base. Choose the smallest method that passes contact and look review; do not introduce a general solver by default.
- **FR-008** Every approved revision MUST retain reference captures, parameters, checks, user notes and a before/after contact sheet in the repo or cloud artifacts, so another environment can repeat it.
- **FR-009** The browser and cloud capture MUST not require Blender or heavyweight rendering on Wendell's Mac. A cloud worker may use Chromium and the existing Three.js build.

## Body-size contract

Council positions `cr-first-menu` and `cult-parts-height` accept four build names and height 1.50–1.95 m. The current Three.js recipe implements three build names. `slight` morphs toward the teen body at 0.7; `broad` morphs toward superhero at 0.5; `average` uses the regular body. Height is a uniform root scale, so head and hand size also change. Garments are generated after the body recipe. This is the current implementation, not a claim that all choices have passed motion review.

The first cheap matrix is each body base at: slight/1.50, slight/1.95, average/default, broad/1.50, broad/1.95. The full later matrix includes all three builds at 1.50, midpoint and 1.95, plus round after it exists. Review at least front and side at run strike/compression/flight and jump preload/apex/landing, with the robe and body-only view. Keep camera, lighting and timeline fixed across cells.

## Quality gates and visual review

1. **Validity:** body and garment construct, finite transforms, no missing mesh or browser error, saved mix equals rendered mix.
2. **Contact:** compare soles and knees in body-relative units at named phases; report raw metres too. Show ground and contact marker in captures.
3. **Garment:** report body/robe and hem/ground crossings; capture front/side/three-quarter silhouette, lap and sash continuity, and whether the hem follows the legs as one rigid piece.
4. **Motion:** compare root path and phase timing with source. Flag sudden position/velocity changes; distinguish impact from unintended jitter.
5. **Aesthetic:** Wendell scores weight, elasticity, cloth character and game readiness at tagged frames. Preserve his words and the accepted frame as the next round's reference. This is a human gate, not a blind score.

## Design decisions and authority

| Decision | Choice | Whose |
|---|---|---|
| Style | Soft, believable Taoist cultivation, garment construction legible, muted ink-wash palette | Existing council part cards and accepted look direction |
| Build and height vocabulary | Four build names; 1.50–1.95 m uniform height | Council positions `cr-first-menu`, `cult-parts-height` |
| First testing surface | Existing motion lab and cloud capture | Implementation choice from current repo and Mac capacity |
| Cloth choice | Run a small comparison before committing to a solver | This spec's falsifiable proposal; subject to look review |

## Ontology

- `design_intent`: The chosen look remains recognizable during motion across accepted body sizes.
- `intrinsic_pleasure`: A run feels propelled and elastic; cloth trails and settles with material weight instead of moving as a rigid tube.
- `ontology_objects`: Look recipe, rig, motion clip, contact phase, garment recipe, capture, review note and approved reference frame are distinct artifacts.
- `mechanical_claims`: One recipe deterministically rebuilds a body and garment; motion is a function of clip phase and recipe; cloth method is selected by measured fit plus visual review.
- `aqal_attention`: Inspect felt weight and identity alongside geometry, timing and rendering cost. A technical pass does not override the visual response.
- `agency_and_consent`: Wendell can steer or reject a look at a precise frame; no aesthetic approval is inferred from a test pass.
- `evidence_and_unknowns`: Three builds and the height range exist in code; round does not. Current cloth is rigid skinning plus a preview offset. No accepted foot/cloth tolerance or approved run/jump reference reel yet.
- `provenance_effects`: Store source asset, recipe, code version, capture parameters and user note with each decision so later models know why values changed.
- `risks_and_tests`: Extreme height/build combinations may break contact or expose cloth intersections; compare them before expanding the cloth method.
- `implementation_translation`: Extend the motion lab and cloud capture, then prototype cloth on the B2 skirt with the same fixed matrix and no local heavyweight dependency.
- `decision_or_open_authority`: Wendell's visual acceptance and the round build's shape remain open; no new preference is inferred here.

## Reserved items

Wendell's aesthetic approval of the final body and robe. No money, privacy or release decision is made by this spec.

## How we will know it failed

- **The cheap test, run before cloth building:** Render the five body/height combinations per base at contact and flight with current rigid robe and body-only view. If the same motion values yield different ground contact, exposed body or hem intersections, record the variation and normalize those values before cloth design.
- **The result that stops the work:** If a proposed cloth method improves one default look by breaking a boundary body, the approved walk, garment identity, or frame stability, stop and return to the body/garment contract rather than tune that one frame.

## Definition of done

- [ ] All accepted build choices have an honest 3D status; round is built or visibly pending.
- [ ] Review matrix, measurements and captures run in cloud CI on the chosen body set.
- [ ] B2 cloth method passes technical gates and Wendell approves its look on run and jump.
- [ ] Another environment can rebuild the exact approved frames from recorded inputs.

## Signed

- Drafted from the record for intake, spec and falsification on 2026-11-12; council face review and signatures pending.
