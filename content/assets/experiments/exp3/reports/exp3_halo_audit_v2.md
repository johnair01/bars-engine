# Sprite Halo Audit

- Scanned: **20**
- Flagged: **17**
- Alpha max: `220`
- Distance threshold: `42.0`
- Halo ratio threshold: `0.15`
- BG distance threshold: `60.0`
- BG ratio threshold: `0.08`
- Fix mode: `False`

## Flagged Assets
- `exp3_farm_carrot.png` (ratio=0.7415, p95=203.602)
- `exp3_farm_corn.png` (ratio=0.709, p95=337.208)
- `exp3_farm_hay_bale.png` (ratio=0.8883, p95=212.728)
- `exp3_farm_hoe.png` (ratio=0.8193, p95=207.131)
- `exp3_farm_milk_bottle.png` (ratio=0.8772, p95=216.178)
- `exp3_farm_seed_bag.png` (ratio=0.7358, p95=224.017)
- `exp3_farm_tomato.png` (ratio=0.7278, p95=224.059)
- `exp3_farm_watering_can.png` (ratio=0.7952, p95=214.189)
- `exp3_farm_wheat_sheaf.png` (ratio=0.7943, p95=267.596)
- `exp3_farm_wooden_crate.png` (ratio=1.0, p95=67.472)
- `exp3_forest_hand_axe.png` (ratio=0.2379, p95=138.564)
- `exp3_forest_herb_bundle.png` (ratio=0.0524, p95=43.869)
- `exp3_forest_lantern.png` (ratio=0.8, p95=123.122)
- `exp3_forest_log_bundle.png` (ratio=0.0756, p95=88.572)
- `exp3_forest_pine_cone.png` (ratio=0.0949, p95=365.669)
- `exp3_forest_sapling.png` (ratio=0.3968, p95=116.173)
- `exp3_forest_stone_ore.png` (ratio=0.1266, p95=269.279)

## All Assets
| asset | edge_semialpha | suspicious | bg_suspicious | halo_ratio | bg_halo_ratio | p95 | flag |
|---|---:|---:|---:|---:|---:|---:|---|
| exp3_farm_carrot.png | 236 | 175 | 11 | 0.7415 | 0.0466 | 203.602 | True |
| exp3_farm_corn.png | 244 | 173 | 56 | 0.709 | 0.2295 | 337.208 | True |
| exp3_farm_hay_bale.png | 206 | 183 | 22 | 0.8883 | 0.1068 | 212.728 | True |
| exp3_farm_hoe.png | 238 | 195 | 11 | 0.8193 | 0.0462 | 207.131 | True |
| exp3_farm_milk_bottle.png | 114 | 100 | 10 | 0.8772 | 0.0877 | 216.178 | True |
| exp3_farm_seed_bag.png | 246 | 181 | 58 | 0.7358 | 0.2358 | 224.017 | True |
| exp3_farm_tomato.png | 316 | 230 | 32 | 0.7278 | 0.1013 | 224.059 | True |
| exp3_farm_watering_can.png | 210 | 167 | 20 | 0.7952 | 0.0952 | 214.189 | True |
| exp3_farm_wheat_sheaf.png | 282 | 224 | 23 | 0.7943 | 0.0816 | 267.596 | True |
| exp3_farm_wooden_crate.png | 4 | 4 | 0 | 1.0 | 0.0 | 67.472 | True |
| exp3_forest_berry_branch.png | 172 | 0 | 0 | 0.0 | 0.0 | 0.0 | False |
| exp3_forest_hand_axe.png | 206 | 49 | 34 | 0.2379 | 0.165 | 138.564 | True |
| exp3_forest_herb_bundle.png | 1221 | 64 | 1216 | 0.0524 | 0.9959 | 43.869 | True |
| exp3_forest_lantern.png | 20 | 16 | 10 | 0.8 | 0.5 | 123.122 | True |
| exp3_forest_log_bundle.png | 1005 | 76 | 1002 | 0.0756 | 0.997 | 88.572 | True |
| exp3_forest_pine_cone.png | 769 | 73 | 63 | 0.0949 | 0.0819 | 365.669 | True |
| exp3_forest_red_mushroom.png | 156 | 0 | 0 | 0.0 | 0.0 | 0.0 | False |
| exp3_forest_rope_coil.png | 613 | 46 | 41 | 0.075 | 0.0669 | 387.229 | False |
| exp3_forest_sapling.png | 378 | 150 | 367 | 0.3968 | 0.9709 | 116.173 | True |
| exp3_forest_stone_ore.png | 229 | 29 | 40 | 0.1266 | 0.1747 | 269.279 | True |
