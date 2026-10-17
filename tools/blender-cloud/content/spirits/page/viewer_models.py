"""Readies a base's models for the proof page's 3D viewer, one folder per satisfaction state.

    python3 viewer_models.py OUT_DIR raccoon neutral=DIR dissatisfied=DIR satisfied=DIR [--pack]

Each DIR is a shellback.py OUT folder (--state). Writes OUT_DIR/glb/<base>-<state>-<element>-<stage>.txt, the
meshopt-compressed model in base64; publish them beside the page, which fetches one when it is picked (the artifact host
serves .txt but not .glb). Every round that builds or changes a model runs this, so his 3D look never falls behind the
renders (round 13 shipped without it; Wendell, 2026-10-16: "that's where I'm doing a lot of my visual review from").

Round 16: an artifact version holds at most 511 files, and the page had 497 after the badger. --pack writes one file per
state and element instead, OUT_DIR/glb/<base>-<state>-<element>.json, {stage: base64 model}, so a base with five states
takes 17 files in place of 85. The page lists packed bases in PACKED and takes the stage it wants from the pack.
    python3 viewer_models.py --repack OUT_DIR base=DIR_OF_TXT ...
packs a stateless base's published .txt files (<base>-<element>-<stage>.txt) into <base>-<element>.json the same way."""
import base64, json, pathlib, subprocess, sys, tempfile

ST = ["gas", "core", "hologram", "creature", "ascended"]

if sys.argv[1] == "--repack":
    OUT = pathlib.Path(sys.argv[2]) / "glb"; OUT.mkdir(parents=True, exist_ok=True)
    for base, d in (a.split("=", 1) for a in sys.argv[3:]):
        for el in ("earth", "wood", "fire", "water", "metal"):
            pack = {st: pathlib.Path(d, f"{base}-{el}-{st}.txt").read_text().strip() for st in ST}
            (OUT / f"{base}-{el}.json").write_text(json.dumps(pack, separators=(",", ":")))
            print(f"{base}-{el}.json", flush=True)
    sys.exit()

PACK = "--pack" in sys.argv
args = [a for a in sys.argv[1:] if a != "--pack"]
OUT = pathlib.Path(args[0]) / "glb"; OUT.mkdir(parents=True, exist_ok=True)
BASE = args[1]; SRC = dict(a.split("=", 1) for a in args[2:])
total, packs = 0, {}
with tempfile.TemporaryDirectory() as tmp:
    for state, d in SRC.items():
        for g in sorted(pathlib.Path(d, "glb").glob("*.glb")):
            c = pathlib.Path(tmp) / g.name
            subprocess.run(["npx", "-y", "@gltf-transform/cli@4", "meshopt", str(g), str(c)], check=True, capture_output=True)
            text = base64.b64encode(c.read_bytes()).decode()
            if PACK:
                el, st = g.stem.split("-", 1)
                packs.setdefault(f"{BASE}-{state}-{el}", {})[st] = text
            else:
                t = OUT / f"{BASE}-{state}-{g.stem}.txt"
                t.write_text(text); total += t.stat().st_size
            print(g.stem, state, c.stat().st_size // 1024, "KB", flush=True)
for name, pack in packs.items():
    t = OUT / f"{name}.json"
    t.write_text(json.dumps(pack, separators=(",", ":"))); total += t.stat().st_size
print(len(packs) or len(list(OUT.glob(f"{BASE}-*.txt"))), "files,", total // 1024, "KB of base64")
