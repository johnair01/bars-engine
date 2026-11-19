#!/usr/bin/env python3
"""Elder regalia round 4: bake a true fold sculpt into the shell's cylindrical fold map.

Replaces the hand-authored height field of make_fold_normals.py (kept beside it as the fallback) with a normal + cavity
map baked from a high-poly sculpt in Blender. Contract (public/between/cult/make/painted.js, unchanged):
  u = atan2(rest.x, rest.z) / 2pi + 0.5   (0.5 front centre, 0 and 1 centre back)
  v = 0 at the sash (C.yWaist), 1 at the shoulder line (C.ySh + 0.03 k)
  RGB = tangent-space normal, +x along +u, +y along +v (up), +z out; A = cavity (1 clear crest .. ~0.45 deepest valley)
  one 2048x1024 RGBA PNG.

Run with Blender 5.2 headless (python3 council/tools/blender_here.py setup, then LD_LIBRARY_PATH as it prints):
  blender -b -P scripts/regalia/bake_fold_sculpt.py -- <stage> [--key value ...]
stages:
  test    bake one dome on the front and one on the back with this pipeline and check the channel signs
  sculpt  low shell from the dump, cloth-compression sculpt on a high grid, saves <work>/sculpt.blend
  bake    high -> low normal + cavity bake, packs <out>.png
  sheet   renders the high sculpt (what he asked to see)
The dump comes from export_shell.html + dump_shells.cjs (this folder): rest positions (aRest), aFold and the index of the
body's torso shell as JSON, plus the sash and shoulder heights the shader uses.
"""
import sys, os, json, math
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
stage = argv[0] if argv else 'test'
opt = {argv[i].lstrip('-'): argv[i + 1] for i in range(1, len(argv) - 1, 2) if argv[i].startswith('--')}
WORK = opt.get('work', '/tmp/lab/work')
os.makedirs(WORK, exist_ok=True)
W, H = 2048, 1024
TAU = 2 * math.pi

if stage != 'pack':
    import bpy, bmesh
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree


# ---------------------------------------------------------------- the low shell and its UVs
def t2b(p):
    """three.js (x, y up, z forward) to Blender (x, y = -z, z = y): a proper rotation, outward normals stay outward"""
    return (p[0], -p[2], p[1])


def b2t(p):
    return (p[0], p[2], -p[1])


def uv_of(pt, y0, y1):
    x, y, z = b2t(pt)
    return math.atan2(x, z) / TAU + 0.5, (y - y0) / (y1 - y0)


def load_dump(path):
    d = json.load(open(path))
    rest = np.array(d['rest'], dtype=np.float64).reshape(-1, 3)
    fold = np.array(d['fold'], dtype=np.float64)
    idx = np.array(d['idx'], dtype=np.int64).reshape(-1, 3)
    return rest, fold, idx


def build_low(dump, y0, y1, name='low'):
    """the shell as shipped, torso faces only, rest pose, UVs by the contract's formula with the seam split at the
    centre back so u runs 0..1 without wrapping inside a face"""
    rest, fold, idx = load_dump(dump)
    keep = fold[idx].mean(1) > 0.2
    m = bpy.data.meshes.new(name)
    m.from_pydata([t2b(p) for p in rest], [], [tuple(f) for f in idx[keep]])
    m.update()
    ob = bpy.data.objects.new(name, m)
    bpy.context.scene.collection.objects.link(ob)
    bm = bmesh.new(); bm.from_mesh(m)
    # drop stray bits: keep the largest connected piece
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, dist=1e-7, plane_co=(0, 0, 0), plane_no=(1, 0, 0), clear_inner=False, clear_outer=False)
    bm.faces.ensure_lookup_table()
    uvl = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        cx = sum(l.vert.co.x for l in f.loops) / len(f.loops)
        for l in f.loops:
            p = l.vert.co
            u, v = uv_of(p, y0, y1)
            if abs(p.x) < 1e-6 and b2t(p)[2] < 0:       # on the back seam: u = 1 on the +x side, 0 on the -x side
                u = 1.0 if cx > 0 else 0.0
            l[uvl].uv = (u, v)
    bm.to_mesh(m); bm.free()
    for p in m.polygons:
        p.use_smooth = True
    return ob


def clear_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)


def ray_surface(low, y0, y1, nu, nv, v_ext=(0.0, 1.0), base_sub=2):
    """grid of points ON the low surface: from the axis (x=0, z=0) outward along each u, so every point keeps the u, v it
    is built for. Returns P (nv, nu, 3) in Blender coords and the unit outward normals."""
    # the base the folds stand on is the shell as the game SHADES it (smooth normals), not its facets: subdivide a copy of the
    # low once or twice (Catmull-Clark) and cast the rays onto that, so the bake does not encode the low's flat faces
    tmp = low.copy(); tmp.data = low.data.copy(); bpy.context.scene.collection.objects.link(tmp)
    if base_sub:
        md = tmp.modifiers.new('ss', 'SUBSURF'); md.levels = base_sub; md.render_levels = base_sub; md.boundary_smooth = 'PRESERVE_CORNERS'
    ev = tmp.evaluated_get(bpy.context.evaluated_depsgraph_get()); me_ = bpy.data.meshes.new_from_object(ev)
    bm = bmesh.new(); bm.from_mesh(me_); bm.transform(low.matrix_world)
    tree = BVHTree.FromBMesh(bm)
    bpy.data.objects.remove(tmp, do_unlink=True)
    P = np.zeros((nv, nu, 3)); N = np.zeros((nv, nu, 3))
    for j in range(nv):
        v = v_ext[0] + (v_ext[1] - v_ext[0]) * j / (nv - 1)
        yt = y0 + v * (y1 - y0)
        for i in range(nu):
            u = (i + 0.5) / nu
            ph = (u - 0.5) * TAU
            dt = (math.sin(ph), 0.0, math.cos(ph))              # three coords direction; x, z
            origin = t2b((0.0, yt, 0.0)); direction = Vector(t2b(dt))
            loc, nrm, fi, dist = tree.ray_cast(Vector(origin), direction, 2.0)
            if loc is None:
                P[j, i] = P[j, i - 1] if i else origin; N[j, i] = N[j, i - 1] if i else (0, 0, 1)
            else:
                P[j, i] = loc; N[j, i] = nrm
    bm.free()
    d = np.hypot(P[..., 0], P[..., 1]); gj = np.abs(np.diff(d, axis=0)); gi = np.abs(d - np.roll(d, 1, 1))
    print('  ray surface: max radial jump per cell: v-dir %.1f mm, u-dir %.1f mm; cells > 15 mm: %d' % (gj.max() * 1000, gi.max() * 1000, int((gj > 0.015).sum() + (gi > 0.015).sum())))
    return P, N


# ---------------------------------------------------------------- baking
def new_image(name, w=W, h=H, color=(0.5, 0.5, 1.0, 1.0), non_color=True):
    img = bpy.data.images.new(name, w, h, alpha=True, float_buffer=True)
    img.generated_color = color
    if non_color:
        img.colorspace_settings.name = 'Non-Color'
    return img


def bake_pass(low, high, kind, img, extrusion=0.02, margin=16, samples=16, ao_distance=0.05):
    """kind: 'NORMAL' (tangent, OpenGL +Y up) or 'AO'. high -> low, selected-to-active."""
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples
    sc.cycles.use_denoising = False
    sc.render.bake.margin = margin; sc.render.bake.margin_type = 'EXTEND'
    mat = bpy.data.materials.new('bake_' + kind + img.name); mat.use_nodes = True
    nt = mat.node_tree; node = nt.nodes.new('ShaderNodeTexImage'); node.image = img; nt.nodes.active = node
    low.data.materials.clear(); low.data.materials.append(mat)
    for o in bpy.data.objects:
        o.select_set(False)
    high.select_set(True); low.select_set(True)
    bpy.context.view_layer.objects.active = low
    b = sc.render.bake
    if kind == 'NORMAL':
        b.normal_space = 'TANGENT'; b.normal_r = 'POS_X'; b.normal_g = 'POS_Y'; b.normal_b = 'POS_Z'
        b.use_selected_to_active = True; b.cage_extrusion = extrusion; b.max_ray_distance = extrusion * 2
        bpy.ops.object.bake(type='NORMAL', use_selected_to_active=True, cage_extrusion=extrusion, max_ray_distance=extrusion * 2,
                            normal_space='TANGENT', margin=margin, margin_type='EXTEND')
    else:
        sc.cycles.samples = max(samples, 32)
        bpy.ops.object.bake(type='AO', use_selected_to_active=True, cage_extrusion=extrusion, max_ray_distance=extrusion * 2,
                            margin=margin, margin_type='EXTEND')
    return img


def img_array(img):
    a = np.array(img.pixels[:], dtype=np.float32).reshape(img.size[1], img.size[0], 4)
    return a          # row 0 is the BOTTOM row in Blender (v = 0)


def save_png(path, rgba_bottom_up):
    from_blender = (np.clip(rgba_bottom_up, 0, 1)[::-1] * 255 + 0.5).astype(np.uint8)   # PNG row 0 is the top (v = 1)
    img = bpy.data.images.new('out', W, H, alpha=True)
    img.colorspace_settings.name = 'Non-Color'
    img.pixels = (from_blender[::-1].astype(np.float32) / 255).ravel()
    img.filepath_raw = path; img.file_format = 'PNG'; img.save()
    bpy.data.images.remove(img)


# ---------------------------------------------------------------- stage: test (the sign check)
def make_dome_pair(low, y0, y1, R_m=0.035, amp=0.010, nu=720, nv=300):
    """a high grid on the low surface with two domes: front (u = .5, v = .5) and back (u = .98, v = .5)"""
    P, N = ray_surface(low, y0, y1, nu, nv)
    V = np.linspace(0, 1, nv)[:, None] * np.ones((1, nu)); U = ((np.arange(nu) + 0.5) / nu)[None, :] * np.ones((nv, 1))
    h = np.zeros((nv, nu))
    for (uc, vc) in ((0.5, 0.5), (0.98, 0.5), (0.25, 0.3)):
        # distances in metres along the surface: u spans the circumference, ~0.17 m per radian
        du = ((U - uc + 0.5) % 1 - 0.5) * TAU * 0.17; dv = (V - vc) * (y1 - y0)
        h += amp * np.exp(-(du ** 2 + dv ** 2) / (2 * (R_m / 2) ** 2))
    return P + N * h[..., None], P, h


def grid_to_mesh(P, name, wrap=True):
    nv, nu, _ = P.shape
    verts = P.reshape(-1, 3).tolist(); faces = []
    for j in range(nv - 1):
        for i in range(nu if wrap else nu - 1):
            a = j * nu + i; b = j * nu + (i + 1) % nu; c = (j + 1) * nu + (i + 1) % nu; d = (j + 1) * nu + i
            faces.append((a, b, c, d))
    m = bpy.data.meshes.new(name); m.from_pydata(verts, [], faces); m.update()
    ob = bpy.data.objects.new(name, m); bpy.context.scene.collection.objects.link(ob)
    for p in m.polygons:
        p.use_smooth = True
    return ob


def check_outward(ob, label):
    """grid winding: Blender's quad order a,b,c,d runs +u then +v; with u increasing toward the body's left (+x at the
    front) and v up, the face normal points either out or in. Flip if it points in."""
    me = ob.data; bm = bmesh.new(); bm.from_mesh(me); bm.normal_update()
    c = Vector((0, 0, 0)); ins = 0
    for f in bm.faces:
        p = f.calc_center_median(); r = Vector((p.x, p.y, 0)); r.normalize()   # outward in the xy plane
        if f.normal.dot(r) < 0: ins += 1
    flip = ins > len(bm.faces) / 2
    if flip:
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
    bm.to_mesh(me); bm.free()
    print(f'[{label}] faces pointing in: {ins}/{len(me.polygons)} -> flipped={flip}')


def stage_test():
    clear_scene()
    y0, y1 = float(opt['y0']), float(opt['y1'])
    low = build_low(opt['dump'], y0, y1)
    Pd, Pb, h = make_dome_pair(low, y0, y1)
    high = grid_to_mesh(Pd, 'high'); check_outward(high, 'high')
    img = new_image('n_test')
    bake_pass(low, high, 'NORMAL', img)
    n = img_array(img)
    np.save(WORK + '/test_normal.npy', n)
    # the dome on the front is at u = .5, v = .5: look at the red channel across it, and green up/down
    px = int(0.5 * W); py = int(0.5 * H); s = 20
    r_lo = n[py, px - s, 0]; r_hi = n[py, px + s, 0]; g_lo = n[py - s, px, 1]; g_hi = n[py + s, px, 1]
    print(f'front dome: red at -u {r_lo:.3f}  +u {r_hi:.3f}   green below {g_lo:.3f} above {g_hi:.3f}')
    px = int(0.98 * W); r_lo = n[py, px - s, 0]; r_hi = n[py, px + s, 0]; g_lo = n[py - s, px, 1]; g_hi = n[py + s, px, 1]
    print(f'back dome : red at -u {r_lo:.3f}  +u {r_hi:.3f}   green below {g_lo:.3f} above {g_hi:.3f}')
    # reference: the dome's own height field through make_fold_normals.py's math (n = (-dh/du, -dh/dv, 1))
    hh = np.zeros((H, W)); u = (np.arange(W) + .5) / W; v = (np.arange(H) + .5) / H
    U, V = np.meshgrid(u, v)
    for (uc, vc) in ((0.5, 0.5), (0.98, 0.5)):
        du = ((U - uc + 0.5) % 1 - 0.5) * TAU * 0.17; dv = (V - vc) * (y1 - y0)
        hh += 0.010 * np.exp(-(du ** 2 + dv ** 2) / (2 * (0.035 / 2) ** 2))
    dhdu = (np.roll(hh, -1, 1) - np.roll(hh, 1, 1)) * 0.5 * W / (TAU * 0.17); dhdv = np.gradient(hh, axis=0) * H / (y1 - y0)
    ref = np.stack([-dhdu, -dhdv], -1)
    px = int(0.5 * W)
    print('reference (make_fold_normals math, v up): n.x at -u', ref[py, px - s, 0], '+u', ref[py, px + s, 0],
          ' n.y below', ref[py - s, px, 1], 'above', ref[py + s, px, 1])


# ---------------------------------------------------------------- stage: sculpt (Route B: folds as real geometry)
# Route A (offline cloth compression as the sculpt source) was tried first and did not hold: Blender's cloth with a Rest
# Shape Key blew up at this compression (positions in the km after 20 frames), and a position-based solver written for it
# came out grid-aligned and noisy at 5 mm cells. Route B, from the brief: fold curves per the design below, displaced by a
# fold profile (rounded crest, pinched valley), the crests leaning so the folds go over and under each other.
def profile(theta, p=0.6):
    """one fold: 0 in the pinched valley, 1 at the broad rounded crest (period 2 pi)"""
    return ((1 + np.cos(theta)) / 2) ** p


def smooth_noise_phi(phi, rng, n=4, base=2):
    return sum(rng.normal() * np.cos((base + k) * phi + rng.uniform(0, TAU)) / (1 + 0.5 * k) for k in range(n)) / 2.0


def noise2d(phi, V, rng, n=14, kphi=(3, 18), kv=(1.0, 6.0)):
    """smooth noise over (round the body, up the body), periodic round the body; about unit variance"""
    out = np.zeros_like(phi)
    for _ in range(n):
        out += rng.normal() * np.cos(int(rng.integers(*kphi)) * phi + rng.uniform(1, kv[1]) * V * TAU * 0.5 + rng.uniform(0, TAU))
    return out / math.sqrt(n / 2)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


def fold_field(U, V, rng):
    """returns (h, lean): h the crest height off the shell in metres (negative = a hollow), lean the sideways shift of the
    crest along +u per metre of height (a fold that goes over). Everything fades above v = 0.88 (the shoulder cap and arms
    stay flat; aFold masks them as well)."""
    phi = (U - 0.5) * TAU
    front = (1 + np.cos(phi)) / 2; back = 1 - front
    mod = lambda k: 1 + 0.22 * np.sin(5 * phi + k) + 0.18 * np.sin(9 * phi + 2 * k) + 0.12 * np.sin(17 * phi + 3 * k)   # fold to fold variety
    warp = noise2d(phi, V, rng, 8, (2, 7), (1.0, 3.0))                       # folds meander
    env_g = np.clip(0.75 + 0.5 * noise2d(phi, V, rng, 10, (5, 24)), 0.25, 1.4)  # folds that die out and start again
    env_d = np.clip(0.7 + 0.6 * noise2d(phi, V, rng, 10, (4, 18)), 0.2, 1.5)
    mask = 1 - np.clip((V - 0.86) / 0.14, 0, 1) ** 1.4
    h = np.zeros_like(U); lean = np.zeros_like(U)
    # a. gathers at the sash: 24 tight folds, strongest at the sash, gone a third of the way up
    wg = np.clip(1 - V / 0.36, 0, 1) ** 1.25
    th = 24 * (phi + 0.04 * warp) + 1.4 * V
    hg = 0.0115 * wg * env_g * mod(1.0) * profile(th + 0.9 * warp, 0.55) * (0.55 + 0.45 * front + 0.1)
    h += hg; lean += 0.8 * wg * np.sin(3 * phi) * 0.5 + 0.25 * wg      # a little lean, mostly one way: the cloth was gathered by a hand
    # b. drag folds: ~10 per half (front) leaning to the side seams as they rise; back: fewer and longer, none on the spine
    wd = smoothstep(0.0, 0.34, V)
    sgn = np.sign(np.sin(phi)) + (np.sin(phi) == 0)
    phi_f = phi - 0.20 * V * sgn
    spine = 1 - np.exp(-((np.minimum(U, 1 - U) / 0.045) ** 2))
    hdf = 0.0062 * wd * env_d * front ** 0.6 * mod(2.0) * profile(21 * phi_f + 3.0 * warp, 0.7)
    hdb = 0.0050 * wd * env_d * back ** 0.7 * mod(3.5) * profile(13 * phi_f + 2.6 * warp + 1.0, 0.7) * spine
    h += hdf + hdb; lean += (0.9 * sgn * wd) * (front ** 0.6 + 0.5 * back)
    # c. a slow hollow at each side seam, under the arm
    side = np.exp(-((np.abs(np.abs(phi) - np.pi / 2) / 0.26) ** 2))
    h -= 0.0035 * side * np.clip(V / 0.45, 0, 1) * (1 - np.clip((V - 0.7) / 0.2, 0, 1))
    # d. short oblique creases fanning from each armpit toward the chest
    for sg in (-1, 1):
        d = phi - sg * (np.pi / 2 + 0.04)
        arm = np.exp(-((d / 0.5) ** 2 + ((V - 0.78) / 0.15) ** 2))
        h += 0.0048 * arm * profile(13 * (V - 0.78) - sg * 9 * d + 0.4 * warp, 0.6)
        lean += 0.8 * sg * arm
    return h * mask, lean * mask


def apply_folds(P, N, U, V, rng, amp=1.0):
    h, lean = fold_field(U, V, rng); h = h * amp
    nv, nu, _ = P.shape
    T = np.roll(P, -1, 1) - np.roll(P, 1, 1); T /= np.linalg.norm(T, axis=-1, keepdims=True) + 1e-12       # tangent along +u
    return P + N * h[..., None] + T * (lean * h)[..., None], h


def grid_to_mesh_trim(P, name, max_edge=0.03):
    """like grid_to_mesh, but a quad whose edge is longer than max_edge (a ray that jumped across the neck or an armhole)
    is left out, so no stretched sheet crosses the shell"""
    nv, nu, _ = P.shape
    verts = P.reshape(-1, 3).tolist(); faces = []
    dj = np.linalg.norm(P[1:] - P[:-1], axis=-1); di = np.linalg.norm(np.roll(P, -1, 1) - P, axis=-1)
    for j in range(nv - 1):
        for i in range(nu):
            i2 = (i + 1) % nu
            if max(di[j, i], di[j + 1, i], dj[j, i], dj[j, i2]) > max_edge: continue
            faces.append((j * nu + i, j * nu + i2, (j + 1) * nu + i2, (j + 1) * nu + i))
    m = bpy.data.meshes.new(name); m.from_pydata(verts, [], faces); m.update()
    ob = bpy.data.objects.new(name, m); bpy.context.scene.collection.objects.link(ob)
    for p in m.polygons: p.use_smooth = True
    return ob


def stage_sculpt():
    clear_scene()
    y0, y1 = float(opt['y0']), float(opt['y1'])
    nu, nv = int(opt.get('nu', 1024)), int(opt.get('nv', 420)); sub = int(opt.get('sub', 1))
    rng = np.random.default_rng(int(opt.get('seed', 1119)))
    low = build_low(opt['dump'], y0, y1)
    vext = (-0.03, 1.03)
    P, N = ray_surface(low, y0, y1, nu, nv, vext)
    V = (vext[0] + (vext[1] - vext[0]) * np.arange(nv) / (nv - 1))[:, None] * np.ones((1, nu)); U = ((np.arange(nu) + 0.5) / nu)[None, :] * np.ones((nv, 1))
    Pf, h = apply_folds(P, N, U, V, rng, float(opt.get('amp', 1.0)))
    out = grid_to_mesh_trim(Pf, 'high'); check_outward(out, 'high')
    bs = grid_to_mesh_trim(P, 'base'); check_outward(bs, 'base'); bs.hide_render = True
    if sub:
        for o_ in (out, bs):
            ss = o_.modifiers.new('Subsurf', 'SUBSURF'); ss.levels = sub; ss.render_levels = sub
    bpy.ops.wm.save_as_mainfile(filepath=WORK + '/sculpt.blend')
    np.save(WORK + '/rel.npy', h * 1000)
    rel = h * 1000
    for lab, (a_, b_) in (('sash', (0.0, 0.08)), ('mid', (0.15, 0.4)), ('chest', (0.5, 0.8))):
        m_ = (V[:, 0] >= a_) & (V[:, 0] <= b_); q = rel[m_]
        print(f'crest relief mm {lab}: p5 {np.percentile(q,5):.1f}  p50 {np.percentile(q,50):.1f}  p95 {np.percentile(q,95):.1f}  max {q.max():.1f}')
    print('faces', len(out.data.polygons), 'x subsurf', sub)


# ---------------------------------------------------------------- stage: bake
def open_sculpt():
    bpy.ops.wm.open_mainfile(filepath=WORK + '/sculpt.blend')
    return bpy.data.objects['low'], bpy.data.objects['high']


def stage_bake():
    low, high = open_sculpt()
    sc = bpy.context.scene
    low.modifiers.clear()
    # 1. the folded sculpt -> normal; 2. a control (the same grid with no folds) -> normal, so the shell's own smooth-vs-faceted
    #    difference is subtracted and only the folds remain; 3. ambient occlusion of the sculpt -> cavity
    img = new_image('n_folds'); bake_pass(low, high, 'NORMAL', img, extrusion=float(opt.get('ext', 0.02)))
    n1 = img_array(img).copy()
    # the control is the sculpt with zero amplitude: rebuild it from the stored base grid
    base = bpy.data.objects.get('base')
    if base is not None:
        img0 = new_image('n_base'); bake_pass(low, base, 'NORMAL', img0, extrusion=float(opt.get('ext', 0.02)))
        n0 = img_array(img0).copy()
    else:
        n0 = None
    sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True
    sc.world.light_settings.distance = float(opt.get('aod', 0.035))
    img_ao = new_image('ao', color=(1, 1, 1, 1)); bake_pass(low, high, 'AO', img_ao, extrusion=float(opt.get('ext', 0.02)), samples=int(opt.get('aospp', 64)))
    a = img_array(img_ao).copy()
    np.save(WORK + '/n_folds.npy', n1); np.save(WORK + '/ao.npy', a)
    if n0 is not None: np.save(WORK + '/n_base.npy', n0)
    print('baked', n1.shape, 'normal mean', n1[..., :3].reshape(-1, 3).mean(0), 'ao mean', a[..., 0].mean())


def pack_png(work, out_paths):
    """plain python: normal (control subtracted) in RGB, cavity in A, row 0 of the PNG = v = 1"""
    from PIL import Image
    n = np.load(work + '/n_folds.npy')[..., :3] * 2 - 1
    if os.path.exists(work + '/n_base.npy') and opt.get('control', '1') == '1':
        n0 = np.load(work + '/n_base.npy')[..., :3] * 2 - 1
        sl = n[..., :2] / np.maximum(n[..., 2:3], 0.2) - n0[..., :2] / np.maximum(n0[..., 2:3], 0.2)
        n = np.concatenate([sl, np.ones_like(sl[..., :1])], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True) + 1e-9
    ao = np.load(work + '/ao.npy')[..., 0]
    lo, hi = np.percentile(ao, 3), np.percentile(ao, 85)
    hit = ao > 0.05                                                          # pixels no ray from the low reached the sculpt: no cavity, flat normal
    lo, hi = np.percentile(ao[hit], 3), np.percentile(ao[hit], 85)
    cav = np.where(hit, np.clip(1.0 + (ao - hi) / max(hi - lo, 1e-6) * 0.55, 0.45, 1.0), 1.0)
    # the sculpt's cut edges (armholes, the neck's V) carry shading artifacts: a band of 16 px inside the hit area is made flat
    # (the shell's own normal, no cavity). The shader fades the folds there anyway (aFold).
    valid = hit.copy()
    for _ in range(int(opt.get('erode', 16))):
        valid = valid & np.roll(valid, 1, 1) & np.roll(valid, -1, 1) & np.vstack([valid[:1], valid[:-1]]) & np.vstack([valid[1:], valid[-1:]])
    feather = valid.astype(np.float32)
    for _ in range(12):
        feather = (feather + np.roll(feather, 1, 1) + np.roll(feather, -1, 1) + np.vstack([feather[:1], feather[:-1]]) + np.vstack([feather[1:], feather[-1:]])) / 5
    n = n * feather[..., None] + np.array([0, 0, 1.0]) * (1 - feather[..., None]); n /= np.linalg.norm(n, axis=-1, keepdims=True) + 1e-9
    cav = cav * feather + (1 - feather)
    rgba = np.dstack([n * 0.5 + 0.5, cav])
    # the map wraps at the centre back (u = 0 and 1): the two edges were baked from different faces, so the last 24 columns
    # on each side are cross-faded until the edges meet
    d = rgba[:, 0] - rgba[:, -1]; K = 24
    for k in range(K):
        w_ = (1 - k / K) ** 2 * 0.5
        rgba[:, k] -= d * w_; rgba[:, -1 - k] += d * w_
    n_ = rgba[..., :3] * 2 - 1; n_ /= np.linalg.norm(n_, axis=-1, keepdims=True) + 1e-9; rgba[..., :3] = n_ * 0.5 + 0.5; rgba = (np.clip(rgba, 0, 1)[::-1] * 255 + 0.5).astype(np.uint8)   # bottom-up -> top-down
    for p in out_paths:
        Image.fromarray(rgba, 'RGBA').save(p, optimize=True); print('wrote', p, rgba.shape)


# ---------------------------------------------------------------- stage: sheet (the sculpt itself, from four sides)
def stage_sheet():
    low, high = open_sculpt()
    sc = bpy.context.scene
    for o in bpy.data.objects: o.hide_render = o.name != 'high'
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = int(opt.get('spp', 48)); sc.cycles.use_denoising = False
    sc.render.resolution_x = 700; sc.render.resolution_y = 900
    mat = bpy.data.materials.new('m'); mat.use_nodes = True; b = mat.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.62, 0.5, 0.32, 1); b.inputs['Roughness'].default_value = 0.7
    high.data.materials.clear(); high.data.materials.append(mat)
    w = bpy.data.worlds.new('w'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.58, 0.6, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.6; sc.world = w
    sun = bpy.data.lights.new('s', 'SUN'); sun.energy = 3.0; so = bpy.data.objects.new('s', sun); sc.collection.objects.link(so)
    cam = bpy.data.cameras.new('c'); cam.type = 'ORTHO'; cam.ortho_scale = float(opt.get('scale', 0.75)); co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
    zc = float(opt.get('zc', 1.25))
    for n_, d in {'front': (0, -1), 'back': (0, 1), 'q': (-0.8, -0.8), 'side': (1, 0)}.items():
        v = Vector((d[0], d[1], 0)).normalized(); co.location = Vector((0, 0, zc)) + v * 3
        co.rotation_euler = (Vector((0, 0, zc)) - co.location).to_track_quat('-Z', 'Y').to_euler()
        so.location = co.location + Vector((0.6, -0.2, 0.9)); so.rotation_euler = (Vector((0, 0, zc)) - so.location).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = f'{WORK}/sheet_{n_}.png'; bpy.ops.render.render(write_still=True)


# ---------------------------------------------------------------- stage: qa (blender-asset-qa checks on the high mesh)
def stage_qa():
    low, high = open_sculpt()
    high.modifiers.clear()
    me = high.data; bm = bmesh.new(); bm.from_mesh(me); bm.normal_update(); bm.verts.ensure_lookup_table()
    n_in = 0; n_deg = 0; n_flip = 0
    # inverted: a face whose normal points against the shell's own outward direction (the low's nearest face), torso part only
    lb = bmesh.new(); lb.from_mesh(low.data); lt = BVHTree.FromBMesh(lb)
    for f in bm.faces:
        c = f.calc_center_median()
        if f.calc_area() < 1e-10: n_deg += 1
        loc, nrm, fi, d = lt.find_nearest(c, 0.03)
        if loc is None: continue
        n_in += 1
        if f.normal.dot(nrm) < 0: n_flip += 1
    print(f'QA faces {len(bm.faces)}, degenerate {n_deg}, compared to the shell {n_in}, normals against the shell {n_flip} ({100*n_flip/max(n_in,1):.2f}%)')
    # non-manifold edges that are not on the open border (the grid has an open top and bottom row only)
    nm = sum(1 for e in bm.edges if len(e.link_faces) > 2); print('QA edges shared by more than two faces', nm)
    # self-intersection: triangle pairs that overlap and do not share a vertex
    tm = bmesh.ops.triangulate(bm, faces=bm.faces[:])
    tree = BVHTree.FromBMesh(bm); pairs = tree.overlap(tree)
    bm.faces.ensure_lookup_table(); bad = 0
    for a, b in pairs:
        if a >= b: continue
        va = {v.index for v in bm.faces[a].verts}; vb = {v.index for v in bm.faces[b].verts}
        if va & vb: continue
        bad += 1
    print(f'QA triangle pairs that intersect without sharing a vertex: {bad}  (folds that go over each other are meant to touch; deep crossings would show here)')


if __name__ == '__main__':
    {'test': stage_test, 'sculpt': stage_sculpt, 'bake': stage_bake, 'sheet': stage_sheet, 'qa': stage_qa, 'pack': lambda: pack_png(WORK, opt['out'].split(','))}.get(stage, lambda: print('unknown stage', stage))()
