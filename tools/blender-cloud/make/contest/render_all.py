"""The contest's render tier over both contenders: one still per object, then the numbers into results.json.

  python3 render_all.py            # ten candidates, CYCLES, 640x360

Each candidate runs in its own qa.py process, so a candidate that takes Blender down with it costs one still and
not the batch. results.json keeps the fields the race wrote (oid, path, size, ok, seconds) and gains a `render`
object: pass/fail, engine, wall time, the PNG's path, and the frame's mean and spread. `render_ok` repeats the
verdict where a reader looks first. Nothing here judges quality: the look gate is Wendell's.
"""
import json
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
CONTENDERS = ("deepseek", "glm")
OBJECTS = {"obj1": "bell", "obj2": "trigram_floor", "obj3": "guandao", "obj4": "hearth_jars", "obj5": "formation"}


def run(candidate, tmp_json):
    tmp_json.unlink(missing_ok=True)  # a crash writes no result, and the last candidate's file must not stand in
    started = time.time()
    proc = subprocess.run([sys.executable, str(HERE / "qa.py"), "--render", str(candidate),
                           "--engine", "CYCLES", "--out", str(tmp_json)],
                          capture_output=True, text=True)
    wall = round(time.time() - started, 1)
    try:
        result = json.loads(tmp_json.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001 - a crash with no JSON is a failed still, not a failed run
        result = {"candidate": candidate.name, "ok": False, "tier": "render",
                  "detail": {"error": f"qa.py wrote no result ({exc}); exit {proc.returncode}: "
                                      f"{(proc.stderr or proc.stdout).strip()[-300:]}"}}
    result["wall_seconds"] = wall
    return result


def main():
    tmp_json = HERE / ".qa_render_tmp.json"
    summary = []
    for contender in CONTENDERS:
        results_path = HERE / contender / "results.json"
        results = json.loads(results_path.read_text(encoding="utf-8"))
        by_oid = {r["oid"]: r for r in results}
        for py in sorted((HERE / contender).glob("obj*.py")):
            oid = py.stem
            print(f"== {contender}/{py.name}", flush=True)
            result = run(py, tmp_json)
            detail = result.get("detail") or {}
            render_ok = bool(result.get("ok")) and bool(detail.get("render"))
            png = detail.get("render")
            entry = by_oid.setdefault(oid, {"oid": oid, "path": str(py), "size": py.stat().st_size})
            entry["object"] = OBJECTS.get(oid, oid)
            entry["render"] = {
                "ok": render_ok,
                "png": str(Path(png).relative_to(HERE)) if png else None,
                "engine": detail.get("engine"),
                "seconds": detail.get("render_seconds"),
                "size": detail.get("size"),
                "blank": detail.get("blank"),
                "frame": detail.get("frame"),
                "added": detail.get("added"),
                "error": detail.get("error"),
                "mesh_tris": detail.get("tris"),
                "build_seconds": detail.get("build_seconds"),
                "host": "freebuff cloud VM (bpy 5.2.2 wheel, CPU, no GPU)",
            }
            entry["render_ok"] = render_ok
            summary.append((contender, oid, render_ok, detail.get("render_seconds"), detail.get("error")))
            print(f"   {'PASS' if render_ok else 'FAIL'} {detail.get('render_seconds')}s {png or ''} "
                  f"{detail.get('error') or ''}", flush=True)
        results_path.write_text(json.dumps(results, indent=1) + "\n", encoding="utf-8")
    if tmp_json.exists():
        tmp_json.unlink()
    passed = sum(1 for s in summary if s[2])
    print(f"\nRESULT render tier: {passed}/{len(summary)} stills passed")
    for contender, oid, ok, secs, err in summary:
        if not ok:
            print(f"  FAIL {contender}/{oid}: {err}")
    return 0 if passed == len(summary) else 1


if __name__ == "__main__":
    sys.exit(main())
