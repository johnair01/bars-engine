"""Search BlenderKit and download one asset file, with no API key in the request.

The sandbox proxy adds the BlenderKit credential for api.blenderkit.com, so
this script never sees or needs a key.

usage: python blenderkit_fetch.py "wooden chair" OUT_DIR [--index 0] [--file-type blend]
Prints the asset's name, author, licence and id, then saves OUT_DIR/<name>.<ext>.
Free assets only. Hosts used: api.blenderkit.com and assets.blenderkit.com.
"""
import argparse, json, os, re, ssl, sys, urllib.parse, urllib.request, uuid

API = "https://api.blenderkit.com/api/v1"


def get(url):
    ctx = ssl.create_default_context(cafile=os.environ.get("SSL_CERT_FILE") or None)
    # assets.blenderkit.com answers 403 to urllib's default User-Agent
    req = urllib.request.Request(url, headers={"User-Agent": "curl/8"})
    with urllib.request.urlopen(req, timeout=120, context=ctx) as r:
        return r.read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query")
    ap.add_argument("out_dir")
    ap.add_argument("--index", type=int, default=0, help="Nth free result")
    ap.add_argument("--file-type", default="blend", help="blend, gltf, thumbnail, resolution_1K ...")
    ap.add_argument("--asset-type", default="model")
    a = ap.parse_args()

    q = urllib.parse.urlencode({"query": f"{a.query} asset_type:{a.asset_type}", "page_size": 20})
    results = json.loads(get(f"{API}/search/?{q}"))["results"]
    free = [r for r in results if r.get("isFree")]
    if a.index >= len(free):
        sys.exit(f"only {len(free)} free results for {a.query!r}")
    r = free[a.index]
    print("name   :", r["name"])
    print("author :", r["author"]["fullName"])
    print("licence:", r.get("license"))
    print("id     :", r["id"])
    files = {f["fileType"]: f for f in r["files"]}
    if a.file_type not in files:
        sys.exit(f"no {a.file_type}; has {sorted(files)}")
    # The download endpoint refuses requests without a scene_uuid; any fresh UUID works.
    link = json.loads(get(f"{files[a.file_type]['downloadUrl']}?scene_uuid={uuid.uuid4()}"))["filePath"]
    ext = "blend" if a.file_type == "blend" else "glb" if a.file_type.startswith("gltf") else "bin"
    if a.file_type == "thumbnail":
        ext = "jpg"
    os.makedirs(a.out_dir, exist_ok=True)
    out = os.path.join(a.out_dir, re.sub(r"[^A-Za-z0-9_-]+", "_", r["name"]).strip("_") + "." + ext)
    data = get(link)
    open(out, "wb").write(data)
    print("saved  :", out, f"({len(data) / 1048576:.1f} MB)")


if __name__ == "__main__":
    main()
