# Captured run calibration

The motion lab's run uses the CMU source limb directions. The source skeleton is rotated to match the cultivator's forward axis using the averaged foot-to-toe vector. The source has 20 frames at 24 fps, 2.46 m of travel per cycle, and about 0.105 m of hip height range.

The game rig uses a separate, explicit vertical contact cycle in `run-dynamics.js`. Each half-stride starts at foot strike (0 m), compresses to -0.04 m at phase .18, releases through toe-off at .40, reaches +0.09 m at .70, and returns to strike. Cubic Hermite slopes match across the loop. The contact correction is limited to the nearest 8% of each half-stride and 25% of the measured sole error; a broad ground correction previously flattened compression. `Run compression` and `Run flight` scale the negative and positive portions independently. This curve is a review calibration motivated by visual feedback, not a claimed direct reproduction of the captured root channel. The remaining sole error still requires foot placement or IK before game use.

Shared review controls: stride 1.00, arm swing 1.00, torso lean 1.00, run flight 1.00, bilateral arm clearance 0.50, left upper arm out 0.10. Other arm offsets are zero. Keep the source direction controls at 1.00 when retargeting; tune only the corrective offsets against the exposed body.

To repeat the check, choose **Pose run**, show the body without robe, and inspect both body variants at timeline fractions 0, .125, .25, .375, .5, .625, .75, and .875. The elbow readout is the lateral distance from shoulder midpoint, not a mesh collision test. With these controls, the sampled feminine minima were 0.23 m left and 0.25 m right; masculine minima were 0.28 m left and 0.30 m right. Compare front, side, and three-quarter views for wrist and upper-arm penetration before calling the run game-ready.

The cultivator review cycle is 0.64 s while the source is 0.83 s. Their per-cycle travel yields similar speeds near 3 m/s, but cadence, foot contacts, and robe motion still need a joint review in motion. This calibration is a starting pose, not a final animation approval.
