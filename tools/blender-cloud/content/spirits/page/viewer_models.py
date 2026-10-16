"""Readies a base's models for the proof page's 3D viewer, one folder per satisfaction state.

    python3 viewer_models.py OUT_DIR raccoon neutral=DIR dissatisfied=DIR satisfied=DIR

Each DIR is a shellback.py OUT folder (--state). Writes OUT_DIR/glb/<base>-<state>-<element>-<stage>.txt, the
meshopt-compressed model in base64; publish them beside the page, which fetches one when it is picked (the artifact host
serves .txt but not .glb). Every round that builds or changes a model runs this, so his 3D look never falls behind the
renders (round 13 shipped without it; Wendell, 2026-10-16: "that's where I'm doing a lot of my visual review from")."""
import base64, pathlib, subprocess, sys, tempfile

OUT = pathlib.Path(sys.argv[1]) / "glb"; OUT.mkdir(parents=True, exist_ok=True)
BASE = sys.argv[2]; SRC = dict(a.split("=", 1) for a in sys.argv[3:])
total = 0
with tempfile.TemporaryDirectory() as tmp:
    for state, d in SRC.items():
        for g in sorted(pathlib.Path(d, "glb").glob("*.glb")):
            c = pathlib.Path(tmp) / g.name
            subprocess.run(["npx", "-y", "@gltf-transform/cli@4", "meshopt", str(g), str(c)], check=True, capture_output=True)
            t = OUT / f"{BASE}-{state}-{g.stem}.txt"
            t.write_text(base64.b64encode(c.read_bytes()).decode()); total += t.stat().st_size
            print(t.name, c.stat().st_size // 1024, "KB", flush=True)
print(len(list(OUT.glob(f"{BASE}-*.txt"))), "models,", total // 1024, "KB of base64")
