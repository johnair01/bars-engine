# Plan: Lantern Harbor Generative Asset Pipeline R&D

## Milestone 0 — Prepare the test board

1. Choose the Lantern Harbor visual constraints: palette, material language, silhouette rules, texture density, and phone-camera viewing distance.
2. Establish the asset performance budget from the current spatial-world renderer before generating anything.
3. Create the three experiment-record templates and designate a local output location that is not committed until assets pass review.
4. Capture a hand-made baseline or a clearly documented existing mesh for each selected prop.

## Milestone 1 — Scenario concept pass

1. Use the free allowance or one month of Starter to produce a small reference board for the lantern, notice board, and mooring post.
2. Keep the strongest references and record model, cost, prompts, and rights.
3. Select one reference per asset; do not begin custom-model training in the first round.
4. Produce or select compatible base meshes, then clean topology, scale, UVs, collision, and materials in Blender.

## Milestone 2 — StableGen finishing comparison

1. Set up StableGen + ComfyUI locally or on a bounded rented NVIDIA GPU.
2. Run one low-resolution texture test on the lantern mesh before downloading every experimental model.
3. For each viable mesh, generate the multi-view texture/PBR finish and bake/export the result.
4. Record setup time, GPU time/cost, model/license status, failures, and manual cleanup time.

## Milestone 3 — Game proof

1. Optimize the strongest candidate from each route.
2. Import them into the Lantern Harbor spatial-world test scene.
3. Check phone-camera readability, loading, materials, seam visibility, and performance.
4. Run three blinded internal comparisons against the baseline.
5. Write the decision memo and either schedule a small next round or archive the project.

## Decision gate

Adopt only the narrow portion that wins:

- **Scenario wins concepting:** retain Scenario for reference boards/style work.
- **StableGen wins finishing:** retain StableGen for selected mesh texture/PBR finishing.
- **Both win:** use the combined, offline authoring route.
- **Neither wins:** preserve the records, stop subscriptions/instances, and return to Blender-first production.

No service becomes a standing dependency merely because it briefly makes a handsome lantern.
