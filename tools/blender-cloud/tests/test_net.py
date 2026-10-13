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
    src = fetch_table()  # G4 and G5 in the bpy tier use the same file
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
    code = ("import sys;path,out=sys.argv[1:3];sys.argv=['x','chair',out];import importlib.util as u;"
            "s=u.spec_from_file_location('f',path);m=u.module_from_spec(s);s.loader.exec_module(m);"
            "m.scene_uuid=lambda:'';m.main()")
    r = subprocess.run([sys.executable, "-c", code, str(TOOLS / "blenderkit_fetch.py"), str(tmpdir("n2out"))],
                       capture_output=True, text=True, env=env, timeout=300)
    out = r.stdout + r.stderr
    check(r.returncode != 0 and "HTTP " in out and "Traceback" not in out, f"no clean API message: {out.strip()[-200:]}")
    return out.strip().splitlines()[-2][:150]


def _size(f):
    import struct
    b = f.read_bytes()
    if f.suffix == ".png":
        return struct.unpack(">II", b[16:24])
    i = 2
    while i < len(b):  # JPEG: walk the markers to the start-of-frame
        m, ln = b[i + 1], int.from_bytes(b[i + 2:i + 4], "big")
        if m in (0xC0, 0xC1, 0xC2):
            return int.from_bytes(b[i + 7:i + 9], "big"), int.from_bytes(b[i + 5:i + 7], "big")
        i += 2 + ln
    return (0, 0)


def fetch_table():
    """The dining table fixture at $W/assets/table.glb (G4, G5, A1). Falls back to our figure if it cannot be fetched."""
    dst = W / "assets/table.glb"
    if not dst.exists():
        fx = next(f for f in FIXTURES["fixtures"] if f["name"] == "Dining table")
        d = tmpdir("table")
        fetch(fx, d)
        dst.parent.mkdir(parents=True, exist_ok=True)
        r = subprocess.run([sys.executable, str(TOOLS / "prepare_asset.py"), str(next(d.glob("*.glb"))), str(dst)], capture_output=True, text=True, timeout=900)
        check(r.returncode == 0, f"prepare_asset.py failed on the table: {r.stderr[-200:]}")
    return dst


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
    fx = next(f for f in FIXTURES["fixtures"] if f["name"].startswith("Nude Female Bust"))
    d = tmpdir("a2")
    fetch(fx, d)
    raw = next(d.glob("*.glb"))
    r = subprocess.run([sys.executable, str(TOOLS / "prepare_asset.py"), str(raw), str(d / "in.glb")], capture_output=True, text=True, timeout=900)
    check(r.returncode == 0, f"prepare_asset.py failed: {r.stderr[-200:]}")
    r = subprocess.run([BLENV, str(TOOLS / "scene.py"), str(d / "in.glb"), str(d / "out")], capture_output=True, text=True, timeout=1200)
    check(r.returncode == 0, f"scene.py failed: {r.stderr[-200:]}")

    def read(f):
        b = f.read_bytes()
        n = int.from_bytes(b[12:16], "little")
        return json.loads(b[20:20 + n])
    before, after = read(d / "in.glb"), read(d / "out/scene.glb")
    names = [m["name"] for m in before["materials"]]
    check(len(names) >= 3, f"the fixture has {len(names)} materials, wanted at least 3")
    kept = [m["name"] for m in after["materials"]]
    check(all(n in kept for n in names), f"materials lost: {[n for n in names if n not in kept]}")
    big = [f.name for f in (d / "out").rglob("*.*") if f.suffix in (".jpg", ".png") and max(_size(f)) > 1024]
    check(not big, f"textures over 1024: {big}")
    return f"{len(names)} materials in, all {len(names)} out (the figure adds {len(kept) - len(names)}); textures at or under 1024. Preview: {d / 'out/preview.png'} (eyes: E1)"


@test("A3")
def a3():
    needs("api.blenderkit.com")
    fx = next(f for f in FIXTURES["fixtures"] if f["name"].startswith("Scan Old brick building"))
    d = tmpdir("a3")
    r = subprocess.run([sys.executable, str(TOOLS / "blenderkit_fetch.py"), fx["query"], str(d), "--index", str(fx["index"]), "--file-type", "blend"],
                       capture_output=True, text=True, timeout=900)
    check(r.returncode == 0 and f"id       : {fx['id']}" in r.stdout, f"fetch failed or drifted: {(r.stdout + r.stderr)[-200:]}")
    r = subprocess.run([BLENV, str(TOOLS / "scene.py"), str(next(d.glob("*.blend"))), str(d / "out")], capture_output=True, text=True, timeout=900)
    out = r.stdout + r.stderr
    check(r.returncode != 0 and "STOP:" in out and "multi-tile UDIM" in out, f"scene.py did not stop with the UDIM message: {out[-200:]}")
    return next(l for l in out.splitlines() if l.startswith("STOP:"))[:160]


@test("N5")
def n5():
    needs("api.blenderkit.com", "assets.blenderkit.com")
    fx = next(f for f in FIXTURES["fixtures"] if f["id"] == "c8857203-ba76-4d34-9ee7-906293144d4e")
    d = tmpdir("n5")
    start = time.time()
    fetch(fx, d)
    raw = next(d.glob("*.glb"))
    subprocess.run([sys.executable, str(TOOLS / "prepare_asset.py"), str(raw), str(d / "in.glb")], check=True, capture_output=True, timeout=900)
    import resource
    r = subprocess.run([BLENV, str(TOOLS / "scene.py"), str(d / "in.glb"), str(d / "out")], capture_output=True, text=True, timeout=1200)
    secs = time.time() - start
    peak = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss / 1048576  # KB to GB; the largest child, scene.py's bpy
    check(r.returncode == 0, f"scene.py failed: {r.stderr[-200:]}")
    check(secs < 600 and peak < 4, f"{secs:.0f} s, {peak:.2f} GB peak")
    return f"{secs:.0f} s, {peak:.2f} GB peak (record these; the kill line becomes twice them)"


if __name__ == "__main__":
    main()
