# Experiment 2 Results: Candidate Asset Stacks

## Objective
Assemble:
1. Two open source/free-first asset stacks
2. One paid fallback stack
3. A license + coverage + integration comparison for MVP needs (5 nations, 8 classes, farm+forest zones)

## Stack Summary

### Open Stack A: CC0/Kenney
- Sources:
  - `Roguelike/RPG pack` (1700 files, 16x16, CC0)
  - `Monochrome RPG` (130 files, 16x16, CC0)
  - Kenney support/license policy
- Pros:
  - Cleanest legal posture (CC0, no required attribution)
  - Strong utility coverage for UI/panels/icons/props
  - Zero-cost baseline
- Cons:
  - Farm-specific identity is weaker out-of-box
  - Needs recolor/modular style pass for nation identity

### Open Stack B: LPC farming + LPC base (OpenGameArt)
- Sources:
  - `[LPC] Farming tilesets, magic animations and UI elements`
  - `LPC Base Assets`
- Pros:
  - Very relevant farm/forest content
  - Good coverage for tiles, plants, UI elements
  - Zero asset spend
- Cons:
  - License complexity (CC-BY-SA / GPL)
  - Attribution requirements must be operationalized
  - Copyleft constraints can complicate some distribution models

### Paid Fallback C: Minifantasy + optional Sprout Lands
- Sources:
  - `Minifantasy Farm` ($4.99)
  - `Minifantasy Silent Swamp` ($4.99)
  - `Sprout Lands` premium unlock at $3.99+
  - Kenney CC0 as filler
- Minimum spend:
  - `$13.97` for Farm + Silent Swamp + Sprout premium unlock
- Pros:
  - Highest farm/forest coherence for minimal spend
  - Commercial use permitted by pack licenses (with attribution)
  - Fastest MVP integration path
- Cons:
  - Must track attribution and pack-specific restrictions
  - Class-specific unique sprite depth may still need deltas

## Decision
For this MVP:
1. Primary: **Paid Fallback C**
2. Secondary filler: **Open Stack A (Kenney CC0)**
3. Optional only if intentional OSS copyleft path: **Open Stack B (LPC)**

This path is now reflected in `content/assets/toybox.manifest.v0.json` planned entries.

## Research Note on AI Savings
Self-reported developer threads indicate AI often speeds concepting, but manual cleanup remains a recurring bottleneck for production-ready assets. Treat AI as a delta-generator, not source-of-truth.

