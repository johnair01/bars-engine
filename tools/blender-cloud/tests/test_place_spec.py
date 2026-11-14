"""The place generator's mapper (spec: six-faces-council .specify/specs/place-generator/spec.md, "The four assertions").
Plain Python 3, no packages, no network.

usage: python3 tools/blender-cloud/tests/test_place_spec.py [PG1,PG2,...]
"""
import json, os, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import TOOLS, check, main, test, tmpdir  # noqa: E402

sys.path.insert(0, str(TOOLS))
import place_spec as ps  # noqa: E402


def spec_of(state):
    return ps.build(state)


@test("PG1")
def pg1():
    """A charge floor names how far a route lights, and a route never outruns its floor."""
    reach = {f: spec_of(ps.base_state(charge=dict(floor=f, route_open=True)))["light"]["lit_m"] for f in ps.FLOORS}
    check(reach == {"lower": 2.2, "middle": 9.5, "upper": 26.0}, f"reach by floor: {reach}")
    for st in ps.strip_states():
        lit = spec_of(st)["light"]
        check(lit["lit_m"] == ps.REACH_M[st["charge"]["floor"]], f"{ps.place_id(st)}: lit_m {lit['lit_m']} is not its floor's reach")
    closed = spec_of(ps.base_state(charge=dict(floor="middle", route_open=False)))["light"]
    check(closed["arrival_lit"] is True and "no light on the run" in closed["shape"], "a closed route must light the arrival only")


@test("PG2")
def pg2():
    """Two states differing only in element keep the floor's reach and differ in materials, palette and warmth."""
    a, b = spec_of(ps.base_state(element="metal")), spec_of(ps.base_state(element="fire"))
    check(a["light"]["lit_m"] == b["light"]["lit_m"] and a["seats"][0]["floor"] == b["seats"][0]["floor"], "element moved the floor's reach")
    check(a["materials"] != b["materials"], "materials did not change with element")
    check(a["palette"]["band"]["warmth"] != b["palette"]["band"]["warmth"], "warmth did not change with element")
    check(a["extent"] != b["extent"], "extent did not change with element (the falsifier needs more than palette)")
    metal = [spec_of(ps.base_state(charge=dict(floor=f, route_open=True))) for f in ps.FLOORS]
    check(len({json.dumps([m["extent"], m["materials"], m["palette"], m["props"]], sort_keys=True) for m in metal}) == 1,
          "charge floor moved extent, materials, palette or props: it must move light only")


@test("PG3")
def pg3():
    """Every band sits inside the cave tunnel's four floors (council/look/floors.json, cave-tunnel)."""
    for st in ps.strip_states():
        band = spec_of(st)["palette"]["band"]
        check(band["luminance"][0] >= 0.05, f"{ps.place_id(st)}: luminance floor {band['luminance']}")
        check(band["edge"][0] >= 0.025, f"{ps.place_id(st)}: edge floor {band['edge']}")
        check(band["saturation"][1] <= 0.30, f"{ps.place_id(st)}: saturation ceiling {band['saturation']}")
        check(band["warmth"][0] >= -0.05, f"{ps.place_id(st)}: warmth floor {band['warmth']}")


@test("PG4")
def pg4():
    """Rebuilding from the state writes identical bytes, in-process and across processes, and the hash is the seed."""
    for st in ps.strip_states():
        check(ps.to_yaml(st) == ps.to_yaml(json.loads(json.dumps(st))), f"{ps.place_id(st)}: two builds differ")
        s = spec_of(st)
        check(s["seed"] == s["from_state"][:8] and s["state_seed"] == 41, f"{ps.place_id(st)}: seed rule")
    d1, d2 = tmpdir("pg4a"), tmpdir("pg4b")
    for d in (d1, d2):
        subprocess.run([sys.executable, str(TOOLS / "place_spec.py"), "--strip", str(d)], check=True, capture_output=True)
    for f in sorted(p.name for p in d1.iterdir()):
        check((d1 / f).read_bytes() == (d2 / f).read_bytes(), f"{f}: bytes differ across runs")
    check(len(list(d1.glob("*.yaml"))) == 8, "the strip is not eight places")


@test("PG5")
def pg5():
    """Every value in a spec has a cite, a bad state stops the build, and the eight are all different places."""
    for st in ps.strip_states():
        s = spec_of(st)
        c = ps.cites(s, st)
        for path in ("extent.length_m", "extent.height_m", "extent.mouth", "light.lit_m", "light.shape", "palette.band.edge",
                     "camera.fov_deg", "state_seed"):
            check(path in c, f"{ps.place_id(st)}: no cite for {path}")
        for i in range(len(s["props"])):
            check(f"props[{i}].from" in c, f"{ps.place_id(st)}: no cite for props[{i}]")
        for k in s["materials"]:
            check(f"materials.{k}" in c, f"{ps.place_id(st)}: no cite for materials.{k}")
    check(len({spec_of(st)["id"] for st in ps.strip_states()}) == 8, "ids repeat")
    check(len({spec_of(st)["from_state"] for st in ps.strip_states()}) == 8, "hashes repeat")
    for bad in (ps.base_state(element="void"), ps.base_state(place="hall"), ps.base_state(charge=dict(floor="top", route_open=True)),
                ps.base_state(qi=2)):
        try:
            ps.build(bad)
        except ValueError:
            continue
        check(False, f"accepted a bad state: {bad}")


if __name__ == "__main__":
    main()
