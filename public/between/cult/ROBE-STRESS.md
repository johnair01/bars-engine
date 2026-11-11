# Cultivator robe movement baseline

`robe-stress.html` is a diagnostic gallery for the **current** B2 robe on the feminine and masculine average bodies. It poses the existing rig in deterministic stand, sprint, jump, landing, and high-step/climb **stress poses**, renders front and side views, and records the existing `mix.js` poke counts with the full body geometry restored for measurement. The shipped walker hides covered body triangles, so its visual result alone is not a collision check.

The poses are synthetic. The current cultivator has a procedural walk but no run, jump, or climb clips. This gallery can identify likely bad configurations; it cannot certify temporal behavior, inertia, contact with a ledge, or performance. It does not alter the live game outfit. The GitHub Actions **Robe motion stress** workflow builds the captures in the cloud and uploads its images and report.

Before approving a new robe, replace the synthetic poses with actual game-compatible motion clips and add time-series measurements for body/garment intersection, slit opening and closing, hem-to-foot and hem-to-ground clearance, sudden motion, and runtime cost. Compare the current robe and candidate under identical clips, cameras, and bodies. The Library's `output/council/robe-transfer-2026-11-11/MOTION-GATES.md` records the scenario and acceptance protocol.
