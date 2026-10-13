"""Procedural roots and mushrooms from a few numbers. Pure Python and math, no bpy: every shape is (verts, faces) lists, so
the shapes are testable offline and the same seed gives the same mesh byte for byte.

    from procgen import root_system, mushroom, ROOT_STYLES, MUSHROOM_FORMS
    verts, faces = root_system(seed=3, **ROOT_STYLES["hanging"])
    verts, faces = mushroom(seed=5, **MUSHROOM_FORMS["bell"])

Roots: a recursive turtle. Each step turns by a smooth random wander, bends toward a tropism vector (gravity, away from a
wall), and may fork. A fork splits the parent's cross-section by Murray's law (r_parent^3 = r_a^3 + r_b^3, the rule real
branching networks follow), so thickness falls off the way real roots do. Self-similar at every depth, with the angle,
wander, length and fork rate drawn per branch so no two branches match.

Mushrooms: a lathe (a profile turned about the vertical axis) with a stem profile and a cap profile, each a few numbers.
The cap is a superellipse arc with an optional rim lip, umbo (central bump), scalloped edge, tilt and pitting. The
named forms (MUSHROOM_FORMS) sit at corners of that parameter space; `mushroom_between` blends two of them, so there is a
continuum of shapes between the corners. See tools/blender-cloud/README.md, "Procedural shapes".

Run `python3 tools/blender-cloud/procgen.py --selftest` to check determinism and shape.
"""
import math, random

# ---------------------------------------------------------------------------------------------------------------- vectors
def add(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])
def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def mul(a, s): return (a[0] * s, a[1] * s, a[2] * s)
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def norm(a):
    n = math.sqrt(dot(a, a)) or 1.0
    return (a[0] / n, a[1] / n, a[2] / n)
def lerp(a, b, t): return a + (b - a) * t


def rotate(v, axis, ang):
    """Rodrigues: v turned by ang about the unit vector axis."""
    c, s = math.cos(ang), math.sin(ang)
    return add(add(mul(v, c), mul(cross(axis, v), s)), mul(axis, dot(axis, v) * (1 - c)))


def perp(d):
    """Any unit vector at right angles to d."""
    a = (1, 0, 0) if abs(d[0]) < 0.9 else (0, 1, 0)
    return norm(cross(d, a))


# ---------------------------------------------------------------------------------------------------------------- roots
ROOT_STYLES = {
    # trunk radius, step length, wander (radians per step), tropism vector and strength, fork chance per step,
    # fork angle range (radians), the share of the cross-section the side branch takes, depth limit, thinnest radius kept
    "arching": dict(r0=0.06, step=0.10, wander=0.22, tropism=(0, 0, -1), pull=0.10, fork=0.16, fork_angle=(0.35, 0.9),
                    side_share=0.35, length=2.6, rmin=0.006, up=(0, 0, 1)),
    "hanging": dict(r0=0.05, step=0.10, wander=0.25, tropism=(0, 0, -1), pull=0.03, fork=0.15, fork_angle=(0.35, 0.9),
                    side_share=0.35, length=2.4, rmin=0.006, up=(0, 0, -1)),
    "creeping": dict(r0=0.05, step=0.09, wander=0.35, tropism=(0, 0, -1), pull=0.04, fork=0.13, fork_angle=(0.5, 1.2),
                     side_share=0.45, length=3.2, rmin=0.006, up=(1, 0, 0)),
    "tangled": dict(r0=0.045, step=0.07, wander=0.6, tropism=(0, 0, -1), pull=0.02, fork=0.22, fork_angle=(0.6, 1.4),
                    side_share=0.5, length=2.0, rmin=0.005, up=(0, 0, 1)),
    "taproot": dict(r0=0.08, step=0.12, wander=0.12, tropism=(0, 0, -1), pull=0.18, fork=0.10, fork_angle=(0.25, 0.6),
                    side_share=0.2, length=2.4, rmin=0.008, up=(0, 0, -1)),
    "buttress": dict(r0=0.10, step=0.12, wander=0.28, tropism=(0, 0, -1), pull=0.03, fork=0.12, fork_angle=(0.4, 1.0),
                     side_share=0.4, length=2.2, rmin=0.012, up=(1, 0, 0)),
}
ROOT_SEGMENTS = 7  # sides of each tube


def _grow(rng, p, pos, d, r, budget, out, depth):
    """Grow one branch; out collects (points, radii) polylines. budget is the length left before the tip stops."""
    pts, rad = [pos], [r]
    wob = rng.uniform(0, 6.283)
    n = 0
    while budget > 0 and r > p["rmin"]:
        n += 1
        # smooth wander: a slowly turning random bend about a random perpendicular, plus the tropism pull
        wob += rng.uniform(-0.8, 0.8)
        side = rotate(perp(d), d, wob)
        d = norm(rotate(d, side, rng.gauss(0, p["wander"])))
        d = norm(add(d, mul(p["tropism"], p["pull"])))
        pos = add(pos, mul(d, p["step"] * (0.7 + 0.6 * r / p["r0"] if depth else 1.0)))
        budget -= p["step"]
        r *= 0.992  # slow taper along a branch
        pts.append(pos)
        rad.append(r)
        if n > 2 and rng.random() < p["fork"] * (0.4 + r / p["r0"]):
            # Murray split: the side branch takes side_share of r^3, the parent keeps the rest
            share = max(0.08, min(0.9, p["side_share"] * rng.uniform(0.7, 1.3)))
            r_side = r * share ** (1 / 3)
            r_main = r * (1 - share) ** (1 / 3)
            ang = rng.uniform(*p["fork_angle"])
            axis = rotate(perp(d), d, rng.uniform(0, 6.283))
            _grow(rng, p, pos, norm(rotate(d, axis, ang)), r_side, budget * rng.uniform(0.55, 0.9), out, depth + 1)
            r = r_main
            rad[-1] = r
    out.append((pts, rad))


def _sweep(pts, rad, segments, verts, faces):
    """A tube along a polyline: parallel-transport frames so the rings do not twist, capped to a point at the tip."""
    if len(pts) < 2:
        return
    tangent = lambda i: norm(sub(pts[min(i + 1, len(pts) - 1)], pts[max(i - 1, 0)]))
    t = tangent(0)
    u = perp(t)
    base = len(verts)
    for i, (c, r) in enumerate(zip(pts, rad)):
        tn = tangent(i)
        axis = cross(t, tn)
        if dot(axis, axis) > 1e-12:
            u = norm(rotate(u, norm(axis), math.acos(max(-1, min(1, dot(t, tn))))))
        t = tn
        w = cross(t, u)
        for k in range(segments):
            a = 6.283185307 * k / segments
            verts.append(add(c, add(mul(u, math.cos(a) * r), mul(w, math.sin(a) * r))))
    for i in range(len(pts) - 1):
        for k in range(segments):
            a, b = base + i * segments + k, base + i * segments + (k + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    tip = len(verts)
    verts.append(add(pts[-1], mul(tangent(len(pts) - 1), rad[-1] * 1.2)))
    last = base + (len(pts) - 1) * segments
    for k in range(segments):
        faces.append((last + k, last + (k + 1) % segments, tip))


FIBER_SEGMENTS = 4


def _fibers(rng, p, branches, verts, faces):
    """The last layer: from every thin branch, fine hair-roots that dwindle almost to nothing. Radius falls linearly from
    about a third of the branch's own to 0.0006 at the tip, with a stronger wander than the branches, so they curl."""
    n_fib = p.get("fibers", 0.3)  # chance per point of a thin branch, and a brush of 3 to 7 at each tip
    rmax = p.get("fiber_rmax", p["r0"] * 0.5)
    for pts, rad in branches:
        for i in range(2, len(pts)):
            tip = i == len(pts) - 1
            if not tip and (rad[i] > rmax or rng.random() > n_fib * 0.5):
                continue
            count = rng.randint(3, 7) if tip else 1
            d0 = norm(sub(pts[i], pts[i - 1]))
            for _ in range(count):
                d = norm(rotate(d0, rotate(perp(d0), d0, rng.uniform(0, 6.283)), rng.uniform(0.4, 1.3)))
                r0 = max(rad[i] * 0.4, 0.0016)
                steps = rng.randint(3, 7)
                pos, fp, fr = pts[i], [pts[i]], [r0]
                for k in range(1, steps + 1):
                    d = norm(add(rotate(d, rotate(perp(d), d, rng.uniform(0, 6.283)), rng.gauss(0, 0.5)), mul(p["tropism"], 0.12)))
                    pos = add(pos, mul(d, rng.uniform(0.035, 0.07)))
                    fp.append(pos)
                    fr.append(lerp(r0, 0.0006, k / steps))
                _sweep(fp, fr, FIBER_SEGMENTS, verts, faces)


def root_system(seed=1, roots=3, spread=0.5, **style):
    """roots trunks leaving the origin, fanned by `spread` radians off the style's `up` axis. Returns (verts, faces)."""
    p = dict(ROOT_STYLES["arching"], **style)
    rng = random.Random(seed)
    verts, faces = [], []
    for i in range(roots):
        d = norm(rotate(rotate(p["up"], perp(p["up"]), spread * rng.uniform(0.4, 1.0)), p["up"], 6.283 * (i + rng.random() * 0.4) / roots))
        out = []
        _grow(rng, p, (0.0, 0.0, 0.0), d, p["r0"] * rng.uniform(0.85, 1.15), p["length"] * rng.uniform(0.8, 1.2), out, 0)
        for pts, rad in out:
            _sweep(pts, rad, ROOT_SEGMENTS, verts, faces)
        if p.get("fibers", 0.3) > 0:
            _fibers(rng, p, out, verts, faces)
    return verts, faces


# ------------------------------------------------------------------------------------------------------------ mushrooms
# Cap: a superellipse arc of height h, radius R. Parameters (all numbers):
#   R cap radius, h cap height (negative turns the cap into a funnel), sharp exponent of the arc (1 round, <1 flat top,
#   >1 pointed), lip rim roll at the edge, umbo central bump, scallop (count, depth) of the edge, tilt, pit pits, thick
#   the cap's thickness (the gill side sits this far under the top), stem: height H, base radius rb, top radius rt, bulge,
#   ring a skirt on the stem.
MUSHROOM_FORMS = {
    "dome": dict(R=0.30, h=0.18, sharp=1.0, lip=0.02, umbo=0.0, scallop=(0, 0), tilt=0.0, pit=0.0, thick=0.04, H=0.35, rb=0.055, rt=0.04, bulge=0.0, ring=0.0),
    "flat": dict(R=0.40, h=0.07, sharp=0.5, lip=0.01, umbo=0.02, scallop=(0, 0), tilt=0.0, pit=0.0, thick=0.03, H=0.30, rb=0.05, rt=0.04, bulge=0.0, ring=0.0),
    "bell": dict(R=0.20, h=0.26, sharp=1.3, lip=-0.01, umbo=0.0, scallop=(0, 0), tilt=0.0, pit=0.0, thick=0.03, H=0.45, rb=0.03, rt=0.022, bulge=0.0, ring=0.0),
    "cone": dict(R=0.16, h=0.34, sharp=2.4, lip=0.0, umbo=0.0, scallop=(0, 0), tilt=0.0, pit=0.0, thick=0.03, H=0.50, rb=0.028, rt=0.02, bulge=0.0, ring=0.0),
    "funnel": dict(R=0.30, h=-0.14, sharp=0.9, lip=0.03, umbo=0.0, scallop=(7, 0.07), tilt=0.0, pit=0.0, thick=0.035, H=0.34, rb=0.04, rt=0.07, bulge=0.0, ring=0.0),
    "morel": dict(R=0.15, h=0.32, sharp=1.6, lip=0.0, umbo=0.0, scallop=(0, 0), tilt=0.0, pit=0.035, thick=0.0, H=0.26, rb=0.07, rt=0.07, bulge=0.2, ring=0.0),
    "puffball": dict(R=0.22, h=0.30, sharp=0.8, lip=0.0, umbo=0.0, scallop=(0, 0), tilt=0.0, pit=0.01, thick=0.0, H=0.10, rb=0.07, rt=0.09, bulge=0.0, ring=0.0),
    "parasol": dict(R=0.34, h=0.20, sharp=1.1, lip=0.015, umbo=0.06, scallop=(9, 0.04), tilt=0.08, pit=0.0, thick=0.03, H=0.62, rb=0.04, rt=0.024, bulge=0.0, ring=0.05),
    "bulbous": dict(R=0.26, h=0.15, sharp=0.9, lip=0.02, umbo=0.0, scallop=(0, 0), tilt=0.05, pit=0.0, thick=0.04, H=0.30, rb=0.10, rt=0.04, bulge=0.1, ring=0.0),
}
RINGS, SIDES = 14, 24


def mushroom_between(a, b, t):
    """The form a fraction t of the way from form a to form b (scallop count switches halfway)."""
    A, B = MUSHROOM_FORMS[a], MUSHROOM_FORMS[b]
    out = {}
    for k in A:
        if k == "scallop":
            n = A[k][0] if t < 0.5 else B[k][0]
            out[k] = (n, lerp(A[k][1], B[k][1], t))
        else:
            out[k] = lerp(A[k], B[k], t)
    return out


def mushroom(seed=1, jitter=0.12, lean=0.30, bend=0.5, cap_tilt=0.65, **f):
    """Lathe mesh of one mushroom, base at z=0. jitter varies each number by up to that fraction, per seed.
    lean (radians), bend (stem curvature) and cap_tilt (radians) are maximums: each seed draws its own amount between
    zero and the maximum, in its own direction, so a patch of them does not stand like a row of pins. Pass 0 for upright."""
    p = dict(MUSHROOM_FORMS["dome"], **f)
    rng = random.Random(seed)
    for k, v in list(p.items()):
        if isinstance(v, float) and k not in ("lip", "umbo", "tilt"):
            p[k] = v * (1 + rng.uniform(-jitter, jitter))
    phase = rng.uniform(0, 6.283)
    nsc, dsc = p["scallop"]
    verts, faces = [], []
    rows = []  # rings from the base up: (radius, height, theta); theta > 0 only on the cap, where scallops and pits apply

    # stem profile from the base up
    for i in range(RINGS):
        t = i / (RINGS - 1)
        r = lerp(p["rb"], p["rt"], t) * (1 + p["bulge"] * math.sin(3.1416 * t))
        rows.append((r, p["H"] * t, 0.0))
    if p["ring"] > 0:  # a skirt a third of the way up
        k = RINGS // 3
        rows.insert(k + 1, (p["rb"] + p["ring"], p["H"] * (k / (RINGS - 1)) - 0.01, 0.0))
        rows.insert(k + 2, (p["rb"] + p["ring"] * 0.2, p["H"] * (k / (RINGS - 1)) + 0.02, 0.0))
    # the cap sits on the stem top at z0. Underside: out from the stem to the rim, sloping down by `thick`; then the
    # rim; then the top, from the rim in over the dome to the centre. theta runs pi/2 (rim) to 0 (centre).
    z0 = p["H"]
    rim_z = z0 + p["h"] * 0 + p["lip"] * 0
    for i in range(1, 6):
        u = i / 5
        rows.append((lerp(p["rt"], p["R"] * 0.97, u), z0 - p["thick"] * (u ** 1.5) * 0.9, 0.0))
    for i in range(RINGS):
        th = 1.5708 * (1 - i / (RINGS - 1))
        r = p["R"] * math.sin(th)
        z = z0 + p["h"] * max(0.0, math.cos(th)) ** p["sharp"] + p["umbo"] * math.exp(-(th * 4) ** 2)
        if th > 1.2:
            z += p["lip"] * math.sin((th - 1.2) / 0.3708 * 3.1416)
        rows.append((r, z, th))
    ring_list = rows

    for (r, z, th) in ring_list:
        for k in range(SIDES):
            a = 6.283185307 * k / SIDES
            rr = r
            if nsc and th > 1.0:
                rr *= 1 + dsc * math.cos(nsc * a + phase) * min(1, (th - 1.0) / 0.5)
            if p["pit"] and rr > 0.02 and 0.2 < th < 1.5:
                rr *= 1 - p["pit"] * (0.5 + 0.5 * math.sin(7 * a + phase) * math.sin(11 * th + 2 * phase))
            zz = z + p["tilt"] * rr * math.cos(a - phase)
            verts.append((rr * math.cos(a), rr * math.sin(a), zz))
    n = len(ring_list)
    for i in range(n - 1):
        for k in range(SIDES):
            a, b = i * SIDES + k, i * SIDES + (k + 1) % SIDES
            faces.append((a, b, b + SIDES, a + SIDES))
    if lean or bend or cap_tilt:
        L, B, T = rng.uniform(0.2, 1.0) * lean, rng.uniform(0.0, 1.0) * bend, rng.uniform(0.3, 1.0) * cap_tilt
        az, at = rng.uniform(0, 6.283), rng.uniform(0, 6.283)  # lean direction, and the cap's own tilt direction
        H = p["H"]
        ca, sa = math.cos(L), math.sin(L)
        axis = (math.cos(at), math.sin(at), 0.0)
        out = []
        for x, y, z in verts:
            if z > H:  # the cap pitches about the stem top, in its own direction: one rim rises, the other drops
                x, y, zz = rotate((x, y, z - H), axis, T)
                z = H + zz
            x += B * z * z  # the stem curves
            x, z = x * ca + z * sa, z * ca - x * sa  # the whole mushroom leans about its base
            out.append((x * math.cos(az) - y * math.sin(az), x * math.sin(az) + y * math.cos(az), z))
        verts = out
    return verts, faces


# ---------------------------------------------------------------------------------------------------------------- checks
def stats(verts, faces):
    xs, ys, zs = zip(*verts)
    return dict(verts=len(verts), faces=len(faces), size=(round(max(xs) - min(xs), 3), round(max(ys) - min(ys), 3), round(max(zs) - min(zs), 3)))


def _selftest():
    for name, st in ROOT_STYLES.items():
        a, b = root_system(seed=4, **st), root_system(seed=4, **st)
        assert a == b, f"{name}: same seed, different mesh"
        assert a != root_system(seed=5, **st), f"{name}: different seeds, same mesh"
        s = stats(*a)
        assert s["faces"] > 100, f"{name}: too few faces {s}"
        print("root", name, s)
    for name, f in MUSHROOM_FORMS.items():
        a = mushroom(seed=2, **f)
        assert a == mushroom(seed=2, **f)
        print("mushroom", name, stats(*a))
    print("selftest ok")


if __name__ == "__main__":
    import sys
    if "--selftest" in sys.argv:
        _selftest()
