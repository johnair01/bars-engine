"""Offline tier: G1, G2, G2b, G6, G7, D1. Plain Python 3, no third-party packages, no network. Runs in the GitHub check job.

usage: python3 tools/blender-cloud/tests/test_offline.py [G1,G2,...]
"""
import json, os, pathlib, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import GAME, TESTS, TOOLS, check, main, test, tmpdir  # noqa: E402

GLB = b"glTF\x02\x00\x00\x00" + (20).to_bytes(4, "little") + b"\x00" * 8  # contents never read by build_viewer.py


def viewer(sidecar, *extra):
    """Run build_viewer.py on a stub GLB with this sidecar (dict, or None for no --asset). Returns (result, page)."""
    d = tmpdir("viewer")
    (d / "scene.glb").write_bytes(GLB)
    args = [sys.executable, TOOLS / "build_viewer.py", d / "scene.glb", d / "page"]
    if sidecar is not None:
        (d / "asset.json").write_text(json.dumps(sidecar))
        args += ["--asset", d / "asset.json"]
    r = subprocess.run([str(a) for a in [*args, *extra]], capture_output=True, text=True)
    return r, d / "page" / "viewer.html"


def sidecar(**kw):
    s = {"name": "Test Chair", "author": "Tester", "license": "cc_zero", "id": "x"}
    s.update(kw)
    return {k: v for k, v in s.items() if v is not None}


def stopped(r, page, case):
    check(r.returncode != 0, f"{case}: exited 0")
    check(not page.exists(), f"{case}: wrote viewer.html")
    check("Traceback" not in r.stderr, f"{case}: crashed instead of stopping: {r.stderr.strip().splitlines()[-1]}")
    check("STOP:" in r.stderr, f"{case}: no STOP: line")


@test("G1")
def g1():
    r, page = viewer(sidecar(license="royalty_free"))
    check(r.returncode != 0 and not page.exists(), "a royalty_free sidecar built a page")
    r, page = viewer(sidecar())
    check(r.returncode == 0 and page.exists(), f"a cc_zero sidecar did not build: {r.stderr[-200:]}")
    check((page.parent / "model.json").exists(), "no model.json beside the page")
    return "royalty_free refused, cc_zero built"


@test("G2")
def g2():
    for case, sc in (("no sidecar", None), ("no license key", sidecar(license=None)), ('"CC0" spelling', sidecar(license="CC0"))):
        r, page = viewer(sc)
        stopped(r, page, case)
    return "each odd sidecar stops with a STOP: line"


@test("G2b")
def g2b():
    r, page = viewer(sidecar(license="royalty_free"), "--allow-restricted")
    check(r.returncode != 0 and not page.exists(),
          "--allow-restricted builds a page holding a royalty_free model (cs-cc0-or-own, bpt-no-restricted-flag)")
    return "--allow-restricted no longer lets a royalty_free model into a page"


@test("G6")
def g6():
    m = json.loads((GAME / "cave/manifest.json").read_text())
    problems = []
    for a in m["assets"]:
        aid = a["id"]
        for k in ("source", "licence"):
            if not a.get(k):
                problems.append(f"{aid} has no {k}")
        if a.get("kind") == "object":  # packed inside chamber.glb (J2): J2 checks its bytes and budget when it builds
            if a.get("licence") not in ("own work", "CC0"):
                problems.append(f"{aid} licence is {a.get('licence')!r}")
            continue
        if a.get("file") is None:
            continue  # a library with no file of its own (lib.three) is listed for its licence only
        if a.get("licence") not in ("own work", "CC0"):
            problems.append(f"{aid} licence is {a.get('licence')!r}")
        if a.get("status") == "planned":
            continue
        p = GAME / "cave" / a["file"]
        if p.is_dir():  # a folder of pictures or models: its bytes count the files, not a script that drew them
            size = sum(f.stat().st_size for f in p.iterdir() if f.is_file() and f.suffix.lower() != ".py")
        elif p.exists():
            size = p.stat().st_size
        else:
            problems.append(f"{aid}: {a['file']} is missing")
            continue
        if "bytes" in a and a["bytes"] != size:
            problems.append(f"{aid}: manifest says {a['bytes']} bytes, file is {size}")
        if "budget_bytes" in a and size > a["budget_bytes"]:
            problems.append(f"{aid}: {size} bytes, over its budget of {a['budget_bytes']}")
    check(not problems, "; ".join(problems))
    return f"{len(m['assets'])} assets: sizes, budgets, sources and licences hold"


@test("G7")
def g7():
    key = "fake-key-g7-7d1c9e"
    for with_key in (True, False):
        d = tmpdir("g7")
        env = {k: v for k, v in os.environ.items() if k not in ("BLENDERKIT_API_KEY", "BLENDERKIT_SCENE_UUID")}
        env["XDG_CACHE_HOME"] = str(d / "cache")
        if with_key:
            env["BLENDERKIT_API_KEY"] = key
        rec = d / "requests.json"
        r = subprocess.run([sys.executable, str(TESTS / "_g7_driver.py"), str(rec), "--", "chair", str(d / "out")],
                           capture_output=True, text=True, env=env)
        check(r.returncode == 0, f"fetch failed against the stub: {r.stderr[-300:]}")
        seen = json.loads(rec.read_text())
        api = [s for s in seen if s["url"].startswith("https://api.blenderkit.com/")]
        other = [s for s in seen if s not in api]
        check(api and other, "the stub did not see both hosts")
        if with_key:
            check(all(s["headers"].get("authorization") == f"Bearer {key}" for s in api), "the key did not go to the API host")
        else:
            check(not any("authorization" in s["headers"] for s in api), "a key went out with BLENDERKIT_API_KEY unset")
        check(not any("authorization" in s["headers"] for s in other), "the key went to the asset host")
        written = [p for p in d.rglob("*") if p.is_file() and p != rec]
        leaks = [p.name for p in written if key.encode() in p.read_bytes()]
        check(key not in r.stdout + r.stderr and not leaks, f"the key appeared in output or in {leaks}")
    return f"key on the API host only ({len(api)} API, {len(other)} asset requests); none when unset; never printed or written"


@test("D1")
def d1():
    """The detail pass (detail.py): every grown piece fits its face budget with no decimation, every vertex has a tag,
    the same every run, and procgen's mushroom at its default resolution is what it was before the resolution options."""
    sys.path.insert(0, str(TOOLS))
    import detail, procgen
    a, b = detail.pieces(), detail.pieces()
    for name, (v, f, tags, budget) in a.items():
        check(len(f) <= budget, f"{name}: {len(f)} faces over its budget of {budget}")
        check(len(tags) == len(v), f"{name}: {len(tags)} tags for {len(v)} vertices")
        check(b[name][0] == v and b[name][1] == f, f"{name}: not the same on a second run")
    caps = sum(1 for k, t in a["mush_clump"][2] if k == detail.CAP and t == 0)
    check(caps, "mush_clump: no cap rim to keep sharp")
    v, f = procgen.mushroom(seed=5)
    check(len(v) == (procgen.RINGS * 2 + 5) * procgen.SIDES, f"the default mushroom changed: {len(v)} vertices")
    return ", ".join(f"{n} {len(x[1])}/{x[3]}" for n, x in a.items()) + " faces"


if __name__ == "__main__":
    main()
