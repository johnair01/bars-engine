"""bpy tier: G3 to G5, R1 to R3, W1 to W4, P1 to P5, J2, J3 and J2b. Run under the bpy venv (README); each build runs as a
subprocess of that same Python, in a copy of the repo under $W, so the checkout is never written.

usage: /home/user/blenv/bin/python tools/blender-cloud/tests/test_bpy.py [R2,W1,...]
"""
import json, math, os, pathlib, subprocess, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ast, hashlib

from _common import (GAME, REPO, TESTS, TOOLS, W, Gap, Skip, accessor, check, components, copy_tree, glb_json, glb_read, main,  # noqa: E402
                     sha, test, tmpdir)

PY = sys.executable
_timing = {}


def run(args, cwd=None, timeout=600):
    t = time.time()
    r = subprocess.run([PY, *map(str, args)], capture_output=True, text=True, cwd=cwd, timeout=timeout)
    return r, time.time() - t


def mesh_counts(glb):
    """Per-mesh vertex counts from a GLB's JSON, to name the piece that differs."""
    j = glb_json(glb)
    acc = j["accessors"]
    return {m.get("name", f"mesh{i}"): sum(acc[p["attributes"]["POSITION"]]["count"] for p in m["primitives"])
            for i, m in enumerate(j.get("meshes", []))}


# ---- rebuilds -------------------------------------------------------------------------------------------------

@test("R1")
def r1():
    root = copy_tree(tmpdir("r1"))
    r, secs = run([root / "content/ontology-game/body/build_figure.py"])
    _timing["R1"] = secs
    check(r.returncode == 0, f"build_figure.py exited {r.returncode}: {r.stderr[-300:]}")
    got, want = sha(root / "content/ontology-game/body/figure.glb"), sha(GAME / "body/figure.glb")
    check(got == want, f"figure.glb differs from the committed file ({got[:12]} vs {want[:12]})")
    return f"figure.glb byte for byte, {secs:.1f} s"


@test("R2")
def r2():
    runs = []
    for n in (1, 2):
        root = copy_tree(tmpdir(f"r2-{n}"))
        r, secs = run([root / "content/ontology-game/cave/build_kit.py"])
        _timing.setdefault("R2", secs)
        check(r.returncode == 0, f"build_kit.py run {n} exited {r.returncode}: {r.stderr[-300:]}")
        runs.append(root / "content/ontology-game/cave")
    problems = []
    for f in ("cave-kit.glb", "spots.json"):
        a, b, c = sha(runs[0] / f), sha(runs[1] / f), sha(GAME / "cave" / f)
        if a != b:
            problems.append(f"{f}: the two runs differ")
        if a != c:
            problems.append(f"{f}: run 1 differs from committed")
    if problems and any(p.startswith("cave-kit") for p in problems):
        want, got1, got2 = mesh_counts(GAME / "cave/cave-kit.glb"), mesh_counts(runs[0] / "cave-kit.glb"), mesh_counts(runs[1] / "cave-kit.glb")
        diff = [f"{k} {want.get(k)}/{got1.get(k)}/{got2.get(k)}" for k in sorted(set(want) | set(got1) | set(got2))
                if not want.get(k) == got1.get(k) == got2.get(k)]
        problems.append("vertex counts committed/run1/run2: " + ("; ".join(diff) or "all equal, so the difference is in vertex positions or order"))
    check(not problems, " | ".join(problems))
    return "cave-kit.glb and spots.json byte for byte, twice"


@test("R3")
def r3():
    if "R1" not in _timing or "R2" not in _timing:
        raise Skip("needs R1 and R2 in the same run")
    total = _timing["R1"] + _timing["R2"]
    check(total < 30, f"R1 + R2 took {total:.1f} s, over 30 s")
    return f"R1 + R2 one build each: {total:.1f} s"


# ---- stops (G3 to G5) -----------------------------------------------------------------------------------------

def fixture(kind, name, *extra):
    d = W / "fixtures"
    d.mkdir(parents=True, exist_ok=True)
    out = d / name
    r, _ = run([TESTS / "_make_fixtures.py", kind, out, *extra])
    check(r.returncode == 0 and out.exists(), f"could not make {name}: {r.stderr[-300:]}")
    return out


@test("G3")
def g3():
    two, one = fixture("udim", "udim2.blend", 2), fixture("udim", "udim1.blend", 1)
    r, _ = run([TOOLS / "scene.py", two, tmpdir("g3-two")])
    check(r.returncode != 0, "a two-tile UDIM image did not stop scene.py")
    msg = r.stderr + r.stdout
    check("STOP:" in msg and "udim2.blend" in msg and "1001" in msg and "1002" in msg,
          f"the stop does not name the asset and both tiles: {msg.strip().splitlines()[-1][:200]}")
    r, _ = run([TOOLS / "scene.py", one, tmpdir("g3-one")])
    check(r.returncode == 0, f"a one-tile UDIM image did not pass: {r.stderr[-200:]}")
    return "two tiles stop with the asset and tiles named; one tile passes"


def table():
    p = W / "assets" / "table.glb"
    if not p.exists():
        raise Skip(f"needs the dining table at {p} (net tier fetches it)")
    return p


@test("G4")
def g4():
    t = table()
    out = tmpdir("g4")
    r, _ = run([TOOLS / "scene.py", t, out, "--max-glb-mb", "0.5"])
    msg = r.stderr + r.stdout
    check(r.returncode != 0 and "STOP:" in msg and "MB" in msg, "0.5 MB did not stop the table")
    r, _ = run([TOOLS / "scene.py", t, tmpdir("g4-default")])
    check(r.returncode == 0, f"the default 12 MB stopped the table: {r.stderr[-200:]}")
    return "0.5 MB stops with the size named; 12 MB passes"


@test("G5")
def g5():
    out = tmpdir("g5")
    r, _ = run([TOOLS / "scene.py", table(), out, "--tri-budget", "5000"])
    check(r.returncode == 0, f"scene.py failed: {r.stderr[-200:]}")
    rep = json.loads((out / "report.json").read_text())
    j, b = glb_read(out / "scene.glb")
    asset_tris = sum(j["accessors"][p["indices"]]["count"] // 3 for m in j["meshes"] if m["name"] not in WALKER_MESHES
                     for p in m["primitives"])
    check(4500 <= asset_tris <= 5500, f"the table has {asset_tris} triangles at a 5,000 budget")
    check(abs(rep["tris_after"] - asset_tris) <= max(2, asset_tris // 1000),
          f"report says {rep['tris_after']}, the GLB holds {asset_tris}")
    return f"{asset_tris} triangles in the GLB, report {rep['tris_after']}"


# ---- the walker (W1 to W4) ------------------------------------------------------------------------------------
JOINTS = {"hips", "spine", "head", "armL", "armR", "legL", "legR"}
WALKER_MESHES = set()  # filled by walker(): the figure's mesh name, so G5 counts only the asset
FIGURE_TRIS = 72  # six boxes; the 1,318 in the spec was the whole published scene, chair included
_walk = {}


def walker():
    if not _walk:
        out = tmpdir("walk")
        r, _ = run([TOOLS / "scene.py", fixture("cube", "box.glb"), out])
        check(r.returncode == 0, f"scene.py failed on the stand-in box: {r.stderr[-300:]}")
        j, b = glb_read(out / "scene.glb")
        _walk.update(dir=out, j=j, b=b)
        skin_mesh = next(n["mesh"] for n in j["nodes"] if "skin" in n)
        WALKER_MESHES.add(j["meshes"][skin_mesh]["name"])
    return _walk["j"], _walk["b"]


def rotations(j, b):
    """{joint: [quaternion per key]} for the WalkCycle's rotation channels, and the key times."""
    anim = next(a for a in j["animations"] if a["name"] == "WalkCycle")
    rot, times = {}, None
    for c in anim["channels"]:
        if c["target"]["path"] == "rotation":
            s = anim["samplers"][c["sampler"]]
            name = j["nodes"][c["target"]["node"]]["name"]
            rot[name] = accessor(j, b, s["output"])
            if len(rot[name]) > 2:
                times = [t[0] for t in accessor(j, b, s["input"])]
    return rot, times


def qmul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return (aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
            aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz)


def qdist(a, b):
    """q and -q are the same rotation."""
    return min(max(abs(x - y) for x, y in zip(a, b)), max(abs(x + y) for x, y in zip(a, b)))


@test("W1")
def w1():
    j, b = walker()
    skin = j["skins"][0]
    names = {j["nodes"][i]["name"] for i in skin["joints"]}
    check(names == JOINTS, f"joints are {sorted(names)}")
    anims = [a["name"] for a in j["animations"]]
    check(anims == ["WalkCycle"], f"animations are {anims}")
    fig = next(n["mesh"] for n in j["nodes"] if "skin" in n)
    tris = sum(j["accessors"][p["indices"]]["count"] // 3 for p in j["meshes"][fig]["primitives"])
    check(tris == FIGURE_TRIS, f"the figure has {tris} triangles, not {FIGURE_TRIS}")
    return f"7 joints, one WalkCycle, {tris} triangles in the figure"


@test("W2")
def w2():
    j, b = walker()
    anim = j["animations"][0]
    worst, last = 0.0, 0.0
    for c in anim["channels"]:
        s = anim["samplers"][c["sampler"]]
        v = accessor(j, b, s["output"])
        d = qdist(v[0], v[-1]) if c["target"]["path"] == "rotation" else max(abs(x - y) for x, y in zip(v[0], v[-1]))
        worst = max(worst, d)
        last = max(last, accessor(j, b, s["input"])[-1][0])
    check(worst <= 1e-4, f"first and last keys differ by {worst:.2e}")
    check(abs(last - 2.04) <= 0.01, f"last key at {last:.3f} s")
    return f"loops (worst {worst:.1e}), last key {last:.3f} s"


def swing(j, rot, joint, k):
    """The joint's turn away from its rest pose at key k, as a rotation vector (the quaternion's x, y, z)."""
    node = next(n for n in j["nodes"] if n["name"] == joint)
    rx, ry, rz, rw = node.get("rotation", (0, 0, 0, 1))
    d = qmul((-rx, -ry, -rz, rw), rot[joint][k])
    return d[:3] if d[3] >= 0 else tuple(-x for x in d[:3])


@test("W3")
def w3():
    j, b = walker()
    rot, times = rotations(j, b)
    n = len(times) - 1
    q1, q3 = n // 4, 3 * n // 4  # a quarter and three quarters of the way; at the half both legs pass straight down
    dot = lambda u, v: sum(x * y for x, y in zip(u, v))
    lq, rq = swing(j, rot, "legL", q1), swing(j, rot, "legR", q1)
    l3, r3 = swing(j, rot, "legL", q3), swing(j, rot, "legR", q3)
    check(dot(lq, rq) < 0, "at a quarter of the cycle the thighs swing the same way")
    check(dot(lq, l3) < 0 and dot(rq, r3) < 0, "at three quarters the thighs have not swapped")
    return "the thighs swing opposite ways and swap between a quarter and three quarters"


@test("W4")
def w4():
    j, b = walker()
    rot, _ = rotations(j, b)
    now = {name: [list(map(lambda x: round(x, 6), rot[name][k])) for k in (0, 12, 24, 36)] for name in sorted(rot)
           if len(rot[name]) > 2}
    stored = TESTS / "walk_keys.json"
    if not stored.exists():
        (W / "walk_keys.json").write_text(json.dumps(now, indent=1) + "\n")
        raise AssertionError(f"no stored keys yet; wrote {W / 'walk_keys.json'}. Look at the walk frames, then commit it")
    want = json.loads(stored.read_text())
    bad = [f"{n} key {k}" for n in want for k, (a, c) in enumerate(zip(want[n], now.get(n, []))) if qdist(a, c) > 1e-4]
    check(set(want) == set(now) and not bad, f"drifted: {bad or sorted(set(want) ^ set(now))}")
    return f"{len(now)} joints at keys 0, 12, 24, 36 match walk_keys.json"


# ---- the picture path (P1 to P5) ------------------------------------------------------------------------------

def dressing_rows():
    """The DRESSING table, read from build_kit.py without running it."""
    tree = ast.parse((GAME / "cave/build_kit.py").read_text())
    node = next(n for n in tree.body if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "DRESSING")
    return ast.literal_eval(node.value)


_pieces = {}
# Pieces excused from a test as known gaps, {test id: {piece}}. The first run on main (2026-10-13) excused root_curl
# from P3 and P5; the cave-studio strand fixed both in from_picture.py (#289), so nothing is excused now.
KNOWN = {}


def report(tid, bad, ok):
    """bad: [(piece, words)]. Fails on any piece not in KNOWN[tid]; a known piece alone is a gap."""
    hard = [w for k, w in bad if k not in KNOWN.get(tid, ())]
    check(not hard, "; ".join(hard))
    if bad:
        raise Gap("known: " + "; ".join(w for _, w in bad))
    return ok


def pieces():
    if not _pieces:
        out = W / "pieces"
        out.mkdir(parents=True, exist_ok=True)
        for name, picture, mode, faces in dressing_rows():
            glb = out / f"{name}.glb"
            args = [TOOLS / "from_picture.py", GAME / "cave/pictures" / picture, glb, "--mode", mode, "--height", "1",
                    "--name", name, "--render", out]
            if faces:
                args += ["--faces", faces]
            r, _ = run(args)
            check(r.returncode == 0, f"from_picture.py failed on {name}: {r.stderr[-300:]}")
            rep = json.loads(next(l for l in r.stdout.splitlines() if l.startswith("REPORT "))[7:])
            _pieces[name] = dict(rep, glb=glb, mode=mode, budget=faces, picture=GAME / "cave/pictures" / picture,
                                 mask=out / f"{name}_mask.npy", front=out / f"{name}_front.png",
                                 three=out / f"{name}_three_quarter.png")
    return _pieces


@test("P1")
def p1():
    m = json.loads((GAME / "cave/manifest.json").read_text())
    want = {d["piece"]: d["outline_match"] for a in m["assets"] for d in a.get("dressing", [])}
    got = {k: v["outline_match"] for k, v in pieces().items()}
    drops = [f"{k} {want[k]} -> {got.get(k)}" for k in want if got.get(k) is None or got[k] < want[k] - 0.01]
    rises = [f"{k} {want[k]} -> {got[k]}" for k in want if k in got and got[k] > want[k] + 0.01]
    check(not drops, "dropped: " + "; ".join(drops))
    return "within 0.01 of the manifest" + (f"; rose: {'; '.join(rises)}" if rises else "")


@test("P2")
def p2():
    import numpy as np
    bad = []
    for k, p in pieces().items():
        mask, sil = np.load(p["mask"])
        iou = float((mask & sil).sum() / max(1, (mask | sil).sum()))
        if abs(iou - p["outline_match"]) > 0.001:
            bad.append(f"{k}: recomputed {iou:.4f}, tool says {p['outline_match']}")
    check(not bad, "; ".join(bad))
    return "intersection over union recomputed from each saved mask agrees within 0.001"


@test("P3")
def p3():
    bad = []
    for k, p in pieces().items():
        j, b = glb_read(p["glb"])
        if p["mode"] == "lathe":
            w, _, d = p["size_xyz"]
            if abs(w - d) > 0.05 * max(w, d):
                bad.append((k, f"{k} is not round: {w} wide, {d} deep"))
        elif p["mode"] == "inflate":
            n = sum(components(j, b, i) for i in range(len(j["meshes"])))
            if n != 1:
                bad.append((k, f"{k} is in {n} pieces"))
        elif p["mode"] == "crystals":
            names = {n["name"] for n in j["nodes"] if "mesh" in n}
            if names != {k, k + "_bed"}:
                bad.append((k, f"{k} has parts {sorted(names)}"))
    return report("P3", bad, "lathe round, inflate one piece, crystals plus bed")


@test("P4", gap=True)
def p4():
    p = next(v for v in pieces().values() if v["mode"] == "crystals")
    j, b = glb_read(p["glb"])
    i = next(n["mesh"] for n in j["nodes"] if n.get("name") == "crystal_cluster")
    n = components(j, b, i)
    check(n >= 6, f"{n} prisms, below the floor of 6")
    check(n >= 9, f"{n} prisms where the picture has about 10 (floor 6 holds)")
    return f"{n} prisms"


@test("P5")
def p5():
    over, listed = [], []
    for k, p in pieces().items():
        if not p["budget"]:
            listed.append(f"{k} {p['faces']} faces, no budget")
        elif p["faces"] > p["budget"]:
            over.append((k, f"{k} {p['faces']} faces, budget {p['budget']}"))
    return report("P5", over, "within budget" + (f"; {', '.join(listed)}" if listed else ""))


# ---- the contact sheet and looks (E1, E2) ---------------------------------------------------------------------

def looked():
    """(piece, hash) pairs that have a LOOKED.md line."""
    seen = set()
    for line in (TESTS / "LOOKED.md").read_text().splitlines():
        cells = [c.strip(" `") for c in line.split("|")]
        if len(cells) > 5 and len(cells[3]) == 12:
            seen.add((cells[2], cells[3]))
    return seen


def short(path):
    return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()[:12]


@test("E1")
def e1():
    rows, waiting = [], []
    seen = looked()
    for k, p in pieces().items():
        rows.append({"label": f"{k} {p['outline_match']}",
                     "images": [str(p["picture"]), str(p["front"]), str(p["three"]), str(p["mask"])]})
        if (k, short(p["glb"])) not in seen:
            waiting.append(f"{k} `{short(p['glb'])}` (match {p['outline_match']})")
    _sheet["rows"] = rows
    _sheet["waiting"] = waiting
    if waiting:
        raise AssertionError("no LOOKED.md line for " + ", ".join(waiting))
    return f"{len(rows)} pieces, each looked at"


_sheet = {}


@test("E2")
def e2():
    walker()
    frames = W / "walk"
    frames.mkdir(exist_ok=True)
    r, _ = run([TESTS / "_render_walk.py", _walk["dir"] / "scene.glb", frames])
    check(r.returncode == 0, f"walk render failed: {r.stderr[-300:]}")
    imgs = [str(frames / f"walk_{f:02d}.png") for f in (0, 12, 24, 36)]
    rows = _sheet.get("rows", []) + [{"label": "walk 0 12 24 36", "images": imgs}]
    sheet = W / "contact-sheet.jpg"
    (W / "sheet-rows.json").write_text(json.dumps(rows))
    r, _ = run([TESTS / "contact_sheet.py", sheet, W / "sheet-rows.json"])
    check(r.returncode == 0, f"contact sheet failed: {r.stderr[-300:]}")
    keys = TESTS / "walk_keys.json"
    stamp = short(keys) if keys.exists() else "none yet"
    if ("walk", stamp) not in looked():
        raise AssertionError(f"walk `{stamp}` has no LOOKED.md line; sheet at {sheet}")
    return f"sheet at {sheet}; walk looked at"

# ---- J2: objects in the chamber -------------------------------------------------------------------------------

@test("J2")
def j2():
    """Each obj(...) line in chamber.py lands on the floor, inside the walls, under its budget, with a manifest row.
    The Blendkit object needs the network the first time (then the cache under $W/assets)."""
    root = copy_tree(tmpdir("j2"))
    out = tmpdir("j2-out")
    r, secs = run([root / "content/ontology-game/cave/chamber.py", "--no-render", "--out", out])
    if r.returncode and "Blendkit fetch failed" in r.stdout + r.stderr:
        raise Skip("Blendkit not reachable from this environment")
    check(r.returncode == 0, f"chamber.py exited {r.returncode}: {(r.stdout + r.stderr)[-500:]}")
    rows = json.loads((out / "objects.json").read_text())
    kinds = {row["source"].split()[0] for row in rows}
    check({"Blendkit", "cave/objects.py"} <= kinds and any("pictures/" in row["source"] for row in rows),
          f"want one object from each source (Blendkit, picture, script); got {[row['source'] for row in rows]}")
    manifest = {a["id"]: a for a in json.loads((root / "content/ontology-game/cave/manifest.json").read_text())["assets"]}
    for row in rows:
        if "hangs_from_m" in row:  # a root hung from the roof: its top, not its foot, is where it is placed
            check(abs(row["top_gap_cm"]) <= 1, f"{row['id']} hangs {row['top_gap_cm']} cm below its roof point")
        else:
            check(abs(row["lowest_cm"]) <= 1, f"{row['id']} stands {row['lowest_cm']} cm off the floor")
        check(row["bytes"] <= row["budget_bytes"], f"{row['id']} is {row['bytes']} bytes, budget {row['budget_bytes']}")
        check(row["licence"] in ("CC0", "own work"), f"{row['id']} licence {row['licence']}")
        m = manifest.get(row["id"])
        check(m and m["bytes"] == row["bytes"] and m["source"] and m["budget_bytes"], f"{row['id']}: no manifest row")
    _chamber_rows[:] = rows
    return ", ".join(f"{row['id']} {row['bytes'] // 1024} KB" for row in rows) + f"; {secs:.0f} s"


_chamber_rows = []


@test("J3")
def j3():
    """His concept pictures (pictures/j3_*.jpg) became placed pieces with no code of their own: two of the three
    trace at 0.85 or better. The other half of the kill line is his yes on the sheet (E1), never the score alone."""
    if not _chamber_rows:
        raise Skip("needs J2's chamber build")
    rows = [r for r in _chamber_rows if "pictures/j3_" in r["source"]]
    check(len(rows) == 3, f"want the three J3 pictures placed; got {[r['id'] for r in rows]}")
    passed = [r for r in rows if r["outline_match"] >= 0.85]
    check(len(passed) >= 2, "outline match: " + ", ".join(f"{r['id']} {r['outline_match']}" for r in rows))
    return ", ".join(f"{r['id']} {r['outline_match']}" for r in rows)


@test("J2b")
def j2b():
    """A Blendkit source that is not CC0 stops the build (cs-cc0-or-own). Offline: a cached sidecar says Royalty Free."""
    root = copy_tree(tmpdir("j2b"))
    cache = tmpdir("j2b-cache")
    folder = cache / "boulder-0-cc_zero"
    folder.mkdir()
    (folder / "Boulder_01.json").write_text(json.dumps({"name": "Boulder 01", "author": "test", "license": "royalty_free",
                                                        "id": "eff99517-c257-4525-9fe3-41bf2e367197", "source": "test"}))
    env = dict(os.environ, BLENDERKIT_CACHE=str(cache))
    r = subprocess.run([PY, root / "content/ontology-game/cave/chamber.py", "--no-render", "--out", tmpdir("j2b-out")],
                       capture_output=True, text=True, env=env, timeout=600)
    said = r.stdout + r.stderr
    check(r.returncode != 0 and "cs-cc0-or-own" in said, f"the build went on: exit {r.returncode}, {said[-300:]}")
    check(not (root / "content/ontology-game/cave/manifest.json").read_text().count("royalty"), "a row was written")
    return "Royalty Free source stopped the build"


# ---- the character creator (J4, J4b) -------------------------------------------------------------------------

def walk_check(glb):
    r, _ = run([TESTS / "_walk_check.py", glb])
    line = next((l for l in r.stdout.splitlines() if l.startswith("{")), None)
    check(r.returncode == 0 and line, f"_walk_check.py failed on {glb.name}: {r.stderr[-300:]}")
    return json.loads(line)


@test("J4")
def j4():
    """character.py --all makes nine figures (three builds, three palettes of the robe set), each one GLB under 300 KB
    with one skin and one walk, and each walk passes W3's swing and swap with no knee or elbow folding the wrong way,
    read back from the GLB. The sheet goes to the eye (LOOKED.md)."""
    out = tmpdir("j4")
    r, secs = run([GAME / "cave/character.py", "--all", "--out", out])
    check(r.returncode == 0, f"character.py exited {r.returncode}: {(r.stdout + r.stderr)[-500:]}")
    rows = json.loads((out / "report.json").read_text())
    check(len(rows) == 9 and len({(x["build"], x["palette"]) for x in rows}) == 9, f"{len(rows)} figures, want nine")
    sizes = []
    for row in rows:
        glb = out / row["file"]
        size = glb.stat().st_size
        check(size < 300 * 1024, f"{row['id']} is {size // 1024} KB")
        j = glb_json(glb)
        check(len(j.get("skins", [])) == 1 and [a["name"] for a in j.get("animations", [])] == ["Walk"],
              f"{row['id']}: want one skin and one Walk")
        w = walk_check(glb)
        check(not w["problems"], f"{row['id']}: {'; '.join(w['problems'])}")
        sizes.append(size)
    return f"nine figures, {min(sizes) // 1024} to {max(sizes) // 1024} KB, every walk clean; {secs:.0f} s"


@test("J4b")
def j4b():
    """The walk check catches an inverted joint: a copy of character.py with the knees bent forward fails it."""
    root = copy_tree(tmpdir("j4b"))
    src = root / "content/ontology-game/cave/character.py"
    text = src.read_text()
    bent = "0.12 + 0.95 * max(0.0, math.cos(ph))"
    check(bent in text, "the knee line moved; update J4b")
    src.write_text(text.replace(bent, "-(0.12 + 0.95 * max(0.0, math.cos(ph)))"))
    out = tmpdir("j4b-out")
    r, _ = run([src, "--out", out])
    check(r.returncode == 0, f"character.py exited {r.returncode}: {r.stderr[-300:]}")
    w = walk_check(out / "average-dusk.glb")
    check(any("kneeL folds forward" in p for p in w["problems"]), f"the forward knee went unseen: {w}")
    return "a forward-bent knee fails the walk check"


@test("J6")
def j6():
    """The warp (call sheet blender-frame-flesh-warp, item 2): character.py --daemons makes the frame and one figure per
    WARP row: the seven daemons and the Player. Each is one GLB under 300 KB with one skin and one Walk, passes the mesh census
    (the frame as a humanoid, 1.6 to 1.9 m tall; each warped figure as an NPC, the same closed solid in the box a held
    gesture needs) and walks clean, read back from the GLB. The sheet goes to the eye."""
    out = tmpdir("j6")
    r, secs = run([GAME / "cave/character.py", "--daemons", "--out", out])
    check(r.returncode == 0, f"character.py exited {r.returncode}: {(r.stdout + r.stderr)[-500:]}")
    rows = json.loads((out / "report.json").read_text())
    daemons = {"protector", "controller", "skeptic", "fixer", "victim", "damaged-self", "emotional-body", "player"}
    check({x["warp"] for x in rows} == daemons | {None}, f"warps {[x['warp'] for x in rows]}, want the eight and the frame")
    sys.path.insert(0, str(GAME / "cave"))
    import census
    for row in rows:
        glb = out / row["file"]
        check(glb.stat().st_size < 300 * 1024, f"{row['id']} is {glb.stat().st_size // 1024} KB")
        j = glb_json(glb)
        check(len(j.get("skins", [])) == 1 and [a["name"] for a in j.get("animations", [])] == ["Walk"],
              f"{row['id']}: want one skin and one Walk")
        c = census.census(glb, "npc" if row["warp"] else "humanoid")
        check(not c["problems"], f"{row['id']} census: {c['problems']}")
        w = walk_check(glb)
        check(not w["problems"], f"{row['id']}: {'; '.join(w['problems'])}")
    return f"the frame, seven daemon figures and the Player, each closed and walking clean; {secs:.0f} s"


# ---- the spirits' frame (S1) ----------------------------------------------------------------------------------

@test("S1")
def s1():
    """Every spirit base, living creature and highest ally form, rigs skeleton first (content/spirits/rig.py): one
    skin, the actions Idle and Walk, every bone inside the flesh, the size SIZE declares (within 10%), every foot
    stepping, and the feet taking turns (left and right half a cycle apart). Needs shellback.py, which lands with
    bars-engine #318; until then this skips."""
    spirits = TOOLS / "content/spirits"
    if not (spirits / "shellback.py").exists():
        raise Skip("shellback.py is not on this branch yet (#318)")
    sys.path.insert(0, str(spirits))
    out, done = tmpdir("s1"), []
    for base in ("tortoise", "armadillo", "pangolin", "fox"):
        src = out / f"src-{base}"
        r, _ = run([spirits / "shellback.py", src, "--samples", "1", "--size", "64", "--only", "earth", "--stages",
                    "creature,ascended", "--base", base], timeout=900)
        check(r.returncode == 0, f"shellback.py {base} exited {r.returncode}: {r.stderr[-300:]}")
        for stage in ("creature", "ascended"):
            r, _ = run([spirits / "rig.py", src / "glb" / f"earth-{stage}.glb", out, "--base", base, "--stage", stage])
            line = next((l for l in r.stdout.splitlines() if l.startswith("{")), None)
            check(r.returncode == 0 and line, f"rig.py {base} {stage} exited {r.returncode}: {r.stderr[-300:]}")
            row = json.loads(line)
            check(not row["notes"], f"{base} {stage}: {'; '.join(row['notes'])}")
            j = glb_json(out / row["file"])
            check(len(j.get("skins", [])) == 1, f"{base} {stage}: {len(j.get('skins', []))} skins, want one")
            check(sorted(a["name"] for a in j.get("animations", [])) == ["Idle", "Walk"], f"{base} {stage}: want Idle and Walk")
            steps = row["steps"]
            for foot, st in steps.items():
                check(st["travel"] > 0.03, f"{base} {stage}: {foot} moves {st['travel']} m in the walk")
            for a, b in (("ankleL", "ankleR"), ("wristL", "wristR")):
                if a in steps:
                    gap = abs(steps[a]["ahead_at"] - steps[b]["ahead_at"])
                    check(0.35 < gap < 0.65, f"{base} {stage}: {a} and {b} reach ahead {gap:.2f} of a cycle apart")
            done.append(f"{base} {stage} {row['size_m']} m")
    return "; ".join(done)


if __name__ == "__main__":
    main()
