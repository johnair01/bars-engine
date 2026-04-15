# Experiment 3 Results: AI Delta Test (20 Items)

## Gate Outcome
- Overall gate: **PASS**
- Acceptance rate: **100.0%** (20/20) target `>= 60%`
- Cleanup minutes per accepted asset: **0.03 min** target `<= 10 min`

## Measured Timings
- Generation window (from raw file mtimes): **9.26 min**
- Cleanup runtime (normalization script): **0.56 min**

## What Was Normalized
- Converted all 20 outputs to true PNG files (RGBA).
- Removed border-connected backgrounds and preserved transparent canvas.
- Trimmed and fit each asset into 64x64 sprite target with centered composition.

## Critical Raw Issue Found
- Raw generator outputs: **20/20** were JPEG bitstreams with `.png` extension.
- This is a hard fail for direct runtime ingest; normalization layer is mandatory.

## Acceptance Rubric Used (technical)
- filename starts with `exp3_`
- file format is PNG
- image mode is RGBA
- dimensions are 64x64
- contains opaque pixels (not empty)
- contains transparent pixels (sprite-ready)

## Artifacts
- `content/assets/experiments/exp3/reports/exp3_results.json`
- `content/assets/experiments/exp3/reports/exp3_normalization_audit.json`
- `content/assets/experiments/exp3/reports/exp3_normalized_contact_sheet.png`
- `content/assets/experiments/exp3/normalized/*.png`

## Recommendation
- Keep AI generation for delta fill, but enforce a mandatory normalization+validation step before toybox ingest.
- For next pass, add visual QA scoring (style consistency/readability) on top of this technical gate.
