"""Run: python3 -m pytest tools/blender-cloud/make/contest/test_vocab.py (no Blender needed)."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import vocab  # noqa: E402


def part(name, x0, x1, y0, y1, z0, z1):
    wx, wy = x1 - x0, y1 - y0
    d = sorted((wx, wy, z1 - z0), reverse=True)
    return {"name": name, "lo_z": z0, "hi_z": z1, "wx": wx, "wy": wy, "x0": x0, "x1": x1, "y0": y0, "y1": y1,
            "long": d[0], "mid": d[1], "short": d[2]}


def pack(n):
    return json.load(open(os.path.join(HERE, "reference", n), encoding="utf-8"))


def test_hearth_opening_between_cheeks():
    ps = [part("base", -0.9, 0.9, -0.5, 0.5, 0, 0.2), part("back", -0.9, 0.9, 0.5, 0.75, 0.2, 1.7),
          part("cheek_l", -0.9, -0.4, 0.0, 0.5, 0.2, 1.0), part("cheek_r", 0.4, 0.9, 0.0, 0.5, 0.2, 1.0)]
    res = {r["check"]: r for r in vocab.run(pack("hearth.json"), ps)}
    assert res["firebox opening"]["ok"], res
    assert res["back slab"]["ok"] and res["base slab"]["ok"] and res["cheeks"]["ok"], res


def test_hearth_opening_too_narrow_fails():
    ps = [part("base", -0.9, 0.9, -0.5, 0.5, 0, 0.2), part("back", -0.9, 0.9, 0.5, 0.75, 0.2, 1.7),
          part("cheek_l", -0.9, -0.2, 0.0, 0.5, 0.2, 1.0), part("cheek_r", 0.2, 0.9, 0.0, 0.5, 0.2, 1.0)]
    res = {r["check"]: r for r in vocab.run(pack("hearth.json"), ps)}
    assert not res["firebox opening"]["ok"]


def test_missing_back_slab_fails():
    ps = [part("base", -0.9, 0.9, -0.5, 0.5, 0, 0.2)]
    res = {r["check"]: r for r in vocab.run(pack("hearth.json"), ps)}
    assert not res["back slab"]["ok"]


def test_weapon_as_data():
    ps = [part("shaft", 0, 0.05, 0, 0.05, 0.1, 2.1), part("blade", 0, 0.14, 0, 0.03, 2.1, 2.65),
          part("rack", -0.4, 0.4, 0, 0.1, 0, 1.3)]
    res = vocab.run(pack("guan-dao-parts.json"), ps)
    assert all(r["ok"] for r in res), res
    assert not all(r["ok"] for r in vocab.run(pack("guan-dao-parts.json"), ps[:1]))
