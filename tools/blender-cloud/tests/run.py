"""Runs the Blender pipeline tests and writes $W/test-summary.md (spec: .specify/specs/blender-pipeline-test/).

usage: python3 tools/blender-cloud/tests/run.py [--tier offline,bpy,net] [--only G1,R2]
Exits non-zero on any failure that is not a marked known gap. Run it in the background and read the summary once:
    python3 tools/blender-cloud/tests/run.py --tier offline,bpy > $W/test-run.log 2>&1 &
The bpy tier uses $BLENV (default /home/user/blenv/bin/python; see the README to make it).
"""
import argparse, json, os, pathlib, subprocess, sys, time

HERE = pathlib.Path(__file__).resolve().parent
W = pathlib.Path(os.environ.get("W", "/tmp/blender-cloud"))
BLENV = os.environ.get("BLENV", "/home/user/blenv/bin/python")
TIERS = {"offline": (sys.executable, "test_offline.py"), "bpy": (BLENV, "test_bpy.py"), "net": (sys.executable, "test_net.py")}
MARK = {"pass": "pass", "fail": "FAIL", "gap": "known gap", "skip": "skipped"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tier", default="offline")
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    W.mkdir(parents=True, exist_ok=True)
    os.environ["W"] = str(W)
    results, started = [], time.time()
    for tier in a.tier.split(","):
        py, script = TIERS[tier]
        if not pathlib.Path(py).exists():
            results.append({"id": tier, "status": "skip", "detail": f"no Python at {py}; make the bpy venv (README)"})
            continue
        r = subprocess.run([py, str(HERE / script), a.only], capture_output=True, text=True)
        lines = [json.loads(l) for l in r.stdout.splitlines() if l.startswith("{")]
        results += lines
        for l in r.stdout.splitlines():
            if not l.startswith("{"):
                print(l)
        if r.returncode != 0:
            results.append({"id": tier, "status": "fail", "detail": f"{script} exited {r.returncode}: {r.stderr.strip()[-300:]}"})
    if "net" in a.tier and "bpy" in a.tier and any(x["id"] in ("G4", "G5") and x["status"] == "skip" for x in results) and (W / "assets/table.glb").exists():
        again = subprocess.run([BLENV, str(HERE / "test_bpy.py"), "G4,G5"], capture_output=True, text=True)  # the net tier fetched the table
        redo = [json.loads(l) for l in again.stdout.splitlines() if l.startswith("{")]
        results = [x for x in results if x["id"] not in ("G4", "G5")] + redo
    looks = [x for x in results if x.get("eyes")]
    out = [f"# Blender pipeline tests, {time.strftime('%Y-%m-%d %H:%M')} ({time.time() - started:.0f} s, tiers {a.tier})", ""]
    passed = [x["id"] for x in results if x["status"] == "pass"]
    out += [f"- pass: {', '.join(passed) or 'none'}"]
    out += [f"- {x['id']}: {MARK[x['status']]}. {x['detail']}"[:300] for x in results if x["status"] != "pass"]
    if looks:
        out += ["", "Waiting for eyes (tools/blender-cloud/tests/LOOKED.md):"] + [f"- {x['eyes']}" for x in looks]
    (W / "test-summary.md").write_text("\n".join(out[:30]) + "\n")
    print("\n".join(out))
    print("\nEvery test:\n" + "\n".join(f"- {x['id']}: {MARK[x['status']]}. {x['detail']}" for x in results))
    sys.exit(1 if any(x["status"] == "fail" for x in results) else 0)


if __name__ == "__main__":
    main()
