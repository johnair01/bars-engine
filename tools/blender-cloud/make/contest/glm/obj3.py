import bpy
import math


def _srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _material(name, hex_color, metallic, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    r, g, b = (int(hex_color[i:i + 2], 16) / 255.0 for i in (1, 3, 5))
    bsdf.inputs["Base Color"].default_value = (
        _srgb_to_linear(r), _srgb_to_linear(g), _srgb_to_linear(b), 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def _rot(p, rx, ry, rz):
    x, y, z = p
    if rx:
        c, s = math.cos(rx), math.sin(rx)
        y, z = y * c - z * s, y * s + z * c
    if ry:
        c, s = math.cos(ry), math.sin(ry)
        x, z = x * c + z * s, -x * s + z * c
    if rz:
        c, s = math.cos(rz), math.sin(rz)
        x, y = x * c - y * s, x * s + y * c
    return (x, y, z)


CORNERS = [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1),
           (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]
FACES = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
         (2, 3, 7, 6), (1, 2, 6, 5), (3, 0, 4, 7)]

# Kintsugi crack paths in normalized tablet-face coords (u across width, v up height)
PATTERNS = [
    [[(-0.40, 0.28), (-0.12, 0.06), (0.10, 0.20), (0.38, -0.02)],
     [(-0.12, 0.06), (-0.30, -0.24), (-0.06, -0.40)]],
    [[(-0.36, -0.34), (-0.02, -0.12), (0.04, 0.16), (0.34, 0.40)],
     [(-0.02, -0.12), (-0.32, 0.02)]],
    [[(0.42, 0.22), (0.12, 0.08), (-0.06, -0.16), (-0.40, -0.32)],
     [(-0.06, -0.16), (0.22, -0.34)],
     [(0.12, 0.08), (0.40, -0.10)]],
]


def build_object():
    bronze = _material("TabletWood_Bronze", "#8c6239", 0.15, 0.55)
    verdigris = _material("Emblem_Verdigris", "#43aa8b", 0.6, 0.4)
    jade = _material("Emblem_Jade", "#2a9d8f", 0.4, 0.35)
    slate = _material("Wall_Slate", "#264653", 0.1, 0.85)
    gold = _material("Kintsugi_Gold", "#e9c46a", 1.0, 0.25)
    materials = [bronze, verdigris, jade, slate, gold]
    BRONZE, VERDIGRIS, JADE, SLATE, GOLD = 0, 1, 2, 3, 4
    tier_colors = [JADE, VERDIGRIS, GOLD]

    verts, faces, mat_ids = [], [], []

    def add_box(center, size, rot, m):
        cx, cy, cz = center
        sx, sy, sz = (s * 0.5 for s in size)
        base = len(verts)
        for cxi, cyi, czi in CORNERS:
            p = _rot((cxi * sx, cyi * sy, czi * sz), rot[0], rot[1], rot[2])
            verts.append((p[0] + cx, p[1] + cy, p[2] + cz))
        for f in FACES:
            faces.append(tuple(base + i for i in f))
            mat_ids.append(m)

    # Wall layout: 4 x 5 grid of founder tablets on a slate backing wall
    COLS, ROWS = 4, 5
    T_W, T_H, T_T = 0.26, 0.36, 0.028
    GX, GZ = 0.34, 0.46
    wall_w = COLS * GX + 0.08
    wall_h = ROWS * GZ + 0.08
    wall_d = 0.14
    plinth_h = 0.07

    add_box((0, 0, plinth_h / 2), (wall_w + 0.08, wall_d + 0.10, plinth_h), (0, 0, 0), SLATE)
    add_box((0, 0, plinth_h + wall_h / 2), (wall_w, wall_d, wall_h), (0, 0, 0), SLATE)
    wall_front = wall_d / 2.0

    def tablet(cx, cy, cz, tier, pat_start, tilt):
        rx = tilt
        emblem_m = tier_colors[tier]

        def place(lx, ly, lz):
            p = _rot((lx, ly, lz), rx, 0, 0)
            return (cx + p[0], cy + p[1], cz + p[2])

        add_box(place(0, 0, 0), (T_W, T_T, T_H), (rx, 0, 0), BRONZE)

        # Raised frame border around the plaque face
        fw = 0.02
        add_box(place(0, T_T / 2 + 0.002, T_H / 2 - fw / 2),
                (T_W, T_T + 0.004, fw), (rx, 0, 0), BRONZE)
        add_box(place(0, T_T / 2 + 0.002, -T_H / 2 + fw / 2),
                (T_W, T_T + 0.004, fw), (rx, 0, 0), BRONZE)
        add_box(place(T_W / 2 - fw / 2, T_T / 2 + 0.002, 0),
                (fw, T_T + 0.004, T_H - 2 * fw), (rx, 0, 0), BRONZE)
        add_box(place(-T_W / 2 + fw / 2, T_T / 2 + 0.002, 0),
                (fw, T_T + 0.004, T_H - 2 * fw), (rx, 0, 0), BRONZE)

        # Rank emblem: diamond plate rotated 45 deg in the face plane
        d = 0.05
        fz = T_T / 2 + 0.001
        add_box(place(0, fz, T_H * 0.24), (d, 0.004, d), (rx, math.pi / 4, 0), emblem_m)

        # Rank bars under the emblem, one per tier step
        bar_w, bar_h = T_W * 0.28, 0.012
        for k in range(tier + 1):
            bz = T_H * 0.24 - d * 0.75 - 0.018 - k * (bar_h + 0.008)
            add_box(place(0, fz, bz), (bar_w, 0.004, bar_h), (rx, 0, 0), emblem_m)

        # Name strip near the bottom of the plaque
        add_box(place(0, fz, -T_H * 0.32), (T_W * 0.5, 0.004, 0.018), (rx, 0, 0), SLATE)

        # Two mount spacers holding the plaque off the wall
        add_box(place(0, -T_T / 2 - 0.006, T_H / 2 - 0.03),
                (0.02, 0.012, 0.02), (rx, 0, 0), BRONZE)
        add_box(place(0, -T_T / 2 - 0.006, -T_H / 2 + 0.03),
                (0.02, 0.012, 0.02), (rx, 0, 0), BRONZE)

        # Gold seams: each crack segment becomes a thin strip lying proud of the face
        n_patterns = 1 + tier
        for pi in range(n_patterns):
            path = PATTERNS[(pat_start + pi) % len(PATTERNS)]
            for polyline in path:
                for a, b in zip(polyline, polyline[1:]):
                    ax, az = a[0] * T_W, a[1] * T_H
                    bx, bz = b[0] * T_W, b[1] * T_H
                    dx, dz = bx - ax, bz - az
                    length = math.hypot(dx, dz)
                    if length < 0.01:
                        continue
                    mx, mz = (ax + bx) / 2, (az + bz) / 2
                    # Strip local +X aligned to (dx, dz) in the face plane via Y-axis rotation
                    alpha = math.atan2(-dz, dx)
                    add_box(place(mx, fz, mz), (length, 0.004, 0.006),
                            (rx, alpha, 0), GOLD)
                for (u, v) in polyline[1:-1]:
                    # Small gold node where crack branches meet
                    add_box(place(u * T_W, fz, v * T_H),
                            (0.010, 0.004, 0.010), (rx, 0, 0), GOLD)

    for row in range(ROWS):
        for col in range(COLS):
            idx = row * COLS + col
            tier = 2 if row >= 3 else (1 if row >= 1 else 0)
            cx = -wall_w / 2 + 0.04 + GX / 2 + col * GX
            cz = plinth_h + 0.04 + GZ / 2 + row * GZ
            cy = wall_front + T_T / 2 + 0.012
            tilt = 0.006 * ((row + col) % 3 - 1)
            tablet(cx, cy, cz, tier, idx % len(PATTERNS), tilt)

    mesh = bpy.data.meshes.new("FounderRankWall")
    mesh.from_pydata(verts, [], faces)
    mesh.validate()
    mesh.update()
    for poly, m in zip(mesh.polygons, mat_ids):
        poly.material_index = m
    for mat in materials:
        mesh.materials.append(mat)

    obj = bpy.data.objects.new("FounderRankWall", mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


if __name__ == "__main__":
    build_object()
