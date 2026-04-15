# Sprite Halo Audit

- Scanned: **20**
- Production rule: **fail on `bg_halo_ratio`, warn on `halo_ratio`**
- Production failures (BG spill): **0**
- Edge warnings: **12**
- Alpha max: `220`
- Distance threshold: `42.0`
- Halo ratio threshold: `0.15`
- BG distance threshold: `60.0`
- BG ratio threshold: `0.08`
- Edge warn ratio threshold: `0.15`
- Fix mode: `True`
- Changed edge pixels: **2135**

## Production Fail (BG Spill)
- None

## Edge Warnings
- `exp3_farm_carrot.png` (edge_ratio=0.6229, p95=59.718)
- `exp3_farm_corn.png` (edge_ratio=0.3934, p95=59.448)
- `exp3_farm_hay_bale.png` (edge_ratio=0.7379, p95=58.499)
- `exp3_farm_hoe.png` (edge_ratio=0.6807, p95=59.702)
- `exp3_farm_milk_bottle.png` (edge_ratio=0.7544, p95=59.923)
- `exp3_farm_seed_bag.png` (edge_ratio=0.6057, p95=59.845)
- `exp3_farm_tomato.png` (edge_ratio=0.4494, p95=59.721)
- `exp3_farm_watering_can.png` (edge_ratio=0.7429, p95=59.795)
- `exp3_farm_wheat_sheaf.png` (edge_ratio=0.6241, p95=59.698)
- `exp3_farm_wooden_crate.png` (edge_ratio=1.0, p95=45.205)
- `exp3_forest_lantern.png` (edge_ratio=0.6, p95=59.038)
- `exp3_forest_sapling.png` (edge_ratio=0.1587, p95=53.694)

## All Assets
| asset | edge_semialpha | suspicious | bg_suspicious | halo_ratio | bg_halo_ratio | p95 | fail_bg | warn_edge | pass |
|---|---:|---:|---:|---:|---:|---:|---|---|---|
| exp3_farm_carrot.png | 236 | 147 | 0 | 0.6229 | 0.0 | 59.718 | False | True | True |
| exp3_farm_corn.png | 244 | 96 | 0 | 0.3934 | 0.0 | 59.448 | False | True | True |
| exp3_farm_hay_bale.png | 206 | 152 | 0 | 0.7379 | 0.0 | 58.499 | False | True | True |
| exp3_farm_hoe.png | 238 | 162 | 0 | 0.6807 | 0.0 | 59.702 | False | True | True |
| exp3_farm_milk_bottle.png | 114 | 86 | 0 | 0.7544 | 0.0 | 59.923 | False | True | True |
| exp3_farm_seed_bag.png | 246 | 149 | 0 | 0.6057 | 0.0 | 59.845 | False | True | True |
| exp3_farm_tomato.png | 316 | 142 | 0 | 0.4494 | 0.0 | 59.721 | False | True | True |
| exp3_farm_watering_can.png | 210 | 156 | 0 | 0.7429 | 0.0 | 59.795 | False | True | True |
| exp3_farm_wheat_sheaf.png | 282 | 176 | 0 | 0.6241 | 0.0 | 59.698 | False | True | True |
| exp3_farm_wooden_crate.png | 4 | 4 | 0 | 1.0 | 0.0 | 45.205 | False | True | True |
| exp3_forest_berry_branch.png | 172 | 0 | 0 | 0.0 | 0.0 | 0.0 | False | False | True |
| exp3_forest_hand_axe.png | 206 | 15 | 0 | 0.0728 | 0.0 | 53.131 | False | False | True |
| exp3_forest_herb_bundle.png | 1221 | 44 | 0 | 0.036 | 0.0 | 37.422 | False | False | True |
| exp3_forest_lantern.png | 20 | 12 | 0 | 0.6 | 0.0 | 59.038 | False | True | True |
| exp3_forest_log_bundle.png | 1005 | 53 | 0 | 0.0527 | 0.0 | 42.356 | False | False | True |
| exp3_forest_pine_cone.png | 769 | 27 | 0 | 0.0351 | 0.0 | 58.202 | False | False | True |
| exp3_forest_red_mushroom.png | 156 | 0 | 0 | 0.0 | 0.0 | 0.0 | False | False | True |
| exp3_forest_rope_coil.png | 613 | 6 | 0 | 0.0098 | 0.0 | 52.938 | False | False | True |
| exp3_forest_sapling.png | 378 | 60 | 0 | 0.1587 | 0.0 | 53.694 | False | True | True |
| exp3_forest_stone_ore.png | 229 | 8 | 0 | 0.0349 | 0.0 | 54.856 | False | False | True |
