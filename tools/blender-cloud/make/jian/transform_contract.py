"""Typed, dependency-aware transformation contract for rigid game assets.

This module uses only Python's standard library so another environment can
validate a design packet before invoking Blender or a browser.
"""
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
HEX = set("0123456789abcdefABCDEF")
POMMELS = {"square", "ring", "hex_point", "droplet", "seed", "stone"}
DETAIL_TARGETS = {"flame_tines":"Guard", "flame_inlay":"Grip", "wood_scales":"Grip", "leaf_terminals":"Guard"}

def _number(value, lo, hi, where):
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value) or not lo <= value <= hi:
        raise ValueError(f"{where}: expected finite number in [{lo}, {hi}]")
    return float(value)

def _color(value, where):
    if not isinstance(value, str) or len(value) != 7 or value[0] != "#" or any(c not in HEX for c in value[1:]):
        raise ValueError(f"{where}: expected #RRGGBB")
    return value

def compile_jian(path):
    raw = json.loads(Path(path).read_text())
    if raw.get("schema") != "calrunia.jian_identity.v1":
        raise ValueError("unexpected jian identity schema")
    common = raw["base"]
    blade = _number(common["blade_length_m"], .6, 1.2, "blade length")
    whole = _number(common["overall_length_m"], .8, 1.5, "overall length")
    if not .15 <= whole - blade <= .32:
        raise ValueError("hilt length outside jian family")
    variants = raw["variants"]
    if len(variants) != 5 or len(set(variants)) != 5:
        raise ValueError("expected five unique nation variants")
    out = {"schema": raw["schema"], "source": raw.get("source"), "base": common, "variants": {}}
    for name, v in variants.items():
        allowed = {"blade_profile", "guard_arms", "pommel", "grip_radius_multiplier", "palette", "design_intent", "source_cue", "detail_ops"}
        extra = set(v) - allowed
        if extra: raise ValueError(f"{name}: unknown operations {sorted(extra)}")
        profile = v["blade_profile"]
        if len(profile) != 8: raise ValueError(f"{name}: blade profile needs eight ring multipliers")
        profile = [_number(x, .55, 1.8, f"{name} blade profile") for x in profile]
        arms = v["guard_arms"]
        if not 2 <= len(arms) <= 6: raise ValueError(f"{name}: guard needs 2-6 arm segments")
        compiled_arms = []
        for arm in arms:
            if set(arm) != {"from", "to", "radius_m"}: raise ValueError(f"{name}: guard arm fields")
            a, b = arm["from"], arm["to"]
            if len(a) != 2 or len(b) != 2: raise ValueError(f"{name}: guard points are [x,z]")
            a = [_number(x, -.11, .11, f"{name} guard point") for x in a]
            b = [_number(x, -.11, .11, f"{name} guard point") for x in b]
            if math.dist(a,b) < .008: raise ValueError(f"{name}: guard segment too short")
            compiled_arms.append({"from": a, "to": b, "radius_m": _number(arm["radius_m"], .003, .014, f"{name} guard radius")})
        if v["pommel"] not in POMMELS: raise ValueError(f"{name}: unknown pommel type")
        palette = v["palette"]
        if set(palette) != {"blade", "guard", "grip", "pommel"}: raise ValueError(f"{name}: incomplete material roles")
        palette = {role: _color(color, f"{name} {role}") for role,color in palette.items()}
        details=[]
        for op in v.get("detail_ops",[]):
            if set(op)!={"kind","target","count","length_m","color"}: raise ValueError(f"{name}: detail operation fields")
            kind=op["kind"]
            if kind not in DETAIL_TARGETS or op["target"]!=DETAIL_TARGETS[kind]: raise ValueError(f"{name}: invalid detail target")
            count=op["count"]
            if isinstance(count,bool) or not isinstance(count,int) or not 2<=count<=6: raise ValueError(f"{name}: detail count")
            details.append({"kind":kind,"target":op["target"],"count":count,
                            "length_m":_number(op["length_m"],.015,.12,f"{name} detail length"),
                            "color":_color(op["color"],f"{name} detail color")})
        out["variants"][name] = {
            "blade_profile": profile, "guard_arms": compiled_arms,
            "pommel": v["pommel"],
            "grip_radius_multiplier": _number(v["grip_radius_multiplier"], .75, 1.35, f"{name} grip radius"),
            "palette": palette, "detail_ops": details, "design_intent": v["design_intent"], "source_cue": v["source_cue"],
            "derived": {"hilt_length_m": round(whole-blade, 6), "max_blade_width_m": round(.048*max(profile), 6),
                        "guard_span_m": round(max(p["to"][0] for p in compiled_arms)-min(p["to"][0] for p in compiled_arms), 6)},
        }
    return out

def compile_gourd(path):
    raw = json.loads(Path(path).read_text())
    if raw.get("schema") != "calrunia.prop_transform.v0": raise ValueError("unexpected gourd schema")
    inv = raw["invariants"]
    clearance = _number(inv["minimum_skirt_clearance_m"], .008, .03, "skirt clearance")
    variants = {}
    for name, v in raw["variants"].items():
        allowed = {"height_multiplier", "body_radius_multiplier", "upper_bulb_radius_ratio", "upper_bulb_height_multiplier", "body_color", "cord_color"}
        if set(v) != allowed: raise ValueError(f"{name}: missing or unknown gourd operations")
        compiled = {k: _number(v[k], *bounds, f"{name} {k}") for k,bounds in {
            "height_multiplier": (.8,1.2), "body_radius_multiplier": (.8,1.2),
            "upper_bulb_radius_ratio": (.35,.8), "upper_bulb_height_multiplier": (.75,1.25),
        }.items()}
        for k in ("body_color","cord_color"):
            compiled[k] = "outfit_default" if v[k] == "outfit_default" else _color(v[k], f"{name} {k}")
        compiled["derived"] = {"body_radius_m_at_unit_scale": round(.052*compiled["body_radius_multiplier"], 6),
                               "height_m_at_unit_scale": round(.2*compiled["height_multiplier"], 6),
                               "required_clearance_m": clearance,
                               "recompute_skirt_clearance": True}
        variants[name] = compiled
    return {"schema": raw["schema"], "source": raw["source"], "invariants": inv, "variants": variants}

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("kind", choices=["jian", "gourd"])
    p.add_argument("spec", type=Path)
    p.add_argument("--output", type=Path)
    args = p.parse_args()
    result = (compile_jian if args.kind == "jian" else compile_gourd)(args.spec)
    if args.output: args.output.write_text(json.dumps(result, indent=2))
    else: print(json.dumps(result, indent=2))
