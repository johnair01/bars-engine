# Sprite Halo Audit

- Scanned: **20**
- Flagged: **12**
- Alpha max: `220`
- Distance threshold: `42.0`
- Halo ratio threshold: `0.15`
- Fix mode: `True`
- Changed edge pixels: **2135**

## Flagged Assets
- `exp3_farm_carrot.png` (ratio=0.6229, p95=59.718)
- `exp3_farm_corn.png` (ratio=0.3934, p95=59.448)
- `exp3_farm_hay_bale.png` (ratio=0.7379, p95=58.499)
- `exp3_farm_hoe.png` (ratio=0.6807, p95=59.702)
- `exp3_farm_milk_bottle.png` (ratio=0.7544, p95=59.923)
- `exp3_farm_seed_bag.png` (ratio=0.6057, p95=59.845)
- `exp3_farm_tomato.png` (ratio=0.4494, p95=59.721)
- `exp3_farm_watering_can.png` (ratio=0.7429, p95=59.795)
- `exp3_farm_wheat_sheaf.png` (ratio=0.6241, p95=59.698)
- `exp3_farm_wooden_crate.png` (ratio=1.0, p95=45.205)
- `exp3_forest_lantern.png` (ratio=0.6, p95=59.038)
- `exp3_forest_sapling.png` (ratio=0.1587, p95=53.694)

## All Assets
| asset | edge_semialpha | suspicious | halo_ratio | p95 | flag |
|---|---:|---:|---:|---:|---|
| exp3_farm_carrot.png | 236 | 147 | 0.6229 | 59.718 | True |
| exp3_farm_corn.png | 244 | 96 | 0.3934 | 59.448 | True |
| exp3_farm_hay_bale.png | 206 | 152 | 0.7379 | 58.499 | True |
| exp3_farm_hoe.png | 238 | 162 | 0.6807 | 59.702 | True |
| exp3_farm_milk_bottle.png | 114 | 86 | 0.7544 | 59.923 | True |
| exp3_farm_seed_bag.png | 246 | 149 | 0.6057 | 59.845 | True |
| exp3_farm_tomato.png | 316 | 142 | 0.4494 | 59.721 | True |
| exp3_farm_watering_can.png | 210 | 156 | 0.7429 | 59.795 | True |
| exp3_farm_wheat_sheaf.png | 282 | 176 | 0.6241 | 59.698 | True |
| exp3_farm_wooden_crate.png | 4 | 4 | 1.0 | 45.205 | True |
| exp3_forest_berry_branch.png | 172 | 0 | 0.0 | 0.0 | False |
| exp3_forest_hand_axe.png | 206 | 15 | 0.0728 | 53.131 | False |
| exp3_forest_herb_bundle.png | 1221 | 44 | 0.036 | 37.422 | False |
| exp3_forest_lantern.png | 20 | 12 | 0.6 | 59.038 | True |
| exp3_forest_log_bundle.png | 1005 | 53 | 0.0527 | 42.356 | False |
| exp3_forest_pine_cone.png | 769 | 27 | 0.0351 | 58.202 | False |
| exp3_forest_red_mushroom.png | 156 | 0 | 0.0 | 0.0 | False |
| exp3_forest_rope_coil.png | 613 | 6 | 0.0098 | 52.938 | False |
| exp3_forest_sapling.png | 378 | 60 | 0.1587 | 53.694 | True |
| exp3_forest_stone_ore.png | 229 | 8 | 0.0349 | 54.856 | False |
