#!/usr/bin/env python3
"""Validate a WorkAdventure world folder, copy it into the box's map volume, and write portals.json.

    python3 wa-world-kit/publish.py <world-dir> --volume /opt/workadventure/maps [--dry-run]

A world folder holds one or more Tiled .tmj maps plus the images they use. A map is valid when it is
JSON, 32-pixel tiles, has a "start" layer or an area named "start", and every image and tileset
it names exists next to it. Exits are map properties named `exitUrl` and are checked against the
maps present. portals.json lists each published map with its size, its exits and which maps lead to it.
"""
import argparse, json, shutil, sys
from pathlib import Path


def check_map(path: Path):
    problems, info = [], {"file": path.name, "exits": []}
    try:
        m = json.loads(path.read_text())
    except Exception as e:
        return [f"{path.name}: not valid JSON ({e})"], info
    if m.get("tilewidth") != 32 or m.get("tileheight") != 32:
        problems.append(f"{path.name}: tiles must be 32x32, got {m.get('tilewidth')}x{m.get('tileheight')}")
    info["size"] = [m.get("width"), m.get("height")]
    names = {l.get("name") for l in m.get("layers", [])}
    if "start" not in names:
        problems.append(f"{path.name}: needs a layer or area named 'start'")
    for ts in m.get("tilesets", []):
        img = ts.get("image")
        if img and not (path.parent / img).is_file():
            problems.append(f"{path.name}: tileset image missing: {img}")
    def props(layer):
        for p in layer.get("properties", []) or []:
            yield p.get("name"), p.get("value")
    for p in m.get("properties", []) or []:
        if p.get("name") == "script" and not (path.parent / str(p.get("value"))).is_file() and not str(p.get("value")).startswith("http"):
            problems.append(f"{path.name}: script not found: {p.get('value')}")
    for l in m.get("layers", []):
        for n, v in props(l):
            if n == "exitUrl":
                info["exits"].append(str(v).split("#")[0])
        for o in l.get("objects", []) or []:
            for n, v in props(o):
                if n == "exitUrl":
                    info["exits"].append(str(v).split("#")[0])
    return problems, info


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("world")
    ap.add_argument("--volume", required=True)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args(argv)
    src = Path(a.world)
    maps = sorted(src.glob("*.tmj"))
    if not maps:
        print(f"no .tmj maps in {src}", file=sys.stderr)
        return 2
    problems, infos = [], []
    for m in maps:
        p, i = check_map(m)
        problems += p
        infos.append(i)
    local = {i["file"] for i in infos}
    for i in infos:
        for e in i["exits"]:
            if "://" not in e and not e.startswith("/_/") and Path(e).name not in local:
                problems.append(f"{i['file']}: exit leads to a map that is not in this world: {e}")
    if problems:
        print("refused:\n  " + "\n  ".join(problems), file=sys.stderr)
        return 1
    for i in infos:
        i["from"] = sorted(j["file"] for j in infos if i["file"] in {Path(e).name for e in j["exits"]})
    portals = {"maps": infos}
    if a.dry_run:
        print(json.dumps(portals, indent=1))
        return 0
    dest = Path(a.volume) / src.resolve().name
    dest.mkdir(parents=True, exist_ok=True)
    for f in src.rglob("*"):
        if f.is_file() and f.name != "portals.json":
            t = dest / f.relative_to(src)
            t.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, t)
    (dest / "portals.json").write_text(json.dumps(portals, indent=1) + "\n")
    print(f"published {len(infos)} map(s) to {dest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
