"""Contest QA gate — run against one candidate script.

Usage:
  python3 qa.py <candidate.py> [render_dir]                     # static tier, then the Blender tier when bpy imports
  python3 qa.py --render <candidate.py> [render_dir] [--out f]  # plus one still, render_<stem>.png, next to it

Static tier (always runs):
  1. parses (ast)
  2. has build_object() entrypoint
  3. no network imports (requests, urllib, socket, http)
  4. no nondeterminism without fixed seed (random/np.random guarded)

Blender tier (runs only when bpy imports — the bpy wheel or blender binary env):
  5. build_object() runs in a fresh scene, raises on error
  6. scene ends with >= 1 mesh object, <= 200k triangles total
  7. prints QA json: {ok, tier, objects, tris}
Exit 0 on pass, 1 on fail.

Render tier (--render):
  8. one still at 640x360 into render_<stem>.png next to the candidate. The candidate's own camera and lights are
     used when it makes them; a framing camera and two lights are added when it does not, and the addition is
     named in the result. A candidate's own render call is dropped while it builds, because the still is the
     harness's job and the candidates hard-code paths this box does not have.
  9. the frame must not be blank: a flat background fails the tier, and the frame's mean and spread are recorded.
Engine: CYCLES on CPU. EEVEE and Workbench both need a GPU context and this box has none; naming the engine here
keeps that divergence in the numbers rather than in a reader's head. --engine takes any Blender engine name.
"""
import ast
import json
import os
import sys
import time

FORBIDDEN_IMPORTS = {"requests", "urllib", "socket", "http", "httpx", "aiohttp"}
RENDER_SIZE = (640, 360)
ENGINE = "CYCLES"


def static_checks(path):
    src = open(path).read()
    tree = ast.parse(src)
    names = {n.name for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}
    if "build_object" not in names:
        return False, "no build_object() entrypoint"
    bad = [al.name.split(".")[0] for a in ast.walk(tree) if isinstance(a, ast.Import) for al in a.names if al.name.split(".")[0] in FORBIDDEN_IMPORTS]
    bad += [a.module.split(".")[0] for a in ast.walk(tree) if isinstance(a, ast.ImportFrom) and a.module and a.module.split(".")[0] in FORBIDDEN_IMPORTS]
    if bad:
        return False, f"forbidden import(s): {sorted(set(bad))}"
    rngs = [n for n in ast.walk(tree) if (isinstance(n, ast.Attribute) and n.attr in {"seed", "randint", "random", "uniform", "normal", "choice"}) or (isinstance(n, ast.Call) and getattr(getattr(n.func, "attr", getattr(n.func, "id", "")), "lower", lambda: "") in {"random", "randint", "uniform", "normal", "choice"})]
    has_seed = any(isinstance(n, ast.Call) and getattr(getattr(n.func, "attr", ""), "lower", lambda: "") == "seed" for n in ast.walk(tree))
    if rngs and not has_seed:
        return False, "randomness present without a fixed seed"
    return True, "static ok"


class _NoRender:
    """Stands in for bpy.ops.render.render while a candidate builds."""

    def __call__(self, *args, **kwargs):
        return {"CANCELLED"}


def quiet_bpy(real):
    """A stand-in for the bpy module whose only difference is that render calls return CANCELLED."""

    class RenderOps:
        def __getattr__(self, name):
            return _NoRender() if name == "render" else getattr(real.ops.render, name)

    class Ops:
        def __getattr__(self, name):
            return RenderOps() if name == "render" else getattr(real.ops, name)

    class Module:
        def __getattr__(self, name):
            return Ops() if name == "ops" else getattr(real, name)

    return Module()


def runpy_namespace(path):
    import runpy
    return runpy.run_path(path, run_name="candidate")


def frame_camera(meshes):
    """A three-quarter camera that frames every mesh, for a candidate that makes none."""
    import bpy
    from mathutils import Vector
    lo = Vector((float("inf"),) * 3)
    hi = Vector((float("-inf"),) * 3)
    for o in meshes:
        for corner in o.bound_box:
            p = o.matrix_world @ Vector(corner)
            lo = Vector((min(lo[i], p[i]) for i in range(3)))
            hi = Vector((max(hi[i], p[i]) for i in range(3)))
    centre = (lo + hi) / 2
    radius = max((hi - lo).length / 2, 0.25)
    direction = Vector((1.0, -1.1, 0.65)).normalized()
    bpy.ops.object.camera_add(location=centre + direction * radius * 2.9)
    cam = bpy.context.object
    cam.data.lens = 50
    target = centre - cam.location
    cam.rotation_euler = target.to_track_quat("-Z", "Y").to_euler()
    return cam


def two_lights(centre, radius):
    """Key and fill, the contest's fixed two-light setup, for a candidate that makes none."""
    import bpy
    from mathutils import Vector
    for kind, offset, energy, size in (("AREA", (1.0, -1.0, 1.2), 900, 6.0),
                                       ("AREA", (-1.2, -0.4, 0.6), 350, 8.0)):
        d = Vector(offset).normalized() * radius * 3.0
        bpy.ops.object.light_add(type=kind, location=centre + d)
        light = bpy.context.object
        light.data.energy = energy * max(radius, 0.5) ** 2
        light.data.size = size * max(radius, 0.5)
        aim = centre - light.location
        light.rotation_euler = aim.to_track_quat("-Z", "Y").to_euler()


def frame_stats(png):
    """Mean and spread of the rendered pixels: a blank frame is one colour or a flat background."""
    import bpy
    img = bpy.data.images.load(png, check_existing=False)
    px = list(img.pixels)
    rgb = [px[i] for i in range(0, len(px), 4)]
    bpy.data.images.remove(img)
    n = len(rgb) or 1
    mean = sum(rgb) / n
    std = (sum((v - mean) ** 2 for v in rgb) / n) ** 0.5
    return {"mean": round(mean, 4), "std": round(std, 4), "min": round(min(rgb), 4), "max": round(max(rgb), 4)}


def render_still(path, render_dir, engine):
    import bpy
    from mathutils import Vector
    scene = bpy.context.scene
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    lo = Vector((float("inf"),) * 3)
    hi = Vector((float("-inf"),) * 3)
    for o in meshes:
        for corner in o.bound_box:
            p = o.matrix_world @ Vector(corner)
            lo = Vector((min(lo[i], p[i]) for i in range(3)))
            hi = Vector((max(hi[i], p[i]) for i in range(3)))
    centre = (lo + hi) / 2 if meshes else Vector((0, 0, 0))
    radius = max((hi - lo).length / 2, 0.25) if meshes else 1.0
    added = []
    if not any(o.type == "CAMERA" for o in bpy.data.objects):
        scene.camera = frame_camera(meshes)
        added.append("camera (none in the script)")
    elif scene.camera is None:
        scene.camera = next(o for o in bpy.data.objects if o.type == "CAMERA")
        added.append("scene.camera (a camera existed but was not set)")
    if not any(o.type == "LIGHT" for o in bpy.data.objects):
        two_lights(centre, radius)
        added.append("two lights (none in the script)")
    if scene.world is None:
        scene.world = bpy.data.worlds.new("QAWorld")
        added.append("a world (none in the script)")
    scene.render.resolution_x, scene.render.resolution_y = RENDER_SIZE
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.engine = engine
    if engine == "CYCLES":
        scene.cycles.device = "CPU"
        scene.cycles.samples = 48
        scene.cycles.use_denoising = True
    os.makedirs(render_dir, exist_ok=True)
    stem = os.path.splitext(os.path.basename(path))[0]
    out = os.path.join(render_dir, f"render_{stem}.png")
    scene.render.filepath = out
    started = time.time()
    bpy.ops.render.render(write_still=True)
    seconds = round(time.time() - started, 1)
    if not os.path.exists(out):
        return False, {"render": None, "engine": engine, "added": added, "error": "no PNG written"}
    stats = frame_stats(out)
    blank = stats["std"] < 0.01
    detail = {"render": out, "render_seconds": seconds, "engine": engine, "size": list(RENDER_SIZE),
              "frame": stats, "blank": blank, "added": added}
    if blank:
        return False, {**detail, "error": "blank frame: nothing drawn but the background"}
    return True, detail


def blender_checks(path, render_dir, do_render=False, engine=ENGINE):
    import bpy
    started = time.time()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    real = sys.modules.get("bpy")
    sys.modules["bpy"] = quiet_bpy(real)
    try:
        ns = runpy_namespace(path)
        entry = ns.get("build_object") or ns.get("build")
        if not callable(entry):
            return False, {"error": "no build_object() entrypoint"}
        entry()
    finally:
        if real is not None:
            sys.modules["bpy"] = real
        else:
            sys.modules.pop("bpy", None)
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    tris = 0
    for o in meshes:
        tris += len(o.data.polygons) if o.data.polygons else 0
    detail = {"objects": len(bpy.data.objects), "meshes": len(meshes), "tris": tris,
              "build_seconds": round(time.time() - started, 1)}
    if not meshes:
        return False, {**detail, "error": "no mesh objects after build_object()"}
    if tris > 200_000:
        return False, {**detail, "error": f"triangle budget exceeded: {tris}"}
    if not do_render:
        return True, detail
    ok, info = render_still(path, render_dir, engine)
    return ok, {**detail, **info}


def main(argv=None):
    args = list(sys.argv[1:] if argv is None else argv)
    do_render = "--render" in args
    if do_render:
        args.remove("--render")
    engine = ENGINE
    if "--engine" in args:
        i = args.index("--engine")
        engine = args[i + 1].upper()
        del args[i:i + 2]
    out_json = None
    if "--out" in args:
        i = args.index("--out")
        out_json = args[i + 1]
        del args[i:i + 2]
    if not args:
        print(__doc__.strip().splitlines()[2])
        return 2
    path = args[0]
    render_dir = args[1] if len(args) > 1 else os.path.dirname(path)
    tier = "static"
    try:
        ok, info = static_checks(path)
    except SyntaxError as exc:
        ok, info = False, f"syntax error: {exc}"
    if ok:
        try:
            import bpy  # noqa: F401
            tier = "render" if do_render else "blender"
            ok, info = blender_checks(path, render_dir, do_render, engine)
        except ImportError:
            ok = not do_render
            info = "bpy unavailable — static tier only" if not do_render else "bpy unavailable — the render tier cannot run"
    result = {"candidate": os.path.basename(path), "ok": ok, "tier": tier, "detail": info}
    if out_json:
        with open(out_json, "w", encoding="utf-8") as fh:
            json.dump(result, fh, indent=1)
    print(json.dumps(result, indent=1))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
