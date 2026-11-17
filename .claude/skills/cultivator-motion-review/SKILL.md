---
name: cultivator-motion-review
description: Reproduce, improve, and review the cultivator's walk, run, jump, body-size fit, and B2 robe movement from code. Use for motion-lab work and cloth iteration.
---

# Cultivator motion and cloth review

Read `.specify/specs/cultivator-motion-cloth-quality/{request,spec,plan,tasks}.md` and the newest entries in `public/between/cult/review-notes.jsonl` before editing. Read `UI_COVENANT.md` before changing the viewer UI. Treat the user's frame-specific visual notes as evidence; a passing script does not approve the motion or garment.

## What exists

- `public/between/cult/make/parts.json`, `make/figure.js`, `make/mix.js`: body and garment recipe. Two body bases; slight, average, broad builds; heights 1.50–1.95 m. The accepted round build has no 3D recipe yet.
- `public/between/cult/walker.js`: constructs the selected recipe for motion review.
- `public/between/cult/motion.js`, `run-dynamics.js`, `mocap-reference.js`: motion timing, root movement, and mocap comparison. Reference assets are `reference-cmu-walk-run.glb` and `reference-cmu-16-05-jump.bvh`.
- `public/between/cult/motion-cloth.js`, `make/shells.js`: current bounded hem preview and garment geometry. Do not call it solved cloth.
- `public/between/cult/motion-lab.html` and `.js`: interactive reviewer. Notes save motion, phase, controls, camera, body, build, and height.
- `tools/blender-cloud/tests/motion_lab_server.py`, `motion_review_capture.mjs`, `robe_stress_capture.mjs`: reusable local or cloud-environment capture tools. Their directory name is historical; this browser review does not require Blender.

## Run a review in your environment

Start the lightweight server: `python3 tools/blender-cloud/tests/motion_lab_server.py`. Open `http://127.0.0.1:8767/between/cult/motion-lab.html`. Use Claude's browser tools, or Playwright in the same environment, to inspect the viewer. The user's Mac should not perform a heavy render. A cloud Claude session can serve and capture inside its own workspace, then attach a small contact sheet and metrics to the PR or a review artifact.

For scripted capture, install `playwright` in a temporary directory and install Chromium there; copy `motion_review_capture.mjs` into that directory so its bare Playwright import resolves. Set `ROBE_STRESS_OUT` to a temporary output directory and run the script while the server is active. `robe_stress_capture.mjs` is a separate garment stress capture. Do not trigger the repository's GitHub Actions workflow for this loop.

First verify that body/build/height selections change the rendered recipe, not only the labels. Keep source commit, exact recipe, clip, normalized phase, controls, camera, and capture filename together. Compare fixed front and side views at run strike/compression/flight and jump preload/apex/landing. Save body-only and robe views at the same frame. Use both bases and boundary mixes; do not approve a default mix alone.

## Order of work

1. Measure foot-to-ground contact, knee clearance, garment/body and hem/ground crossings, root travel, and frame-to-frame discontinuities. Report metres and fractions of stature. Label which offsets intentionally use world metres versus body-relative units.
2. Fix ground contact and reference scale across the body matrix before tuning cloth. The orange mocap reference currently remains at one scale while the character height changes.
3. Compare the existing rigid garment, bounded phase-driven movement, and one low-cost constrained secondary-motion candidate on the same frames and recipes. Keep the accepted B2 rest and walk silhouette.
4. Present a compact before/after contact sheet and the metrics to Wendell. Preserve his keep/change note with its exact frame. Only his review can approve the look.
5. Record the winning parameter bounds, provenance, and reproduction command in the spec so another model can repeat the result.

Do not add a general cloth solver or invent the round body. Do not infer visual approval from automated checks. Questions changing design authority follow the Council Board rule in the root `CLAUDE.md`.
