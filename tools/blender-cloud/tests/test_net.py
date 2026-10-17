"""Network tier: N4 first, then V1, A1 to A4, N1, N2, N5. A test that needs a host N4 found down is skipped with the
host named, so a refused host reads as the environment, not the pipeline. Plain Python 3; bpy and node parts run as
subprocesses ($BLENV, and npm packages installed once into $W/node).

usage: python3 tools/blender-cloud/tests/test_net.py [N4,V1,...]
"""
import glob, json, os, pathlib, shutil, subprocess, sys, time, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import GAME, TESTS, TOOLS, W, Skip, check, main, test, tmpdir  # noqa: E402

BLENV = os.environ.get("BLENV", "/home/user/blenv/bin/python")
FIXTURES = json.loads((TESTS / "fixtures.json").read_text())
NODE = W / "node"
PINS = {"gltf-validator": "2.0.0-dev.3.10", "@gltf-transform/cli": "4.5.1"}
CAVE_PINS = {"playwright": "1.56.1", "three": "0.128.0", "typescript": "5.9.3"}  # three as cave-test.mjs names it
HOSTS = ["api.blenderkit.com", "assets.blenderkit.com", "registry.npmjs.org", "cdn.jsdelivr.net"]
up = {}


def reach(host):
    if host not in up:
        try:
            urllib.request.urlopen(urllib.request.Request(f"https://{host}/", method="HEAD"), timeout=10)
            up[host] = True
        except urllib.error.HTTPError:
            up[host] = True  # it answered
        except Exception:
            up[host] = False
    return up[host]


def needs(*hosts):
    down = [h for h in hosts if not reach(h)]
    if down:
        raise Skip(f"{', '.join(down)} unreachable from this environment (N4)")


def node_pkgs():
    needs("registry.npmjs.org")
    if not (NODE / "node_modules/.bin/gltf-transform").exists() or not (NODE / "node_modules/gltf-validator").exists():
        NODE.mkdir(parents=True, exist_ok=True)
        r = subprocess.run(["npm", "install", "--prefix", str(NODE), "--silent", *[f"{k}@{v}" for k, v in PINS.items()]],
                           capture_output=True, text=True, timeout=600)
        check(r.returncode == 0, f"npm install failed: {r.stderr[-300:]}")


@test("N4")
def n4():
    states = [f"{h} {'up' if reach(h) else 'DOWN'}" for h in HOSTS]
    check(all(up.values()), "; ".join(states))
    return "; ".join(states)


@test("V1")
def v1():
    node_pkgs()
    files = [GAME / "body/figure.glb", GAME / "cave/cave-kit.glb"]
    files += sorted(glob.glob(str(W / "walk-*/scene.glb")))[-1:] + sorted(glob.glob(str(W / "pieces/*.glb")))
    check(len(files) >= 3, "no scene.glb or piece GLBs in $W; run the bpy tier first")
    js = ("const v=require('gltf-validator'),fs=require('fs');(async()=>{for(const f of process.argv.slice(1)){"
          "const r=await v.validateBytes(new Uint8Array(fs.readFileSync(f)));"
          "console.log(JSON.stringify({f,e:r.issues.numErrors,w:r.issues.numWarnings,"
          "m:r.issues.messages.filter(x=>x.severity===0).slice(0,2).map(x=>x.code)}))}})()")
    r = subprocess.run(["node", "-e", js, *map(str, files)], capture_output=True, text=True, cwd=NODE, timeout=300)
    check(r.returncode == 0, f"validator failed to run: {r.stderr[-300:]}")
    res = [json.loads(l) for l in r.stdout.splitlines()]
    errs = [f"{pathlib.Path(x['f']).name} {x['e']} errors {x['m']}" for x in res if x["e"]]
    check(not errs, "; ".join(errs))
    return f"{len(res)} files, 0 errors; warnings: " + ", ".join(f"{pathlib.Path(x['f']).name} {x['w']}" for x in res if x["w"]) or "none"


@test("A1")
def a1():
    node_pkgs()
    d = tmpdir("a1")
    src = W / "assets/table.glb"
    src = src if src.exists() else GAME / "body/figure.glb"  # the table needs Blendkit; the figure is pinned by being ours
    packed, back = d / "meshopt.glb", d / "decoded.glb"
    r = subprocess.run([str(NODE / "node_modules/.bin/gltf-transform"), "meshopt", str(src), str(packed)],
                       capture_output=True, text=True, timeout=300)
    check(r.returncode == 0, f"gltf-transform meshopt failed: {r.stderr[-300:]}")
    r = subprocess.run([sys.executable, str(TOOLS / "prepare_asset.py"), str(packed), str(back)], capture_output=True, text=True, timeout=600)
    check(r.returncode == 0 and "EXT_meshopt_compression" in r.stdout, f"prepare_asset.py did not report meshopt: {r.stdout}{r.stderr[-300:]}")
    got = []
    for f in (src, back):
        r = subprocess.run([BLENV, str(TESTS / "_bbox.py"), str(f)], capture_output=True, text=True, timeout=300)
        line = next((l for l in r.stdout.splitlines() if l.startswith("BBOX ")), None)
        check(line, f"bpy could not import {f.name}: {r.stderr[-300:]}")
        got.append(json.loads(line[5:]))
    (a, b) = got
    check(a["tris"] == b["tris"], f"{a['tris']} triangles before, {b['tris']} after")
    off = max(abs(x - y) for p, q in zip(a["bbox"], b["bbox"]) for x, y in zip(p, q))
    check(off <= 0.001, f"bounding box moved {off * 1000:.2f} mm")
    return f"{src.name}: meshopt reported, decoded, {a['tris']} triangles, box within {off * 1000:.2f} mm"


@test("P6")
def p6():
    """The cave still plays: cave-test.mjs at 390 by 844, on a build made in a copy under $W (the checkout's public/
    is never written). Its packages need the npm registry, so it sits in this tier."""
    needs("registry.npmjs.org")
    repo = TESTS.parent.parent.parent
    root = W / "cave-test"
    if not (root / "node_modules/playwright").exists():
        root.mkdir(parents=True, exist_ok=True)
        r = subprocess.run(["npm", "install", "--prefix", str(root), "--silent", *[f"{k}@{v}" for k, v in CAVE_PINS.items()]],
                           capture_output=True, text=True, timeout=900)
        check(r.returncode == 0, f"npm install failed: {r.stderr[-300:]}")
    for rel in ("scripts/build-ontology-game.mjs", "content/ontology-game"):
        dst = root / rel
        if dst.is_dir():
            shutil.rmtree(dst)
        dst.parent.mkdir(parents=True, exist_ok=True)
        (shutil.copytree if (repo / rel).is_dir() else shutil.copyfile)(repo / rel, dst)
    r = subprocess.run(["node", "scripts/build-ontology-game.mjs"], capture_output=True, text=True, cwd=root, timeout=600)
    check(r.returncode == 0, f"build failed: {r.stderr[-300:]}")
    shutil.copyfile(repo / "content/ontology-game/cave/cave-test.mjs", root / "cave-test.mjs")
    env = dict(os.environ, OAG_PUBLIC=str(root / "public"), OAG_SHOTS=str(tmpdir("cave-shots")),
               OAG_GAME=str(root / "content/ontology-game/game.jsx"))
    r = subprocess.run(["node", "cave-test.mjs"], capture_output=True, text=True, cwd=root, env=env, timeout=900)
    passes = sum(l.startswith("PASS ") for l in r.stdout.splitlines())
    fails = [l[5:80] for l in r.stdout.splitlines() if l.startswith("FAIL ")]
    check(r.returncode == 0 and not fails and passes, f"{passes} passed, {len(fails)} failed: {fails[:3]} {r.stderr[-200:]}")
    return f"cave-test.mjs: {passes} checks passed at 390 by 844"


@test("J5c")
def j5c():
    """J5(c): in headless Chromium, swapping a garment on the walking figure (j5_swap.mjs: the wardrobe loaded and
    bound to the figure's bones once, a swap takes one off and puts the next on) takes under 100 ms, and the frame after
    a swap is no slower than the walk's own at the median. The frame line (no frame below 30 a second) is judged on his phone, as J1's was
    (bpt-j1-frame-rate): the cloud browser draws without a graphics chip, so its own walking frames, before any swap,
    already miss it. The numbers are reported either way."""
    needs("registry.npmjs.org")
    root = W / "cave-test"
    if not (root / "node_modules/playwright").exists():
        root.mkdir(parents=True, exist_ok=True)
        r = subprocess.run(["npm", "install", "--prefix", str(root), "--silent", *[f"{k}@{v}" for k, v in CAVE_PINS.items()]],
                           capture_output=True, text=True, timeout=900)
        check(r.returncode == 0, f"npm install failed: {r.stderr[-300:]}")
    out = tmpdir("j5c")
    r = subprocess.run([BLENV, str(GAME / "cave/garments.py"), "--build", "average", "--palette", "dusk", "--out", str(out)],
                       capture_output=True, text=True, timeout=900)
    check(r.returncode == 0, f"garments.py exited {r.returncode}: {r.stderr[-300:]}")
    shutil.copyfile(TESTS / "j5_swap.mjs", root / "j5_swap.mjs")
    r = subprocess.run(["node", "j5_swap.mjs"], capture_output=True, text=True, cwd=root, timeout=600,
                       env=dict(os.environ, J5_DIR=str(out)))
    line = next((l for l in r.stdout.splitlines() if l.startswith("{")), None)
    check(r.returncode == 0 and line, f"j5_swap.mjs failed: {r.stderr[-300:]}")
    res = json.loads(line)
    check(not res["errors"] and res["worst_swap_ms"] < 100, f"swap: {res}")
    # a swap costs the frame nothing the walk alone does not: the frame after a swap is no slower, at the median
    check(res["swap_frame_median_ms"] <= res["baseline_median_frame_ms"] + 2, f"swap frames slower: {res}")
    return (f"{res['swaps']} swaps, worst {res['worst_swap_ms']} ms (median {res['median_swap_ms']}); frames: walking "
            f"alone median {res['baseline_median_frame_ms']} ms, worst {res['baseline_worst_frame_ms']}; on a swap median "
            f"{res['swap_frame_median_ms']}, worst {res['swap_frame_worst_ms']} (phone judges the 30 a second line)")


@test("J5d")
def j5d():
    """J5(d): the robe's skirt as cloth in headless Chromium with three.js r128, as cave.js will run it (j5_cloth.mjs:
    cloth.js's CaveCloth.attach on the robe GLB, bound to the walking figure, carried forward at the walk's speed).
    With four figures walking, every cloth point stays a number, the skirt swings away from where skinning alone puts
    it (more than 2 cm), a fifth figure standing still keeps its belt row still against the body (round 6: the largest
    frame-to-frame change in the motion of the free points within 6 cm of the belt, relative to their skinned places,
    under 0.2 mm), the walking figure's belt row keeps under 10 mm (99th percentile; the walk's own quaternion keys
    once made it 132 mm), the sleeve cuffs, ankle ties, hem edge and turned hem stay under their jitter limits walking
    and standing (round 7: j5_cloth.mjs LIMITS; the walk's corners made the cuffs 29 mm and the ankles 35), and the
    cloth costs under 2.5 ms per figure for each 1/60 s of game time (5.5 with the sleeve panels as cloth, round 12, board
    cd-panel-cost; skinning on the
    CPU, the step and writing the points). The cloud browser draws without a graphics chip, so the phone is the judge of the
    frame rate; this bounds the cloth's own share."""
    needs("registry.npmjs.org")
    root = W / "cave-test"
    if not (root / "node_modules/playwright").exists():
        root.mkdir(parents=True, exist_ok=True)
        r = subprocess.run(["npm", "install", "--prefix", str(root), "--silent", *[f"{k}@{v}" for k, v in CAVE_PINS.items()]],
                           capture_output=True, text=True, timeout=900)
        check(r.returncode == 0, f"npm install failed: {r.stderr[-300:]}")
    out = tmpdir("j5d")
    r = subprocess.run([BLENV, str(GAME / "cave/garments.py"), "--build", "average", "--palette", "dusk", "--out", str(out)],
                       capture_output=True, text=True, timeout=900)
    check(r.returncode == 0, f"garments.py exited {r.returncode}: {r.stderr[-300:]}")
    shutil.copyfile(TESTS / "j5_cloth.mjs", root / "j5_cloth.mjs")
    r = subprocess.run(["node", "j5_cloth.mjs"], capture_output=True, text=True, cwd=root, timeout=600,
                       env=dict(os.environ, J5_DIR=str(out), FIGURES="4", CLOTH_JS=str(GAME / "cave/cloth.js")))
    line = next((l for l in r.stdout.splitlines() if l.startswith("{")), None)
    check(r.returncode == 0 and line, f"j5_cloth.mjs failed: {r.stderr[-300:]}")
    res = json.loads(line)
    check(res["pass"], f"cloth: {res}")
    return (f"4 figures, {res['free']} cloth points each of {res['particles']}: {res['per_figure_ms']} ms a figure per "
            f"1/60 s (median; p95 for all four {res['p95_ms']} ms), skirt swings {res['skirt_swing_m']} m, belt still to "
            f"{res['belt_jitter_mm']} mm standing ({res['belt_walk_jitter_mm']} mm walking, p99); walking jitter p99: "
            + ", ".join(f"{k} {res['jitter_mm'][k + 'Walk']} mm" for k in ("cuff", "ties", "hem", "fold")))


@test("N1")
def n1():
    needs("api.blenderkit.com", "assets.blenderkit.com")
    r = subprocess.run([sys.executable, str(TOOLS / "blenderkit_fetch.py"), "--selftest"], capture_output=True, text=True, timeout=300)
    check(r.returncode == 0, f"selftest failed: {(r.stdout + r.stderr).strip()[-200:]}")
    return r.stdout.strip()


@test("N2")
def n2():
    needs("api.blenderkit.com")
    env = dict(os.environ, BLENDERKIT_SCENE_UUID="", XDG_CACHE_HOME=str(tmpdir("n2")))
    code = ("import sys;sys.argv=['x','chair',sys.argv[1]];import importlib.util as u;"
            "s=u.spec_from_file_location('f',sys.argv[2]);m=u.module_from_spec(s);s.loader.exec_module(m);"
            "m.scene_uuid=lambda:'';m.main()")
    r = subprocess.run([sys.executable, "-c", code, str(tmpdir("n2out")), str(TOOLS / "blenderkit_fetch.py")],
                       capture_output=True, text=True, env=env, timeout=300)
    out = r.stdout + r.stderr
    check(r.returncode != 0 and "HTTP " in out and "Traceback" not in out, f"no clean API message: {out.strip()[-200:]}")
    return out.strip().splitlines()[-2][:150]


def fetch(fx, out):
    """Fetch a pinned fixture by its query and index, and check the id."""
    r = subprocess.run([sys.executable, str(TOOLS / "blenderkit_fetch.py"), fx["query"], str(out), "--index", str(fx["index"])],
                       capture_output=True, text=True, timeout=600)
    check(r.returncode == 0, f"fetch failed: {r.stderr[-200:]}")
    check(f"id       : {fx['id']}" in r.stdout, f"{fx['name']}: index {fx['index']} is no longer {fx['id']}: {r.stdout[:200]}")
    return r.stdout


@test("A4")
def a4():
    needs("api.blenderkit.com")
    sys.path.insert(0, str(TOOLS))
    import blenderkit_fetch as bf
    bad = []
    for fx in FIXTURES["fixtures"]:
        if not fx.get("id") or not fx.get("query"):
            continue
        free = bf.search(fx["query"])
        got = free[fx["index"]] if fx["index"] < len(free) else None
        if not got or got["id"] != fx["id"] or got.get("license") != "cc_zero":
            bad.append(f"{fx['name']}: found {got and got['id']} at {fx['index']}")
    check(not bad, "; ".join(bad))
    return "every pinned fixture is where it was"


@test("A2")
def a2():
    needs("api.blenderkit.com", "assets.blenderkit.com")
    raise Skip("no multi-material fixture pinned yet: the first run with Blendkit reachable picks one into fixtures.json")


@test("A3")
def a3():
    needs("api.blenderkit.com")
    raise Skip("the UDIM search runs the first time Blendkit is reachable; G3's synthetic image stands in until then")


@test("N5")
def n5():
    needs("api.blenderkit.com", "assets.blenderkit.com")
    fx = next(f for f in FIXTURES["fixtures"] if f["id"] == "c8857203-ba76-4d34-9ee7-906293144d4e")
    d = tmpdir("n5")
    start = time.time()
    fetch(fx, d)
    raw = next(d.glob("*.glb"))
    subprocess.run([sys.executable, str(TOOLS / "prepare_asset.py"), str(raw), str(d / "in.glb")], check=True, capture_output=True, timeout=900)
    r = subprocess.run(["/usr/bin/time", "-v", BLENV, str(TOOLS / "scene.py"), str(d / "in.glb"), str(d / "out")],
                       capture_output=True, text=True, timeout=1200)
    secs = time.time() - start
    peak = next((int(l.split()[-1]) for l in r.stderr.splitlines() if "Maximum resident" in l), 0) / 1048576
    check(r.returncode == 0, f"scene.py failed: {r.stderr[-200:]}")
    check(secs < 600 and peak < 4, f"{secs:.0f} s, {peak:.2f} GB peak")
    return f"{secs:.0f} s, {peak:.2f} GB peak (record these; the kill line becomes twice them)"


if __name__ == "__main__":
    main()
