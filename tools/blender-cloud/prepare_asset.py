"""Make a GLB importable by the pip `bpy`, which cannot decode Draco or meshopt.

usage: python prepare_asset.py IN.glb OUT.glb
If IN.glb uses KHR_draco_mesh_compression or EXT_meshopt_compression, decode it with
@gltf-transform/cli (via npx) into OUT.glb. Otherwise copy it unchanged. Prints what it did.
Needs node and npm; the first run downloads the CLI from the npm registry.
"""
import json, pathlib, shutil, struct, subprocess, sys

NEEDS_DECODE = ("KHR_draco_mesh_compression", "EXT_meshopt_compression")


def glb_json(path):
    b = pathlib.Path(path).read_bytes()
    if b[:4] != b"glTF":
        sys.exit(f"{path} is not a binary glTF (.glb)")
    n = struct.unpack("<I", b[12:16])[0]
    return json.loads(b[20:20 + n])


def prepare(src, dst):
    src, dst = pathlib.Path(src), pathlib.Path(dst)
    used = glb_json(src).get("extensionsRequired", []) + glb_json(src).get("extensionsUsed", [])
    need = sorted({e for e in used if e in NEEDS_DECODE})
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not need:
        if src.resolve() != dst.resolve():
            shutil.copyfile(src, dst)
        return {"decoded": [], "bytes_in": src.stat().st_size, "bytes_out": dst.stat().st_size}
    if not shutil.which("npx"):
        sys.exit(f"{src.name} uses {', '.join(need)}, which bpy cannot read, and npx is not installed to decode it.")
    r = subprocess.run(["npx", "--yes", "@gltf-transform/cli@4", "copy", str(src), str(dst)],
                       capture_output=True, text=True, timeout=300)
    if r.returncode != 0 or not dst.exists():
        sys.exit(f"decode failed:\n{r.stderr[-800:]}")
    left = [e for e in need if e in glb_json(dst).get("extensionsUsed", [])]
    if left:
        sys.exit(f"still compressed after decode: {left}")
    return {"decoded": need, "bytes_in": src.stat().st_size, "bytes_out": dst.stat().st_size}


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    res = prepare(*sys.argv[1:])
    print("decoded:", res["decoded"] or "nothing needed", f"| {res['bytes_in'] / 1024:.0f} KB -> {res['bytes_out'] / 1024:.0f} KB")
