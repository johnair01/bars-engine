# Spec: Lantern Harbor — Generative Asset Pipeline R&D

## Purpose

Establish a bounded research project for Lantern Harbor that tests whether **Scenario** and **StableGen** can produce commercially usable, stylistically coherent, mobile-ready 3D assets for Bars Engine's spatial worlds.

This is an asset-production experiment, not a commitment to make either tool a player-facing dependency, an in-game generator, or the canonical art pipeline.

## Decision to investigate

The two tools solve different parts of the asset problem:

- **Scenario** is the cloud art-direction and concept layer: reference sheets, asset-family exploration, style consistency, and optional image-to-3D candidates.
- **StableGen** is a Blender + ComfyUI finishing layer: take a selected mesh, generate depth-guided views, project/bake coherent textures and PBR maps, optionally rig, then export ordinary assets.

The working hypothesis is that a combined path may create better Lantern Harbor assets than either:
```
Scenario reference/concept
  → selected base mesh (hand-made or image-to-3D candidate)
  → Blender cleanup for scale, topology, UVs, collision
  → StableGen texture/PBR finish
  → GLB validation and Bars Engine integration
```

## Constraints

- **No runtime generation.** The delivered game continues to ship ordinary optimized assets; no Scenario key, ComfyUI server, or StableGen installation is required for players.
- **Phone-first.** The experiment must produce assets suitable for a web/mobile 3D world after normal optimization.
- **Human review remains mandatory.** Geometry, silhouette, scale, UVs, collider, texture seams, file size, material count, and accessibility remain deliberate craft decisions.
- **No production commitment from a successful concept image.** A pretty render is not a passing asset.
- **Commercial provenance is required.** Each candidate records source mesh, tools/models, licenses, prompts/reference inputs, date, reviewer, and export format.
- **No restricted model is used in a commercial build without an explicit compatible license.** In particular, do not use Qwen Image 2.1/Turbo or Bria FIBO output for commercial game assets unless their licensing status is independently cleared for the intended use.

## R&D questions

1. Can Scenario establish a coherent Lantern Harbor visual family quickly enough to justify a paid month?
2. Can StableGen materially improve continuity and editability of a chosen Blender mesh's textures over the source texture from an image-to-3D provider?
3. Can either route yield a small asset that meets the project’s mobile/web performance budget after cleanup?
4. Is the combined route less expensive in *human iteration time* than making equivalent assets by hand?
5. Which route has clean commercial provenance for assets intended to ship?

## First experiment: three small harbor assets

Use deliberately unheroic, hand-scale props. They reveal texture seams and style drift without consuming a cathedral’s worth of budget:

| Asset | Why it is chosen | Success signal |
|---|---|---|
| Wayfinding lantern | Emissive material, metal/glass/wood boundaries, iconic silhouette | Reads as a navigational landmark at phone scale |
| Dockside notice board | Flat planes, paper/signage, low-poly geometry | Produces legible, restrained surface variation without illegible AI text |
| Root-wrapped mooring post | Organic texture + simple silhouette | Texture feels integrated around the form rather than stickered onto one face |

Each asset gets one controlled comparison:
- **Path A:** Scenario concept/reference + manually cleaned or provider-generated mesh.
- **Path B:** The same selected mesh finished with StableGen’s multi-view texturing/PBR workflow.

Do not compare unrelated meshes; that would compare apples to ceremonial turnips.

## Budget and stopping rule

- Start with Scenario Starter for one month only, if a paid account is needed.
- Cap cloud ComfyUI/GPU exploration at **$20** for the initial round.
- Stop the round if setup/configuration consumes more than two focused sessions before one usable texture test exists. Record the blocker; do not “recover the investment” through escalating spend.
- Upgrade, subscribe long-term, buy hardware, or integrate APIs only after the decision gate below passes.

## Required experiment records

For every attempted asset, create a compact record containing:

```yaml
asset_id:
asset_name:
route: scenario_only | scenario_plus_stablegen | baseline
source_mesh:
source_mesh_license:
scenario_plan_and_model:
scenario_credit_cost:
stablegen_architecture_and_models:
comfy_gpu_and_runtime_cost:
reference_assets_and_rights:
prompt_version:
output_files:
polycount:
texture_dimensions:
material_count:
glb_size:
commercial_license_status: cleared | blocked | needs_review
reviewer_notes:
decision: keep | revise | discard
```

Store prompts and representative generated images only where their source/license permits it. Do not treat private third-party reference art as a training set.

## Pass criteria

The project passes its first gate only if at least one asset:

- exports as a valid GLB and loads in the existing Bars Engine spatial world;
- has an intentional silhouette and coherent surfaces around visible camera angles;
- has no obvious texture projection seam in ordinary play-camera distance;
- fits the agreed asset performance budget after ordinary optimization;
- has verified commercial provenance;
- has a reproducible recorded route; and
- is preferred by at least two of three internal reviewers over the baseline, without knowing which route made it.

## Deliverables

1. A Lantern Harbor mini style/reference board made with Scenario or equivalent references.
2. Three paired asset experiment records.
3. One optimized, proven GLB candidate (or a documented negative result).
4. A short decision memo: adopt for concepting, adopt for finishing, retain as occasional tool, or stop.
5. A recommendation for the next asset class—prop, environment module, character, or none.

## Out of scope

- Building Scenario or StableGen into Bars Engine at runtime.
- Buying a GPU workstation.
- Bulk-generating a whole environment.
- Treating auto-rigged characters as production-ready before animation and deformation tests.
- Replacing existing Blender modeling, UV, optimization, or art-direction work.

## Source notes

- StableGen repository and licensing notes: https://github.com/sakalond/StableGen
- Scenario pricing/model/credit checks must be verified in the product UI before a paid run; compute-unit cost varies by model and settings.
