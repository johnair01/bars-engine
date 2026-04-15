#!/usr/bin/env python3
import argparse
import csv
import json
import math
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple

from PIL import Image, ImageDraw
import colorsys


NATIONS = [
    {
        "key": "argyra",
        "hue_shift": -0.02,
        "sat_scale": 0.72,
        "val_scale": 1.05,
        "tint_rgb": (195, 206, 222),
        "tint_strength": 0.14,
    },
    {
        "key": "lamenth",
        "hue_shift": 0.12,
        "sat_scale": 0.84,
        "val_scale": 0.95,
        "tint_rgb": (184, 119, 210),
        "tint_strength": 0.16,
    },
    {
        "key": "meridia",
        "hue_shift": 0.0,
        "sat_scale": 1.08,
        "val_scale": 1.02,
        "tint_rgb": (78, 160, 117),
        "tint_strength": 0.12,
    },
    {
        "key": "pyrakanth",
        "hue_shift": -0.08,
        "sat_scale": 1.24,
        "val_scale": 1.08,
        "tint_rgb": (212, 98, 52),
        "tint_strength": 0.16,
    },
    {
        "key": "virelune",
        "hue_shift": 0.33,
        "sat_scale": 0.90,
        "val_scale": 1.04,
        "tint_rgb": (73, 149, 202),
        "tint_strength": 0.14,
    },
]

ASSET_NATION_OVERRIDES = {
    "exp3_forest_stone_ore.png": {
        "meridia": {"hue_shift": -0.03, "sat_scale": 1.22, "tint_strength": 0.18},
        "virelune": {"hue_shift": 0.06, "sat_scale": 1.18, "tint_strength": 0.2},
    }
}


def clamp_u8(v: float) -> int:
    return max(0, min(255, int(round(v))))


def recolor_pixel(rgb: Tuple[int, int, int], profile: Dict) -> Tuple[int, int, int]:
    r, g, b = rgb
    h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
    h = (h + profile["hue_shift"]) % 1.0
    s = max(0.0, min(1.0, s * profile["sat_scale"]))
    v = max(0.0, min(1.0, v * profile["val_scale"]))
    rr, gg, bb = colorsys.hsv_to_rgb(h, s, v)
    rr = rr * 255.0
    gg = gg * 255.0
    bb = bb * 255.0

    tr, tg, tb = profile["tint_rgb"]
    t = profile["tint_strength"]
    return (
        clamp_u8((1.0 - t) * rr + t * tr),
        clamp_u8((1.0 - t) * gg + t * tg),
        clamp_u8((1.0 - t) * bb + t * tb),
    )


def merged_profile_for_asset(asset_name: str, nation_profile: Dict) -> Dict:
    merged = dict(nation_profile)
    asset_overrides = ASSET_NATION_OVERRIDES.get(asset_name, {})
    nation_overrides = asset_overrides.get(nation_profile["key"], {})
    for k, v in nation_overrides.items():
        merged[k] = v
    return merged


def image_mean_delta(a: Image.Image, b: Image.Image) -> float:
    pa = a.convert("RGBA").getdata()
    pb = b.convert("RGBA").getdata()
    numer = 0.0
    denom = 0
    for (r1, g1, b1, a1), (r2, g2, b2, _a2) in zip(pa, pb):
        if a1 == 0:
            continue
        dr = float(r1) - float(r2)
        dg = float(g1) - float(g2)
        db = float(b1) - float(b2)
        numer += math.sqrt(dr * dr + dg * dg + db * db)
        denom += 1
    return (numer / denom) if denom else 0.0


def alpha_masks_match(a: Image.Image, b: Image.Image) -> bool:
    pa = a.convert("RGBA").getdata()
    pb = b.convert("RGBA").getdata()
    for (_r1, _g1, _b1, a1), (_r2, _g2, _b2, a2) in zip(pa, pb):
        if a1 != a2:
            return False
    return True


def write_contact_sheet(
    asset_names: List[str],
    nations: List[Dict],
    variants_dir: Path,
    output_path: Path,
    tile_size: int = 64,
) -> None:
    header_h = 20
    label_w = 180
    cols = len(nations)
    rows = len(asset_names)
    sheet_w = label_w + cols * tile_size
    sheet_h = header_h + rows * tile_size
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (16, 16, 16, 255))
    draw = ImageDraw.Draw(sheet)
    for c, nation in enumerate(nations):
        x = label_w + c * tile_size + 4
        draw.text((x, 4), nation["key"], fill=(220, 220, 220, 255))
    for r, asset in enumerate(asset_names):
        y = header_h + r * tile_size
        draw.text((4, y + 24), asset.replace("exp3_", "").replace(".png", ""), fill=(200, 200, 200, 255))
        for c, nation in enumerate(nations):
            path = variants_dir / nation["key"] / asset
            if not path.exists():
                continue
            im = Image.open(path).convert("RGBA")
            x = label_w + c * tile_size
            sheet.alpha_composite(im, dest=(x, y))
    os.makedirs(output_path.parent, exist_ok=True)
    sheet.save(output_path, format="PNG", optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input-dir",
        default="/home/workspace/bars-engine/content/assets/experiments/exp3/normalized",
    )
    parser.add_argument(
        "--exp4-root",
        default="/home/workspace/bars-engine/content/assets/experiments/exp4",
    )
    parser.add_argument("--min-pairwise-delta", type=float, default=18.0)
    parser.add_argument("--target-pass-rate", type=float, default=0.9)
    parser.add_argument("--max-seconds-per-variant", type=float, default=2.0)
    args = parser.parse_args()

    started = time.time()
    input_dir = Path(args.input_dir)
    exp4_root = Path(args.exp4_root)
    variants_dir = exp4_root / "variants"
    reports_dir = exp4_root / "reports"
    os.makedirs(variants_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    base_files = sorted(input_dir.glob("*.png"))
    if not base_files:
        raise SystemExit(f"No PNG files found in {input_dir}")

    for nation in NATIONS:
        os.makedirs(variants_dir / nation["key"], exist_ok=True)

    per_asset = []
    total_written = 0
    alpha_mismatch_assets = []

    for base_path in base_files:
        base_im = Image.open(base_path).convert("RGBA")
        base_px = list(base_im.getdata())
        nation_images = {}
        delta_from_base = {}

        for nation in NATIONS:
            profile = merged_profile_for_asset(base_path.name, nation)
            out = Image.new("RGBA", base_im.size, (0, 0, 0, 0))
            out_px = []
            for r, g, b, a in base_px:
                if a == 0:
                    out_px.append((0, 0, 0, 0))
                    continue
                nr, ng, nb = recolor_pixel((r, g, b), profile)
                out_px.append((nr, ng, nb, a))
            out.putdata(out_px)
            out_path = variants_dir / nation["key"] / base_path.name
            out.save(out_path, format="PNG", optimize=True)
            total_written += 1

            nation_images[nation["key"]] = out
            delta_from_base[nation["key"]] = round(image_mean_delta(base_im, out), 3)
            if not alpha_masks_match(base_im, out):
                alpha_mismatch_assets.append(f"{nation['key']}/{base_path.name}")

        keys = [n["key"] for n in NATIONS]
        pairwise = []
        for i in range(len(keys)):
            for j in range(i + 1, len(keys)):
                k1, k2 = keys[i], keys[j]
                d = image_mean_delta(nation_images[k1], nation_images[k2])
                pairwise.append({"pair": f"{k1}__{k2}", "mean_delta": round(d, 3)})
        min_pair = min(x["mean_delta"] for x in pairwise) if pairwise else 0.0
        mean_pair = sum(x["mean_delta"] for x in pairwise) / len(pairwise) if pairwise else 0.0
        per_asset.append(
            {
                "asset": base_path.name,
                "delta_from_base": delta_from_base,
                "pairwise": pairwise,
                "min_pairwise_delta": round(min_pair, 3),
                "avg_pairwise_delta": round(mean_pair, 3),
                "differentiation_pass": bool(min_pair >= args.min_pairwise_delta),
            }
        )

    elapsed = time.time() - started
    total_assets = len(base_files)
    expected_variants = total_assets * len(NATIONS)
    coverage_pass = total_written == expected_variants
    alpha_lockstep_pass = len(alpha_mismatch_assets) == 0
    differentiation_pass_count = sum(1 for row in per_asset if row["differentiation_pass"])
    differentiation_pass_rate = differentiation_pass_count / total_assets if total_assets else 0.0
    speed_seconds_per_variant = elapsed / expected_variants if expected_variants else 0.0
    speed_pass = speed_seconds_per_variant <= args.max_seconds_per_variant
    differentiation_gate_pass = differentiation_pass_rate >= args.target_pass_rate
    overall_pass = coverage_pass and alpha_lockstep_pass and differentiation_gate_pass and speed_pass

    payload = {
        "experiment": "Experiment 4 - Nation Skinning Test",
        "timestamp_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "input_dir": str(input_dir),
        "output_variants_dir": str(variants_dir),
        "assets_base_count": total_assets,
        "nations_count": len(NATIONS),
        "nations": [n["key"] for n in NATIONS],
        "timing": {
            "total_seconds": round(elapsed, 3),
            "seconds_per_variant": round(speed_seconds_per_variant, 4),
        },
        "gate": {
            "min_pairwise_delta_threshold": args.min_pairwise_delta,
            "target_differentiation_pass_rate": args.target_pass_rate,
            "max_seconds_per_variant": args.max_seconds_per_variant,
            "coverage_pass": coverage_pass,
            "alpha_lockstep_pass": alpha_lockstep_pass,
            "differentiation_pass_rate": round(differentiation_pass_rate, 3),
            "differentiation_pass": differentiation_gate_pass,
            "speed_pass": speed_pass,
            "overall_pass": overall_pass,
        },
        "counts": {
            "expected_variants": expected_variants,
            "written_variants": total_written,
            "differentiation_pass_assets": differentiation_pass_count,
            "differentiation_fail_assets": total_assets - differentiation_pass_count,
            "alpha_mismatches": len(alpha_mismatch_assets),
        },
        "alpha_mismatch_assets": alpha_mismatch_assets,
        "per_asset": per_asset,
    }

    results_json = reports_dir / "exp4_results.json"
    results_csv = reports_dir / "exp4_asset_scores.csv"
    results_md = reports_dir / "EXPERIMENT4_NATION_SKINNING_RESULTS.md"
    contact_sheet = reports_dir / "exp4_nation_contact_sheet.png"

    with open(results_json, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    with open(results_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "asset",
                "min_pairwise_delta",
                "avg_pairwise_delta",
                "differentiation_pass",
                "argyra_delta",
                "lamenth_delta",
                "meridia_delta",
                "pyrakanth_delta",
                "virelune_delta",
            ]
        )
        for row in per_asset:
            writer.writerow(
                [
                    row["asset"],
                    row["min_pairwise_delta"],
                    row["avg_pairwise_delta"],
                    row["differentiation_pass"],
                    row["delta_from_base"]["argyra"],
                    row["delta_from_base"]["lamenth"],
                    row["delta_from_base"]["meridia"],
                    row["delta_from_base"]["pyrakanth"],
                    row["delta_from_base"]["virelune"],
                ]
            )

    lines: List[str] = []
    lines.append("# Experiment 4 Results: Nation Skinning Test")
    lines.append("")
    lines.append(f"- Overall gate: **{'PASS' if overall_pass else 'FAIL'}**")
    lines.append(f"- Base assets: **{total_assets}**")
    lines.append(f"- Nations: **{len(NATIONS)}**")
    lines.append(f"- Variants generated: **{total_written}/{expected_variants}**")
    lines.append(f"- Differentiation pass rate: **{round(differentiation_pass_rate * 100.0, 1)}%**")
    lines.append(f"- Seconds per variant: **{round(speed_seconds_per_variant, 4)}**")
    lines.append("")
    lines.append("## Gate Checks")
    lines.append(f"- Coverage pass: `{coverage_pass}`")
    lines.append(f"- Alpha lockstep pass: `{alpha_lockstep_pass}`")
    lines.append(f"- Differentiation pass: `{differentiation_gate_pass}` (threshold min pairwise `>= {args.min_pairwise_delta}`, target pass-rate `>= {args.target_pass_rate}`)")
    lines.append(f"- Speed pass: `{speed_pass}` (threshold `<= {args.max_seconds_per_variant} s/variant`)")
    lines.append("")
    lines.append("## Asset Differentiation")
    lines.append("| asset | min_pairwise_delta | avg_pairwise_delta | pass |")
    lines.append("|---|---:|---:|---|")
    for row in per_asset:
        lines.append(
            f"| {row['asset']} | {row['min_pairwise_delta']} | {row['avg_pairwise_delta']} | {row['differentiation_pass']} |"
        )
    lines.append("")
    lines.append("## Artifacts")
    lines.append(f"- `{results_json}`")
    lines.append(f"- `{results_csv}`")
    lines.append(f"- `{results_md}`")
    lines.append(f"- `{contact_sheet}`")

    with open(results_md, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    write_contact_sheet(
        asset_names=[p.name for p in base_files],
        nations=NATIONS,
        variants_dir=variants_dir,
        output_path=contact_sheet,
    )

    print(results_json)
    print(results_csv)
    print(results_md)
    print(contact_sheet)
    print(f"overall_pass={overall_pass} differentiation_pass_rate={round(differentiation_pass_rate, 3)}")


if __name__ == "__main__":
    main()
