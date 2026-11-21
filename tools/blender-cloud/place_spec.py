"""The place generator's mapper: a player state in, a place spec (YAML) out. Pure Python, no packages, no randomness.

    python3 tools/blender-cloud/place_spec.py state.json            # one spec to stdout
    python3 tools/blender-cloud/place_spec.py --strip OUT_DIR       # the eight states of the first strip

Spec: six-faces-council .specify/specs/place-generator/ (spec.md contracts 1 to 3, plan.md). The first slice is the cave's
brow seat. Every value in the tables below was first written by hand for the falsifier (council pass
place-generator-falsify-1, 2026-10-26) and carries the board row or ontology key that decided it in `cites`.

What the state moves in this slice, and what it does not:
  element        extent, mouth, palette band, props, materials, camera, and the light's shape for fire and water
  charge.floor   how far the carried light reaches (lit_m) and the shape of the lit run
  charge.route_open  false lights the arrival only (mab-unlit-path-still-arrives); the run itself stays dark
  place          must be `cave` (the only place with a floor in council/look/floors.json is cave-tunnel)
  altitude, cycle_step, daemons_settled, relationship, qi, line
                 validated and hashed into the seed, and they change nothing yet: the falsifier held them constant
                 (altitude 3, grow), so there is no hand-written evidence of what they should do. A later round adds a
                 row to the tables when one exists. Altitude never selects rank (hard_invariants.type_is_not_level).

The seed is the first 8 hex of sha256 over the canonical state (sorted keys, no spaces); the passport's own number is
written beside it as `state_seed`. Same state, same bytes.
"""
import hashlib
import json
import sys
from pathlib import Path

PLACES = ("cave",)
ELEMENTS = ("metal", "wood", "water", "fire", "earth")
FLOORS = ("lower", "middle", "upper")
CYCLE = ("Wake", "Clean", "Grow", "Show", "wake", "clean", "grow", "show")
RELATIONSHIPS = ("none", "shared")

# charge floor -> how far the carried light reaches, in metres (mab-floor-sets-reach). A route never outruns its floor.
REACH_M = {"lower": 2.2, "middle": 9.5, "upper": 26.0}
FLOOR_SHAPE = {
    "lower": "a disc of wet stone at the seat's own ground, out to the first step of the run",
    "middle": "the run of floor from the seat to the next bend, stopping there",
    "upper": "every metre of the run, the far seat at its end, and the water in that basin",
}

# One row per element: what the element does to the place. `light_shape` replaces the floor's shape where the element
# changes how light lies (el-mapping); None keeps the floor's shape. Bands are inside lc-floor-value/surface/colour.
ELEMENT = {
    "metal": dict(
        length_m=18, height_m=6, mouth="far", mode="warm_mid_grey",
        band=dict(luminance=(0.09, 0.14), edge=(0.028, 0.037), saturation=(0.15, 0.19), warmth=(-0.01, 0.02)),
        props=[("crystal", 3, "procgen"), ("root", 7, "procgen")],
        camera=(1.7, 60), materials=[("stone", "cave-texture@v1"), ("ground", "wet-stone@v1")],
        light_shape=None, light_source="carried"),
    "wood": dict(
        length_m=22, height_m=7, mouth="near", mode="green_dusk",
        band=dict(luminance=(0.07, 0.16), edge=(0.030, 0.045), saturation=(0.18, 0.28), warmth=(-0.04, 0.02)),
        props=[("root", 9, "procgen"), ("mushroom", 6, "procgen"), ("grass_clump", 3, "procgen")],
        camera=(1.7, 60), materials=[("bark", "bark@v1"), ("ground", "root-loam@v1"), ("understory", "moss@v1")],
        light_shape={"middle": "the run of ground from the seat to the next bend, past roots that hang into it"},
        light_source="carried"),
    "water": dict(
        length_m=16, height_m=4.5, mouth="wide", mode="still_blue",
        band=dict(luminance=(0.06, 0.18), edge=(0.026, 0.038), saturation=(0.10, 0.22), warmth=(-0.05, -0.01)),
        props=[("shell", 5, "procgen"), ("tide_pool", 2, "procgen"), ("reef", 4, "procgen")],
        camera=(1.7, 60), materials=[("stone", "wet-stone@v1"), ("ground", "sand@v1"), ("water", "still-water@v1")],
        light_shape={"middle": "the run across a wet floor; its far half lies below the water line and the light pools there"},
        light_source="carried"),
    "fire": dict(
        length_m=20, height_m=8, mouth="low", mode="ember_red_orange",
        band=dict(luminance=(0.08, 0.22), edge=(0.030, 0.050), saturation=(0.20, 0.30), warmth=(0.06, 0.15)),
        props=[("basalt_column", 4, "procgen"), ("lava_seam", 3, "procgen"), ("ember_drift", 12, "procgen")],
        camera=(1.7, 60), materials=[("stone", "basalt@v1"), ("seam", "lava-seam@v1"), ("ground", "ash@v1")],
        light_shape={"middle": "the run between two seams that glow on their own; the carried light is the weaker of the two"},
        light_source="carried, and the seams"),
    "earth": dict(
        length_m=30, height_m=3, mouth="a_barrow_door", mode="amber_plain",
        band=dict(luminance=(0.07, 0.20), edge=(0.026, 0.040), saturation=(0.12, 0.24), warmth=(0.01, 0.06)),
        props=[("standing_stone", 5, "procgen"), ("grass_clump", 8, "procgen"), ("barrow_door", 1, "build_kit")],
        camera=(1.6, 72), materials=[("ground", "grass@v1"), ("wall", "packed-earth@v1"), ("stone", "standing-stone@v1")],
        light_shape={"middle": "low and wide; the run crosses open ground with no ceiling over it and the horizon stays dim"},
        light_source="carried"),
}
CLOSED_SHAPE = "no light on the run at all; one lit seam where the run arrives, and its edge is what you steer by"


def canonical(state):
    """Sorted keys, no spaces: the text the seed and `from_state` are taken from."""
    return json.dumps(state, sort_keys=True, separators=(",", ":"))


def digest(state):
    return hashlib.sha256(canonical(state).encode()).hexdigest()


def validate(state):
    def need(cond, msg):
        if not cond:
            raise ValueError(f"state: {msg}")
    need(state.get("place") in PLACES, f"place must be one of {PLACES} (only the cave has a look floor)")
    need(state.get("element") in ELEMENTS, f"element must be one of {ELEMENTS}")
    charge = state.get("charge") or {}
    need(charge.get("floor") in FLOORS, f"charge.floor must be one of {FLOORS}")
    need(isinstance(charge.get("route_open"), bool), "charge.route_open must be true or false")
    need(isinstance(state.get("altitude"), int) and 1 <= state["altitude"] <= 8, "altitude must be 1..8")
    need(state.get("cycle_step") in CYCLE, f"cycle_step must be one of {CYCLE[:4]}")
    need(isinstance(state.get("daemons_settled"), int) and state["daemons_settled"] >= 0, "daemons_settled must be an integer >= 0")
    need(state.get("relationship") in RELATIONSHIPS, f"relationship must be one of {RELATIONSHIPS}")
    need(isinstance(state.get("qi"), (int, float)) and 0 <= state["qi"] <= 1, "qi must be 0..1")
    need(isinstance(state.get("seed"), int), "seed must be an integer (the passport's own)")


def place_id(state):
    c = state["charge"]
    tail = "" if c["route_open"] else "-route-closed"
    return f"cave-brow-{state['element']}-{c['floor']}{tail}"


def build(state):
    """The place spec as a plain dict. Pure: the same state returns the same dict."""
    validate(state)
    e, c = ELEMENT[state["element"]], state["charge"]
    floor, open_ = c["floor"], c["route_open"]
    h = digest(state)
    shapes = e["light_shape"] or {}
    shape = CLOSED_SHAPE if not open_ else shapes.get(floor, FLOOR_SHAPE[floor])
    light = dict(reach=floor, lit_m=REACH_M[floor], shape=shape, beyond="dark", source=e["light_source"])
    if not open_:
        light["arrival_lit"] = True
    if floor == "upper" and open_:
        light["far_answer_lit"] = False
    return dict(
        id=place_id(state), from_state=h, seed=h[:8], state_seed=state["seed"],
        extent=dict(length_m=e["length_m"], height_m=e["height_m"], mouth=e["mouth"]),
        seats=[dict(id="brow", element=state["element"], floor=floor, route_to="heart", lit=True)],
        light=light,
        palette=dict(mode=e["mode"], band=e["band"]),
        props=[dict(kind=k, count=n, src=s) for k, n, s in e["props"]],
        camera=dict(height_m=e["camera"][0], fov_deg=e["camera"][1]),
        materials=dict(e["materials"]),
    )


def cites(spec, state):
    """field path -> the board row or ontology key that decided it. Every value in the spec has one."""
    el = state["element"]
    light_shape = "mab-floor-sets-reach"
    if not state["charge"]["route_open"]:
        light_shape = "mab-unlit-path-still-arrives"
    elif el != "metal" and ELEMENT[el]["light_shape"] and state["charge"]["floor"] in ELEMENT[el]["light_shape"]:
        light_shape = "el-mapping"
    out = {
        "extent.length_m": "mab-landscape-not-anatomy", "extent.height_m": "el-mapping", "extent.mouth": "mab-one-mouth",
        "seats[0].id": "mab-seat-is-a-spring", "seats[0].element": "el-mapping", "seats[0].floor": "mab-floor-sets-reach",
        "seats[0].route_to": "mab-path-follows-cycle", "seats[0].lit": "mab-arrival-not-status",
        "light.reach": "mab-floor-sets-reach", "light.lit_m": "mab-floor-sets-reach", "light.shape": light_shape,
        "light.beyond": "depth_over_flatland", "light.source": "el-mapping" if el == "fire" else "depth_over_flatland",
    }
    if "arrival_lit" in spec["light"]:
        out["light.arrival_lit"] = "mab-unlit-path-still-arrives"
    if "far_answer_lit" in spec["light"]:
        out["light.far_answer_lit"] = "mab-heart-is-the-vantage"
    out.update({
        "palette.mode": "el-mapping", "palette.band.luminance": "lc-floor-value", "palette.band.edge": "lc-floor-surface",
        "palette.band.saturation": "lc-floor-colour", "palette.band.warmth": "lc-floor-colour",
    })
    for i in range(len(spec["props"])):
        out[f"props[{i}]"] = "el-mapping"
        out[f"props[{i}].from"] = "asset_sourcing.source_channels"
    out["camera.height_m"] = "mab-walk-stand-trace"
    out["camera.fov_deg"] = "extent.length_m"
    for k in spec["materials"]:
        out[f"materials.{k}"] = "asset_sourcing.source_channels"
    out["state_seed"] = "passport.seed"
    if state.get("line"):
        out["line"] = f"development_lines.{state['line']}"
    return out


def _n(v):
    return f"{v:.3f}".rstrip("0").rstrip(".") if isinstance(v, float) and not float(v).is_integer() else (
        f"{v:.1f}" if isinstance(v, float) else str(v))


def _band(v, digits=2):
    return "[" + ", ".join(f"{x:.{digits}f}" for x in v) + "]"


def to_yaml(state):
    """The spec as YAML text, written by hand so the bytes cannot depend on a library's version."""
    s = build(state)
    L = ["# Generated by tools/blender-cloud/place_spec.py from the state below. Do not edit; change the state or the tables.",
         "# Canonical state json, keys sorted, no spaces:", f"# {canonical(state)}", "", "place:"]
    a = L.append
    a(f"  id: {s['id']}")
    a(f"  from_state: {s['from_state']}")
    a(f"  seed: {s['seed']}")
    a(f"  state_seed: {s['state_seed']}")
    a("  extent:")
    for k, v in s["extent"].items():
        a(f"    {k}: {_n(v)}")
    a("  seats:")
    for seat in s["seats"]:
        first = True
        for k, v in seat.items():
            a(f"    {'- ' if first else '  '}{k}: {str(v).lower() if isinstance(v, bool) else v}")
            first = False
    a("  light:")
    for k, v in s["light"].items():
        a(f"    {k}: {str(v).lower() if isinstance(v, bool) else _n(v)}")
    a("  palette:")
    a(f"    mode: {s['palette']['mode']}")
    a("    band:")
    for k, v in s["palette"]["band"].items():
        a(f"      {k}: {_band(v, 3 if k == 'edge' else 2)}")
    a("  props:")
    for p in s["props"]:
        a(f"    - {{kind: {p['kind']}, count: {p['count']}, from: {p['src']}}}")
    a(f"  camera: {{height_m: {_n(s['camera']['height_m'])}, fov_deg: {s['camera']['fov_deg']}}}")
    a("  materials:")
    for k, v in s["materials"].items():
        a(f"    {k}: {v}")
    a("  cites:")
    for k, v in cites(s, state).items():
        a(f"    {k}: {v}")
    return "\n".join(L) + "\n"


def base_state(**over):
    st = dict(place="cave", element="metal", altitude=3, charge=dict(floor="middle", route_open=True), cycle_step="grow",
              daemons_settled=2, relationship="none", qi=0.4, seed=41)
    st.update(over)
    return st


def strip_states():
    """The first strip: one state per charge floor at metal, one per other element at the middle floor, and the
    middle floor with its route closed. Cycle step held at grow (plan.md, the eighth state)."""
    out = [base_state(charge=dict(floor=f, route_open=True)) for f in FLOORS]
    out += [base_state(element=e) for e in ("wood", "water", "fire", "earth")]
    out.append(base_state(charge=dict(floor="middle", route_open=False)))
    return out


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--strip":
        d = Path(sys.argv[2])
        d.mkdir(parents=True, exist_ok=True)
        for st in strip_states():
            (d / f"{place_id(st)}.yaml").write_text(to_yaml(st))
            (d / f"{place_id(st)}.state.json").write_text(canonical(st) + "\n")
        print(f"wrote {len(strip_states())} specs to {d}")
    elif len(sys.argv) == 2:
        sys.stdout.write(to_yaml(json.loads(Path(sys.argv[1]).read_text())))
    else:
        sys.exit(__doc__)
