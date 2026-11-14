
import bpy
import math
from mathutils import Vector

# ---------------------------------------------------------------------------
# Trigram floor — founder's hall, 30 x 20 m
# Eight trigram inlays around a central Taiji, worn thresholds.
# Deterministic, pure bpy.
# ---------------------------------------------------------------------------

SLUG = "trigram_floor"
OUT_PATH = "/home/workspace/bars-engine/tools/blender-cloud/make/contest/deepseek/obj2.png"

# Palette (restrained, cold mountain stone + bronze/gold + pine)
COL_STONE_DARK   = (0.18, 0.20, 0.19, 1.0)   # grey-green stone
COL_STONE_MID    = (0.28, 0.31, 0.29, 1.0)
COL_STONE_LIGHT  = (0.42, 0.45, 0.42, 1.0)
COL_BRONZE       = (0.55, 0.36, 0.16, 1.0)
COL_GOLD         = (0.85, 0.66, 0.24, 1.0)
COL_PINE         = (0.10, 0.18, 0.13, 1.0)
COL_TAIJI_LIGHT  = (0.78, 0.76, 0.70, 1.0)   # pale stone
COL_TAIJI_DARK   = (0.10, 0.11, 0.11, 1.0)   # near-black stone
COL_WORN         = (0.50, 0.48, 0.42, 1.0)   # worn threshold


def _clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.lights,
                  bpy.data.cameras, bpy.data.images):
        for b in list(block):
            try:
                block.remove(b)
            except Exception:
                pass


def _mat(name, color, rough=0.85, metal=0.0, emit=None, emit_strength=0.0):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emit is not None:
        bsdf.inputs["Emission Color"].default_value = emit
        bsdf.inputs["Emission Strength"].default_value = emit_strength
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m


def _add_box(name, size, loc, mat, rot_z=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (size[0] * 0.5, size[1] * 0.5, size[2] * 0.5)
    ob.rotation_euler = (0.0, 0.0, rot_z)
    ob.data.materials.append(mat)
    return ob


def _add_cylinder(name, radius, depth, loc, mat, verts=48, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius,
                                        depth=depth, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.rotation_euler = rot
    ob.data.materials.append(mat)
    return ob


def _add_torus(name, major, minor, loc, mat, rot=(0, 0, 0), maj_seg=64, min_seg=12):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor,
                                     location=loc, major_segments=maj_seg,
                                     minor_segments=min_seg)
    ob = bpy.context.active_object
    ob.name = name
    ob.rotation_euler = rot
    ob.data.materials.append(mat)
    return ob


def _add_plane(name, size_x, size_y, loc, mat):
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (size_x * 0.5, size_y * 0.5, 1.0)
    ob.data.materials.append(mat)
    return ob


def _add_taiji_segment(name, radius, start_angle, end_angle, loc, mat, segments=48):
    """Build a flat pie-slice (annular sector) mesh in XY plane at z=loc.z."""
    verts = [(0.0, 0.0, 0.0)]
    for i in range(segments + 1):
        t = start_angle + (end_angle - start_angle) * (i / segments)
        verts.append((radius * math.cos(t), radius * math.sin(t), 0.0))
    faces = []
    for i in range(segments):
        faces.append((0, i + 1, i + 2))
    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ob)
    ob.location = loc
    ob.data.materials.append(mat)
    return ob


def _add_taiji_half(name, radius, loc, mat, flip=False, segments=48):
    """Half-disc (semicircle) for the taiji halves."""
    verts = [(0.0, 0.0, 0.0)]
    a0 = 0.0 if not flip else math.pi
    a1 = math.pi if not flip else 2.0 * math.pi
    for i in range(segments + 1):
        t = a0 + (a1 - a0) * (i / segments)
        verts.append((radius * math.cos(t), radius * math.sin(t), 0.0))
    faces = []
    for i in range(segments):
        faces.append((0, i + 1, i + 2))
    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ob)
    ob.location = loc
    ob.data.materials.append(mat)
    return ob


def _add_taiji_small_circle(name, radius, loc, mat, segments=32):
    verts = [(0.0, 0.0, 0.0)]
    for i in range(segments):
        t = 2.0 * math.pi * i / segments
        verts.append((radius * math.cos(t), radius * math.sin(t), 0.0))
    faces = [(0, i + 1, ((i + 1) % segments) + 1) for i in range(segments)]
    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    ob = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ob)
    ob.location = loc
    ob.data.materials.append(mat)
    return ob


def _add_trigram_bars(name, center, angle, mat, bar_len=1.6, bar_w=0.22,
                      bar_gap=0.30, broken=False):
    """Three horizontal bars (solid or broken) forming a trigram, rotated by angle."""
    objs = []
    for row in range(3):
        y_off = (row - 1) * (bar_w + bar_gap)
        if broken and row == 1:
            # broken middle bar -> two segments
            for side in (-1, 1):
                x_off = side * (bar_len * 0.25 + bar_w * 0.5)
                seg = _add_box(
                    f"{name}_r{row}_s{side}",
                    (bar_len * 0.5 - bar_w * 0.5, bar_w, 0.04),
                    (0.0, 0.0, 0.0),
                    mat,
                )
                seg.location = (x_off, y_off, 0.0)
                seg.rotation_euler = (0.0, 0.0, angle)
                # rotate around center
                seg.location = (
                    center[0] + x_off * math.cos(angle) - y_off * math.sin(angle),
                    center[1] + x_off * math.sin(angle) + y_off * math.cos(angle),
                    center[2],
                )
                objs.append(seg)
        else:
            seg = _add_box(
                f"{name}_r{row}",
                (bar_len, bar_w, 0.04),
                (0.0, 0.0, 0.0),
                mat,
            )
            seg.location = (
                center[0] - y_off * math.sin(angle),
                center[1] + y_off * math.cos(angle),
                center[2],
            )
            seg.rotation_euler = (0.0, 0.0, angle)
            objs.append(seg)
    return objs


def build_object():
    _clear_scene()

    # Materials
    m_stone_dark  = _mat("StoneDark",  COL_STONE_DARK,  rough=0.92)
    m_stone_mid   = _mat("StoneMid",   COL_STONE_MID,   rough=0.90)
    m_stone_light = _mat("StoneLight", COL_STONE_LIGHT, rough=0.88)
    m_bronze      = _mat("Bronze",     COL_BRONZE,      rough=0.45, metal=0.9)
    m_gold        = _mat("Gold",       COL_GOLD,        rough=0.30, metal=1.0)
    m_pine        = _mat("Pine",       COL_PINE,        rough=0.85)
    m_taiji_light = _mat("TaijiLight", COL_TAIJI_LIGHT, rough=0.80)
    m_taiji_dark  = _mat("TaijiDark",  COL_TAIJI_DARK,  rough=0.80)
    m_worn        = _mat("Worn",       COL_WORN,        rough=0.95)

    # ---- Base slab: 30 x 20 m, top at z=0 ----
    slab = _add_box("FloorSlab", (30.0, 20.0, 0.20), (0.0, 0.0, -0.10), m_stone_dark)

    # Border frame (bronze inlay)
    _add_box("BorderN", (30.0, 0.30, 0.06), (0.0,  9.85, 0.03), m_bronze)
    _add_box("BorderS", (30.0, 0.30, 0.06), (0.0, -9.85, 0.03), m_bronze)
    _add_box("BorderE", (0.30, 20.0, 0.06), (14.85, 0.0, 0.03), m_bronze)
    _add_box("BorderW", (0.30, 20.0, 0.06), (-14.85, 0.0, 0.03), m_bronze)

    # Inner gold trim ring around the taiji
    _add_torus("InnerTrim", 4.6, 0.06, (0.0, 0.0, 0.04), m_gold,
               maj_seg=96, min_seg=8)

    # ---- Central Taiji (radius 4.0) ----
    taiji_r = 4.0
    # Outer ring (bronze)
    _add_torus("TaijiRing", taiji_r + 0.10, 0.10, (0.0, 0.0, 0.05), m_bronze,
               maj_seg=96, min_seg=10)

    # Two halves: light (top) and dark (bottom)
    _add_taiji_half("TaijiLight", taiji_r, (0.0, 0.0, 0.02), m_taiji_light,
                    flip=False, segments=64)
    _add_taiji_half("TaijiDark", taiji_r, (0.0, 0.0, 0.02), m_taiji_dark,
                    flip=True, segments=64)

    # S-curve: two small circles (radius = taiji_r/2) at (0, +r/2) and (0, -r/2)
    half_r = taiji_r * 0.5
    _add_taiji_small_circle("TaijiSmallTop", half_r, (0.0, half_r, 0.03),
                            m_taiji_dark, segments=48)
    _add_taiji_small_circle("TaijiSmallBot", half_r, (0.0, -half_r, 0.03),
                            m_taiji_light, segments=48)
    # Dots
    _add_taiji_small_circle("TaijiDotTop", half_r * 0.22, (0.0, half_r, 0.04),
                            m_taiji_light, segments=24)
    _add_taiji_small_circle("TaijiDotBot", half_r * 0.22, (0.0, -half_r, 0.04),
                            m_taiji_dark, segments=24)

    # ---- Eight trigrams around the taiji ----
    # Bagua order (clockwise from top): Qian, Dui, Li, Zhen, Xun, Kan, Gen, Kun
    # Each trigram: 3 bars, broken middle = yin, solid = yang
    # Represented as (broken_middle: bool)
    trigram_defs = [
        ("Qian", False),  # ☰ all yang
        ("Dui",  True),   # ☱ yin top
        ("Li",   True),   # ☲ yin middle
        ("Zhen", False),  # ☳ yang bottom
        ("Xun",  True),   # ☴ yin bottom
        ("Kan",  True),   # ☵ yin middle
        ("Gen",  False),  # ☶ yang top
        ("Kun",  True),   # ☷ all yin
    ]
    # Actually encode broken rows per trigram properly:
    # rows: bottom, middle, top (0=yang solid, 1=yin broken)
    trigram_rows = {
        "Qian": (0, 0, 0),
        "Dui":  (0, 0, 1),
        "Li":   (0, 1, 0),
        "Zhen": (1, 0, 0),
        "Xun":  (0, 1, 1),
        "Kan":  (1, 1, 0),
        "Gen":  (1, 0, 1),
        "Kun":  (1, 1, 1),
    }
    ring_r = 6.4
    for i, (name, _) in enumerate(trigram_defs):
        ang = math.pi * 0.5 - i * (math.pi * 0.25)  # start at top, clockwise
        cx = ring_r * math.cos(ang)
        cy = ring_r * math.sin(ang)
        rows = trigram_rows[name]
        # bars oriented tangentially: rotate so bars are perpendicular to radius
        bar_angle = ang + math.pi * 0.5
        bar_len = 1.7
        bar_w = 0.22
        bar_gap = 0.30
        for row in range(3):
            y_off = (row - 1) * (bar_w + bar_gap)
            broken = rows[row] == 1
            if broken:
                for side in (-1, 1):
                    x_off = side * (bar_len * 0.25 + bar_w * 0.5)
                    seg = _add_box(
                        f"Tri_{name}_r{row}_s{side}",
                        (bar_len * 0.5 - bar_w * 0.5, bar_w, 0.05),
                        (0.0, 0.0, 0.0),
                        m_gold,
                    )
                    seg.location = (
                        cx + x_off * math.cos(bar_angle) - y_off * math.sin(bar_angle),
                        cy + x_off * math.sin(bar_angle) + y_off * math.cos(bar_angle),
                        0.05,
                    )
                    seg.rotation_euler = (0.0, 0.0, bar_angle)
            else:
                seg = _add_box(
                    f"Tri_{name}_r{row}",
                    (bar_len, bar_w, 0.05),
                    (0.0, 0.0, 0.0),
                    m_gold,
                )
                seg.location = (
                    cx - y_off * math.sin(bar_angle),
                    cy + y_off * math.cos(bar_angle),
                    0.05,
                )
                seg.rotation_euler = (0.0, 0.0, bar_angle)

    # ---- Worn thresholds (four sides, where ranks were given) ----
    # North threshold (front of hall)
    _add_box("ThresholdN", (6.0, 1.2, 0.04), (0.0,  8.6, 0.02), m_worn)
    _add_box("ThresholdS", (6.0, 1.2, 0.04), (0.0, -8.6, 0.02), m_worn)
    _add_box("ThresholdE", (1.2, 5.0, 0.04), (13.4, 0.0, 0.02), m_worn)
    _add_box("ThresholdW", (1.2, 5.0, 0.04), (-13.4, 0.0, 0.02), m_worn)

    # Worn scuff marks (small dark patches) — deterministic placement
    scuff_positions = [
        (0.0, 8.6), (0.6, 8.4), (-0.5, 8.7), (1.2, 8.5), (-1.1, 8.3),
        (0.0, -8.6), (0.4, -8.5), (-0.7, -8.7),
        (13.4, 0.0), (13.3, 0.5), (13.5, -0.6),
        (-13.4, 0.0), (-13.3, -0.4), (-13.5, 0.7),
    ]
    for i, (sx, sy) in enumerate(scuff_positions):
        _add_box(f"Scuff_{i}", (0.35, 0.25, 0.02), (sx, sy, 0.03), m_stone_dark)

    # ---- Corner pillars (bronze, low) ----
    for cx, cy in [(-14.0, -9.0), (14.0, -9.0), (-14.0, 9.0), (14.0, 9.0)]:
        _add_cylinder(f"Pillar_{cx}_{cy}", 0.35, 0.6, (cx, cy, 0.30),
                      m_bronze, verts=24)
        _add_cylinder(f"PillarCap_{cx}_{cy}", 0.42, 0.10, (cx, cy, 0.65),
                      m_gold, verts=24)

    # ---- Pine accent strips along the long edges (subtle) ----
    _add_box("PineStripN", (28.0, 0.15, 0.03), (0.0,  9.55, 0.02), m_pine)
    _add_box("PineStripS", (28.0, 0.15, 0.03), (0.0, -9.55, 0.02), m_pine)

    # ---- Lights ----
    # Key area light above
    bpy.ops.object.light_add(type='AREA', location=(0.0, 0.0, 12.0))
    area = bpy.context.active_object
    area.name = "KeyArea"
    area.data.energy = 2500.0
    area.data.size = 14.0
    area.data.color = (1.0, 0.96, 0.88)
    area.rotation_euler = (0.0, 0.0, 0.0)

    # Point light for warm accent
    bpy.ops.object.light_add(type='POINT', location=(6.0, -6.0, 6.0))
    pt = bpy.context.active_object
    pt.name = "WarmPoint"
    pt.data.energy = 800.0
    pt.data.color = (1.0, 0.82, 0.55)
    pt.data.shadow_soft_size = 1.5

    # ---- Camera ----
    bpy.ops.object.camera_add(location=(0.0, -22.0, 16.0))
    cam = bpy.context.active_object
    cam.name = "Camera"
    cam.data.lens = 35.0
    # Look at center of floor
    target = Vector((0.0, 0.0, 0.0))
    direction = target - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = cam

    # ---- Render settings ----
    scene = bpy.context.scene
    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception:
        try:
            scene.render.engine = 'BLENDER_EEVEE'
        except Exception:
            scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = OUT_PATH

    # World background — cool mountain grey
    world = bpy.data.worlds.get("World")
    if world is None:
        world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg is not None:
        bg.inputs[0].default_value = (0.05, 0.06, 0.07, 1.0)
        bg.inputs[1].default_value = 0.6

    return scene


def _print_check():
    total_polys = 0
    mats = set()
    for ob in bpy.data.objects:
        if ob.type == 'MESH':
            total_polys += len(ob.data.polygons)
            for slot in ob.material_slots:
                if slot.material:
                    mats.add(slot.material.name)
    print(f"POLY_COUNT: {total_polys}")
    print("MATERIALS:")
    for m in sorted(mats):
        print(f"  - {m}")


if __name__ == "__main__":
    import sys
    build_object()
    if "--check" in sys.argv:
        _print_check()
    else:
        bpy.ops.render.render(write_still=True)
        print("READY")
