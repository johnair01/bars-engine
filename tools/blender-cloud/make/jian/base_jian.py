import bpy
import bmesh
import math

ASSUMPTIONS = {
    "blade_width": {"value": 0.048, "source": "image_estimate", "confidence": 0.5},
    "blade_thickness": {"value": 0.008, "source": "unknown", "confidence": 0.1},
    "grip_length": {"value": 0.155, "source": "image_estimate", "confidence": 0.6},
    "grip_diameter": {"value": 0.039, "source": "image_estimate_adjusted_for_shadow", "confidence": 0.5},
    "guard_width": {"value": 0.105, "source": "image_estimate", "confidence": 0.5},
    "guard_thickness": {"value": 0.012, "source": "unknown", "confidence": 0.1},
    "guard_depth": {"value": 0.022, "source": "unknown", "confidence": 0.1},
    "guard_vertical_mass": {"value": 0.045, "source": "image_estimate", "confidence": 0.6},
    "pommel_length": {"value": 0.045, "source": "image_estimate", "confidence": 0.5},
    "pommel_width": {"value": 0.050, "source": "image_estimate_adjusted_for_shadow", "confidence": 0.5},
    "pommel_depth": {"value": 0.022, "source": "unknown", "confidence": 0.1},
    "blade_tip_taper": {"value": 0.12, "source": "image_estimate", "confidence": 0.5},
}

BLADE_LEN = 0.838
WHOLE_LEN = 1.038
GRIP_LEN = ASSUMPTIONS["grip_length"]["value"]
GUARD_W = ASSUMPTIONS["guard_width"]["value"]
GUARD_T = ASSUMPTIONS["guard_thickness"]["value"]
GUARD_D = ASSUMPTIONS["guard_depth"]["value"]
GUARD_V = ASSUMPTIONS["guard_vertical_mass"]["value"]
BLADE_W = ASSUMPTIONS["blade_width"]["value"]
BLADE_T = ASSUMPTIONS["blade_thickness"]["value"]
GRIP_D = ASSUMPTIONS["grip_diameter"]["value"]
POM_L = ASSUMPTIONS["pommel_length"]["value"]
POM_W = ASSUMPTIONS["pommel_width"]["value"]
POM_D = ASSUMPTIONS["pommel_depth"]["value"]
TIP_TAPER = ASSUMPTIONS["blade_tip_taper"]["value"]

HILT_LEN = WHOLE_LEN - BLADE_LEN
POM_L = HILT_LEN - GRIP_LEN - GUARD_T
ASSUMPTIONS["pommel_length"] = {"value": round(POM_L, 6), "source": "derived_from_whole_len", "confidence": 0.9}

def _mesh_obj(name, verts, faces):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj

def _box(name, cx, cy, cz, sx, sy, sz):
    hx, hy, hz = sx/2, sy/2, sz/2
    v = [(cx-hx, cy-hy, cz-hz), (cx+hx, cy-hy, cz-hz),
         (cx+hx, cy+hy, cz-hz), (cx-hx, cy+hy, cz-hz),
         (cx-hx, cy-hy, cz+hz), (cx+hx, cy-hy, cz+hz),
         (cx+hx, cy+hy, cz+hz), (cx-hx, cy+hy, cz+hz)]
    f = [(0,3,2,1), (4,5,6,7), (0,1,5,4), (1,2,6,5), (2,3,7,6), (3,0,4,7)]
    return _mesh_obj(name, v, f)

def build_object():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)

    guard_z = 0.0
    blade_base_z = guard_z + GUARD_T/2
    blade_tip_z = blade_base_z + BLADE_LEN
    grip_top_z = guard_z - GUARD_T/2
    grip_bot_z = grip_top_z - GRIP_LEN
    pom_top_z = grip_bot_z
    pom_bot_z = pom_top_z - POM_L

    # Blade: closed cross-section rings with consistent side faces and caps
    hw = BLADE_W/2
    ht = BLADE_T/2
    tip_start = blade_tip_z - TIP_TAPER

    # Progressive taper from shoulder to tip
    def get_width(z):
        if z >= tip_start:
            t = (z - tip_start) / TIP_TAPER
            return hw * (1.0 - t * 0.8)
        else:
            t = (z - blade_base_z) / (tip_start - blade_base_z)
            return hw * (1.0 - t * 0.25)

    def get_thickness(z):
        if z >= tip_start:
            t = (z - tip_start) / TIP_TAPER
            return ht * (1.0 - t * 0.8)
        else:
            t = (z - blade_base_z) / (tip_start - blade_base_z)
            return ht * (1.0 - t * 0.25)

    # Create rings along the blade
    num_rings = 8
    verts = []
    faces = []

    for i in range(num_rings):
        z = blade_base_z + (blade_tip_z - blade_base_z) * i / (num_rings - 1)
        w = get_width(z)
        t = get_thickness(z)
        # 4 vertices per ring: left, front, right, back
        verts.extend([
            (-w, 0, z), (0, -t, z), (w, 0, z), (0, t, z)
        ])

    # Side faces between rings
    for i in range(num_rings - 1):
        base = i * 4
        next_base = (i + 1) * 4
        # Left side
        faces.append((base, base+1, next_base+1, next_base))
        # Front side
        faces.append((base+1, base+2, next_base+2, next_base+1))
        # Right side
        faces.append((base+2, base+3, next_base+3, next_base+2))
        # Back side
        faces.append((base+3, base, next_base, next_base+3))

    # Bottom cap (at blade_base_z)
    faces.append((0, 3, 2, 1))

    # Top cap (at blade_tip_z) - collapse to a point for the tip
    tip_idx = len(verts)
    verts.append((0, 0, blade_tip_z))
    last_ring = (num_rings - 1) * 4
    faces.append((last_ring, last_ring+1, tip_idx))
    faces.append((last_ring+1, last_ring+2, tip_idx))
    faces.append((last_ring+2, last_ring+3, tip_idx))
    faces.append((last_ring+3, last_ring, tip_idx))

    blade = _mesh_obj("Blade", verts, faces)

    # Ensure manifold geometry
    bm = bmesh.new()
    bm.from_mesh(blade.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(blade.data)
    bm.free()
    blade.data.update()

    # Guard: tapered swept silhouette
    gv = []
    gw = GUARD_W/2
    gd = GUARD_D/2
    gv_top = GUARD_V/2
    gv_bot = -GUARD_V/2
    gv.extend([
        (-gw, -gd, gv_bot), (gw, -gd, gv_bot), (gw, gd, gv_bot), (-gw, gd, gv_bot),
        (-gw*0.6, -gd*0.6, gv_top), (gw*0.6, -gd*0.6, gv_top), (gw*0.6, gd*0.6, gv_top), (-gw*0.6, gd*0.6, gv_top)
    ])
    gf = [(0,3,2,1), (4,5,6,7), (0,1,5,4), (1,2,6,5), (2,3,7,6), (3,0,4,7)]
    guard = _mesh_obj("Guard", gv, gf)

    # Grip: wider cylinder
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=GRIP_D/2, depth=GRIP_LEN,
                                        location=(0, 0, (grip_top_z+grip_bot_z)/2))
    grip = bpy.context.active_object
    grip.name = "Grip"

    # Pommel: wider sphere
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=POM_W/2,
                                         location=(0, 0, (pom_top_z+pom_bot_z)/2))
    pom = bpy.context.active_object
    pom.name = "Pommel"
    pom.scale = (1.0, POM_D/POM_W, POM_L/POM_W)

    bpy.context.view_layer.update()

if __name__ == "__main__":
    build_object()
