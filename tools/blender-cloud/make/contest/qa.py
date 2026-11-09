"""Contest QA gate — run against one candidate script.

Usage: python3 qa.py <candidate.py> [render_dir]

Static tier (always runs):
  1. parses (ast)
  2. has build() entrypoint
  3. no network imports (requests, urllib, socket, http)
  4. no nondeterminism without fixed seed (random/np.random guarded)

Blender tier (runs only when bpy imports — the bpy wheel or blender binary env):
  5. build() runs in a fresh scene, raises on error
  6. scene ends with >= 1 mesh object, <= 200k triangles total
  7. if a camera exists, renders still.png into render_dir (default: alongside candidate)
  8. prints QA json: {ok, tier, objects, tris, render}
Exit 0 on pass, 1 on fail.
"""
import ast
import json
import os
import sys

FORBIDDEN_IMPORTS = {"requests", "urllib", "socket", "http", "httpx", "aiohttp"}


def static_checks(path):
    src = open(path).read()
    tree = ast.parse(src)
    names = {n.name for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}
    if "build" not in names:
        return False, "no build() entrypoint"
    bad = [a.module for a in ast.walk(tree) if isinstance(a, ast.Import) and a.module and a.module.split(".")[0] in FORBIDDEN_IMPORTS]
    bad += [a.name.split(".")[0] for a in ast.walk(tree) if isinstance(a, ast.ImportFrom) and a.module and a.module.split(".")[0] in FORBIDDEN_IMPORTS]
    if bad:
        return False, f"forbidden import(s): {sorted(set(bad))}"
    rngs = [n for n in ast.walk(tree) if (isinstance(n, ast.Attribute) and n.attr in {"seed", "randint", "random", "uniform", "normal", "choice"}) or (isinstance(n, ast.Call) and getattr(getattr(n.func, "attr", getattr(n.func, "id", "")), "lower", lambda: "") in {"random", "randint", "uniform", "normal", "choice"})]
    has_seed = any(isinstance(n, ast.Call) and getattr(getattr(n.func, "attr", ""), "lower", lambda: "") == "seed" for n in ast.walk(tree))
    if rngs and not has_seed:
        return False, "randomness present without a fixed seed"
    return True, "static ok"


def blender_checks(path, render_dir):
    import bpy  # noqa: PLC0415 — only required in the blender tier
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    ns = runpy_namespace(path)
    ns["build"]()
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    tris = 0
    for o in meshes:
        tris += len(o.data.polygons) if o.data.polygons else 0
    if not meshes:
        return False, {"error": "no mesh objects after build()"}
    if tris > 200_000:
        return False, {"error": f"triangle budget exceeded: {tris}"}
    render = None
    cam = next((o for o in bpy.data.objects if o.type == "CAMERA"), None)
    if cam:
        out = os.path.join(render_dir, "still.png")
        os.makedirs(render_dir, exist_ok=True)
        bpy.context.scene.render.filepath = out
        bpy.context.scene.render.resolution_x = 960
        bpy.context.scene.render.resolution_y = 540
        bpy.ops.render.render(write_still=True)
        render = out if os.path.exists(out) else None
    return True, {"objects": len(bpy.data.objects), "tris": tris, "render": render}


def runpy_namespace(path):
    import runpy
    return runpy.run_path(path, run_name="candidate")


def main():
    path = sys.argv[1]
    render_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(path)
    ok, info = static_checks(path)
    tier = "static"
    if ok:
        try:
            import bpy  # noqa: F401
            tier = "blender"
            ok, info = blender_checks(path, render_dir)
        except ImportError:
            info = "bpy unavailable — static tier only"
    result = {"candidate": os.path.basename(path), "ok": ok, "tier": tier, "detail": info}
    print(json.dumps(result, indent=1))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()