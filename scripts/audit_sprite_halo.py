#!/usr/bin/env python3
import argparse
import csv
import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

KNOWN_CHROMA_BG_COLORS = (
    (0.0, 255.0, 0.0),
    (255.0, 0.0, 255.0),
)


def color_distance(a, b):
    return math.sqrt(
        (float(a[0]) - float(b[0])) ** 2
        + (float(a[1]) - float(b[1])) ** 2
        + (float(a[2]) - float(b[2])) ** 2
    )


def neighbors(x, y, w, h):
    out = []
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h:
            out.append((nx, ny))
    return out


def min_bg_distance(rgb):
    return min(color_distance(rgb, c) for c in KNOWN_CHROMA_BG_COLORS)


def is_chroma_like(rgb):
    r, g, b = int(rgb[0]), int(rgb[1]), int(rgb[2])
    green_like = g > 175 and r < 95 and b < 95 and g - max(r, b) > 70
    magenta_like = r > 175 and b > 175 and g < 95 and min(r, b) - g > 70
    return green_like or magenta_like


def nearby_opaque_mean(data, x, y, w, h, radius=2):
    values = []
    for yy in range(max(0, y - radius), min(h, y + radius + 1)):
        for xx in range(max(0, x - radius), min(w, x + radius + 1)):
            if xx == x and yy == y:
                continue
            p = data[yy * w + xx]
            if p[3] >= 250:
                values.append(p[:3])
    if not values:
        return None
    n = len(values)
    return (
        sum(v[0] for v in values) / n,
        sum(v[1] for v in values) / n,
        sum(v[2] for v in values) / n,
    )


def audit_image(
    path: Path,
    alpha_max: int,
    dist_threshold: float,
    ratio_threshold: float,
    bg_dist_threshold: float,
    bg_ratio_threshold: float,
    edge_warn_ratio_threshold: float,
):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    data = list(im.getdata())

    edge_candidates = 0
    suspicious = 0
    suspicious_bg = 0
    sample_distances = []
    sample_bg_distances = []

    for y in range(h):
        for x in range(w):
            p = data[y * w + x]
            a = p[3]
            if a <= 0 or a >= 255:
                continue
            if a > alpha_max:
                continue
            has_transparent_neighbor = False
            for nx, ny in neighbors(x, y, w, h):
                if data[ny * w + nx][3] == 0:
                    has_transparent_neighbor = True
                    break
            if not has_transparent_neighbor:
                continue

            edge_candidates += 1
            mean_rgb = nearby_opaque_mean(data, x, y, w, h)
            if mean_rgb is None:
                continue

            d = color_distance(p[:3], mean_rgb)
            bg_d = min_bg_distance(p[:3])
            sample_distances.append(d)
            sample_bg_distances.append(bg_d)
            if d >= dist_threshold:
                suspicious += 1
            if bg_d <= bg_dist_threshold and is_chroma_like(p[:3]):
                suspicious_bg += 1

    ratio = (suspicious / edge_candidates) if edge_candidates else 0.0
    bg_ratio = (suspicious_bg / edge_candidates) if edge_candidates else 0.0
    flag_fail_bg = bg_ratio >= bg_ratio_threshold
    flag_warn_edge = ratio >= edge_warn_ratio_threshold

    return {
        "asset": path.name,
        "mode": im.mode,
        "size": f"{w}x{h}",
        "edge_semialpha_pixels": edge_candidates,
        "suspicious_pixels": suspicious,
        "bg_suspicious_pixels": suspicious_bg,
        "halo_ratio": round(ratio, 4),
        "bg_halo_ratio": round(bg_ratio, 4),
        "distance_p95": round(sorted(sample_distances)[int(0.95 * (len(sample_distances) - 1))], 3)
        if sample_distances
        else 0.0,
        "bg_distance_p05": round(sorted(sample_bg_distances)[int(0.05 * (len(sample_bg_distances) - 1))], 3)
        if sample_bg_distances
        else 0.0,
        "flag_fail_bg": flag_fail_bg,
        "flag_warn_edge": flag_warn_edge,
        "production_pass": not flag_fail_bg,
    }


def dehalo_image(path: Path, out_path: Path, alpha_max: int, dist_threshold: float, bg_dist_threshold: float):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    data = list(im.getdata())
    out = data[:]
    changed = 0

    for y in range(h):
        for x in range(w):
            p = data[y * w + x]
            a = p[3]
            if a <= 0 or a >= 255 or a > alpha_max:
                continue
            has_transparent_neighbor = False
            for nx, ny in neighbors(x, y, w, h):
                if data[ny * w + nx][3] == 0:
                    has_transparent_neighbor = True
                    break
            if not has_transparent_neighbor:
                continue

            mean_rgb = nearby_opaque_mean(data, x, y, w, h)
            if mean_rgb is None:
                continue

            d = color_distance(p[:3], mean_rgb)
            bg_d = min_bg_distance(p[:3])
            if d < dist_threshold and not (bg_d <= bg_dist_threshold and is_chroma_like(p[:3])):
                continue

            t = min(1.0, (d - dist_threshold) / max(1.0, 255.0 - dist_threshold))
            t = 0.25 + (0.70 * t)
            nr = int(round((1 - t) * p[0] + t * mean_rgb[0]))
            ng = int(round((1 - t) * p[1] + t * mean_rgb[1]))
            nb = int(round((1 - t) * p[2] + t * mean_rgb[2]))
            na = a
            if a < 120:
                na = int(round(a * 0.85))
            out[y * w + x] = (nr, ng, nb, na)
            changed += 1

    os.makedirs(out_path.parent, exist_ok=True)
    out_im = Image.new("RGBA", (w, h))
    out_im.putdata(out)
    out_im.save(out_path, format="PNG", optimize=True)
    return changed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True)
    parser.add_argument("--output-json", required=True)
    parser.add_argument("--output-csv", required=True)
    parser.add_argument("--output-md", required=True)
    parser.add_argument("--fix-dir")
    parser.add_argument("--alpha-max", type=int, default=220)
    parser.add_argument("--dist-threshold", type=float, default=42.0)
    parser.add_argument("--ratio-threshold", type=float, default=0.15)
    parser.add_argument("--bg-dist-threshold", type=float, default=60.0)
    parser.add_argument("--bg-ratio-threshold", type=float, default=0.08)
    parser.add_argument("--edge-warn-ratio-threshold", type=float, default=0.15)
    args = parser.parse_args()

    in_dir = Path(args.input_dir)
    files = sorted(in_dir.glob("*.png"))
    fixed_changes = []
    if args.fix_dir:
        fix_dir = Path(args.fix_dir)
        os.makedirs(fix_dir, exist_ok=True)
        for p in files:
            c = dehalo_image(
                p,
                out_path=fix_dir / p.name,
                alpha_max=args.alpha_max,
                dist_threshold=args.dist_threshold,
                bg_dist_threshold=args.bg_dist_threshold,
            )
            fixed_changes.append({"asset": p.name, "changed_pixels": c})
        files = sorted(fix_dir.glob("*.png"))

    results = [
        audit_image(
            p,
            alpha_max=args.alpha_max,
            dist_threshold=args.dist_threshold,
            ratio_threshold=args.ratio_threshold,
            bg_dist_threshold=args.bg_dist_threshold,
            bg_ratio_threshold=args.bg_ratio_threshold,
            edge_warn_ratio_threshold=args.edge_warn_ratio_threshold,
        )
        for p in files
    ]

    failed_bg = [r for r in results if r["flag_fail_bg"]]
    warned_edge = [r for r in results if r["flag_warn_edge"]]
    payload = {
        "timestamp_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "input_dir": str(in_dir),
        "assets_scanned": len(results),
        "thresholds": {
            "alpha_max": args.alpha_max,
            "distance_threshold": args.dist_threshold,
            "ratio_threshold": args.ratio_threshold,
            "bg_distance_threshold": args.bg_dist_threshold,
            "bg_ratio_threshold": args.bg_ratio_threshold,
            "edge_warn_ratio_threshold": args.edge_warn_ratio_threshold,
        },
        "production_gate": "FAIL only when bg_halo_ratio >= bg_ratio_threshold; edge ratio is warning-only.",
        "failed_bg_count": len(failed_bg),
        "failed_bg_assets": [r["asset"] for r in failed_bg],
        "warned_edge_count": len(warned_edge),
        "warned_edge_assets": [r["asset"] for r in warned_edge],
        "fix_mode": bool(args.fix_dir),
        "fix_dir": args.fix_dir if args.fix_dir else None,
        "fix_changes": fixed_changes,
        "results": results,
    }

    os.makedirs(Path(args.output_json).parent, exist_ok=True)
    with open(args.output_json, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    with open(args.output_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "asset",
                "mode",
                "size",
                "edge_semialpha_pixels",
                "suspicious_pixels",
                "bg_suspicious_pixels",
                "halo_ratio",
                "bg_halo_ratio",
                "distance_p95",
                "bg_distance_p05",
                "flag_fail_bg",
                "flag_warn_edge",
                "production_pass",
            ]
        )
        for r in results:
            w.writerow(
                [
                    r["asset"],
                    r["mode"],
                    r["size"],
                    r["edge_semialpha_pixels"],
                    r["suspicious_pixels"],
                    r["bg_suspicious_pixels"],
                    r["halo_ratio"],
                    r["bg_halo_ratio"],
                    r["distance_p95"],
                    r["bg_distance_p05"],
                    r["flag_fail_bg"],
                    r["flag_warn_edge"],
                    r["production_pass"],
                ]
            )

    lines = []
    lines.append("# Sprite Halo Audit")
    lines.append("")
    lines.append(f"- Scanned: **{len(results)}**")
    lines.append("- Production rule: **fail on `bg_halo_ratio`, warn on `halo_ratio`**")
    lines.append(f"- Production failures (BG spill): **{len(failed_bg)}**")
    lines.append(f"- Edge warnings: **{len(warned_edge)}**")
    lines.append(f"- Alpha max: `{args.alpha_max}`")
    lines.append(f"- Distance threshold: `{args.dist_threshold}`")
    lines.append(f"- Halo ratio threshold: `{args.ratio_threshold}`")
    lines.append(f"- BG distance threshold: `{args.bg_dist_threshold}`")
    lines.append(f"- BG ratio threshold: `{args.bg_ratio_threshold}`")
    lines.append(f"- Edge warn ratio threshold: `{args.edge_warn_ratio_threshold}`")
    lines.append(f"- Fix mode: `{bool(args.fix_dir)}`")
    if args.fix_dir:
        total_changed = sum(row["changed_pixels"] for row in fixed_changes)
        lines.append(f"- Changed edge pixels: **{total_changed}**")
    lines.append("")
    if failed_bg:
        lines.append("## Production Fail (BG Spill)")
        for r in failed_bg:
            lines.append(f"- `{r['asset']}` (bg_ratio={r['bg_halo_ratio']}, bg_p05={r['bg_distance_p05']})")
    else:
        lines.append("## Production Fail (BG Spill)")
        lines.append("- None")
    lines.append("")
    if warned_edge:
        lines.append("## Edge Warnings")
        for r in warned_edge:
            lines.append(f"- `{r['asset']}` (edge_ratio={r['halo_ratio']}, p95={r['distance_p95']})")
    else:
        lines.append("## Edge Warnings")
        lines.append("- None")
    lines.append("")
    lines.append("## All Assets")
    lines.append("| asset | edge_semialpha | suspicious | bg_suspicious | halo_ratio | bg_halo_ratio | p95 | fail_bg | warn_edge | pass |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|---|---|---|")
    for r in results:
        lines.append(
            f"| {r['asset']} | {r['edge_semialpha_pixels']} | {r['suspicious_pixels']} | {r['bg_suspicious_pixels']} | {r['halo_ratio']} | {r['bg_halo_ratio']} | {r['distance_p95']} | {r['flag_fail_bg']} | {r['flag_warn_edge']} | {r['production_pass']} |"
        )
    with open(args.output_md, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(args.output_json)
    print(args.output_csv)
    print(args.output_md)
    print(f"failed_bg={len(failed_bg)}/{len(results)} warned_edge={len(warned_edge)}/{len(results)}")


if __name__ == "__main__":
    main()
