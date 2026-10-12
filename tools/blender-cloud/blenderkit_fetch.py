"""Search Blendkit (formerly BlenderKit) and download one asset file.

usage:
  python blenderkit_fetch.py "wooden chair" OUT_DIR [--index 0] [--file-type gltf]
  python blenderkit_fetch.py --selftest

Defaults to CC0 assets, the only licence that lets a model sit in a published web page (Blendkit terms,
art. 5). `--license any` allows Royalty Free assets, for renders and previews only.
Writes <name>.<ext> and <name>.json (name, author, licence, id) next to it; build_viewer.py reads the JSON.

Key: none is sent unless BLENDERKIT_API_KEY is set. In the cloud sandbox the proxy adds it for
api.blenderkit.com, so leave it unset there. Never print or store the key.
Hosts used: api.blenderkit.com and assets.blenderkit.com.
"""
import argparse, json, os, pathlib, re, ssl, sys, urllib.error, urllib.parse, urllib.request, uuid

API = "https://api.blenderkit.com/api/v1"
UUID_FILE = pathlib.Path(os.environ.get("XDG_CACHE_HOME", pathlib.Path.home() / ".cache")) / "blender-cloud" / "scene_uuid"
EXT = {"blend": "blend", "gltf": "glb", "gltf_godot": "glb", "thumbnail": "jpg"}


def scene_uuid():
    """The download endpoint wants a scene_uuid. One id per machine, reused, like the Blender add-on's scene id."""
    env = os.environ.get("BLENDERKIT_SCENE_UUID")
    if env:
        return env
    try:
        return UUID_FILE.read_text().strip() or _make_uuid()
    except OSError:
        return _make_uuid()


def _make_uuid():
    u = str(uuid.uuid4())
    try:
        UUID_FILE.parent.mkdir(parents=True, exist_ok=True)
        UUID_FILE.write_text(u)
    except OSError:
        pass
    return u


def get(url, with_key=True):
    ctx = ssl.create_default_context(cafile=os.environ.get("SSL_CERT_FILE") or None)
    # assets.blenderkit.com answers 403 to urllib's default User-Agent
    headers = {"User-Agent": "curl/8"}
    key = os.environ.get("BLENDERKIT_API_KEY")
    if key and with_key and url.startswith(API):
        headers["Authorization"] = f"Bearer {key}"
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=120, context=ctx) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        detail = e.read()[:300].decode("utf8", "replace")
        sys.exit(f"HTTP {e.code} from {urllib.parse.urlsplit(url).netloc}: {detail}\n"
                 "If this names a missing parameter, the API changed; see the README, problem 2.")


def search(query, asset_type="model", license_="cc_zero", n=20):
    q = f"{query} asset_type:{asset_type}" + ("" if license_ == "any" else f" license:{license_}")
    d = json.loads(get(f"{API}/search/?{urllib.parse.urlencode({'query': q, 'page_size': n})}"))
    return [r for r in d["results"] if r.get("isFree")]


def resolve(file_entry):
    return json.loads(get(f"{file_entry['downloadUrl']}?scene_uuid={scene_uuid()}"))["filePath"]


def selftest():
    r = search("chair", n=1)
    assert r, "search returned no free CC0 result"
    thumb = {f["fileType"]: f for f in r[0]["files"]}["thumbnail"]
    data = get(resolve(thumb))
    assert data[:2] == b"\xff\xd8", "thumbnail is not a JPEG"
    print(f"selftest ok: found {r[0]['name']!r}, downloaded its thumbnail ({len(data)} bytes)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query", nargs="?")
    ap.add_argument("out_dir", nargs="?")
    ap.add_argument("--index", type=int, default=0, help="Nth free result")
    ap.add_argument("--file-type", default="gltf", help="gltf (default), blend, thumbnail, resolution_1K ...")
    ap.add_argument("--asset-type", default="model")
    ap.add_argument("--license", default="cc_zero", help="cc_zero (default) or any")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if not (a.query and a.out_dir):
        ap.error("query and out_dir are required")

    free = search(a.query, a.asset_type, a.license)
    if a.index >= len(free):
        sys.exit(f"only {len(free)} free {a.license} results for {a.query!r}")
    r = free[a.index]
    files = {f["fileType"]: f for f in r["files"]}
    ft = a.file_type
    if ft not in files and ft == "gltf" and "blend" in files:
        print("no glTF for this asset; using the .blend (large; see README problems 3 to 5)")
        ft = "blend"
    if ft not in files:
        sys.exit(f"no {a.file_type}; has {sorted(files)}")
    info = {"name": r["name"], "author": r["author"]["fullName"], "license": r.get("license"), "id": r["id"],
            "file_type": ft, "source": f"https://www.blendkit.com/asset-gallery-detail/{r['assetBaseId']}/"}
    for k, v in info.items():
        print(f"{k:9}: {v}")
    out_dir = pathlib.Path(a.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = re.sub(r"[^A-Za-z0-9_-]+", "_", r["name"]).strip("_")
    out = out_dir / f"{stem}.{EXT.get(ft, 'bin')}"
    data = get(resolve(files[ft]))
    out.write_bytes(data)
    out.with_suffix(".json").write_text(json.dumps(info, indent=2))
    print("saved    :", out, f"({len(data) / 1048576:.1f} MB)")


if __name__ == "__main__":
    main()
