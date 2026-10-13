"""The cave's three stone textures as Blender shader nodes: wet_stone, dry_stone and crystal_vein. Each turns a point into
a colour, from the surface's own colour. chamber.py bakes them onto the chamber's pieces; bake_tiles.py bakes them as
seamless tiles for cave.js. With w (a fourth coordinate) every noise and Voronoi node reads 4D, so a point on a torus in
4D gives a pattern that repeats exactly at the tile's edges."""
import bpy  # noqa: F401  (the nodes below live in Blender)

VEIN = "#8f84ff"


def rgb(h):
    return tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))


# ---- textures: each turns a point into a colour, from the surface's own colour ----
def node(nt, kind, **inputs):
    n = nt.nodes.new(kind)
    for k, v in inputs.items():
        if k in n.inputs:
            n.inputs[k].default_value = v
        else:
            setattr(n, k, v)
    return n


def ramp(nt, fac, stops):
    r = nt.nodes.new("ShaderNodeValToRGB")
    el = r.color_ramp.elements
    while len(el) < len(stops):
        el.new(0.5)
    for e, (pos, col) in zip(el, stops):
        e.position, e.color = pos, (*col, 1)
    nt.links.new(fac, r.inputs["Fac"])
    return r.outputs["Color"]


def mix(nt, fac, a, b, blend="MIX"):
    m = node(nt, "ShaderNodeMix", data_type="RGBA", blend_type=blend)
    for sock, i in ((fac, 0), (a, 6), (b, 7)):
        if isinstance(sock, float):
            m.inputs[i].default_value = sock
        elif isinstance(sock, tuple):
            m.inputs[i].default_value = (*sock, 1)
        else:
            nt.links.new(sock, m.inputs[i])
    return m.outputs[2]


def shade(c, k):
    return tuple(min(1, v * k) for v in c)


def texture(nt, kind, colour, vec, w=None):
    c = rgb(colour)

    def at(n, v, ww=w):  # feed a noise or Voronoi node its point; with w, in 4D
        nt.links.new(v, n.inputs["Vector"])
        if ww is not None:
            if n.bl_idname == "ShaderNodeTexNoise":
                n.noise_dimensions = "4D"
            else:
                n.voronoi_dimensions = "4D"
            if isinstance(ww, float):
                n.inputs["W"].default_value = ww
            else:
                nt.links.new(ww, n.inputs["W"])
        return n

    def times(v, k):  # a point (or w) times a constant
        if v is None:
            return None
        m = node(nt, "ShaderNodeVectorMath" if isinstance(k, tuple) else "ShaderNodeMath", operation="MULTIPLY")
        nt.links.new(v, m.inputs[0])
        m.inputs[1].default_value = k
        return m.outputs[0]

    if kind == "wet_stone":  # dark mottled rock, cracks, and darker wet streaks running down
        grain = at(node(nt, "ShaderNodeTexNoise", Scale=5.0, Detail=8.0, Roughness=0.62), vec)
        body = ramp(nt, grain.outputs["Fac"], [(0.3, shade(c, 0.4)), (0.55, shade(c, 0.7)), (0.75, shade(c, 0.95))])
        wet = at(node(nt, "ShaderNodeTexNoise", Scale=4.0, Detail=3.0), times(vec, (3.0, 3.0, 0.25)), times(w, 0.25))  # streaks run down z (and w)
        wet_mask = ramp(nt, wet.outputs["Fac"], [(0.42, (0, 0, 0)), (0.58, (0.85, 0.85, 0.85))])
        body = mix(nt, wet_mask, body, shade((c[0] * 0.75, c[1] * 0.9, c[2] * 1.1), 0.3))
        cell = at(node(nt, "ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE", Scale=0.9, Randomness=1.0), vec)
        crack = ramp(nt, cell.outputs["Distance"], [(0.0, (0.35, 0.35, 0.35)), (0.03, (1, 1, 1))])
        return mix(nt, 1.0, body, crack, "MULTIPLY")
    if kind == "dry_stone":  # pale dusty grain with pebbles and a few lighter flecks
        grain = at(node(nt, "ShaderNodeTexNoise", Scale=14.0, Detail=10.0, Roughness=0.7), vec)
        body = ramp(nt, grain.outputs["Fac"], [(0.35, shade(c, 0.75)), (0.6, shade(c, 1.05)), (0.8, shade(c, 1.3))])
        pebble = at(node(nt, "ShaderNodeTexVoronoi", Scale=6.0, Randomness=1.0), vec)
        tone = ramp(nt, pebble.outputs["Color"], [(0.0, shade(c, 0.85)), (1.0, shade(c, 1.15))])
        body = mix(nt, 0.5, body, tone, "MULTIPLY")
        edge = ramp(nt, pebble.outputs["Distance"], [(0.0, (1, 1, 1)), (0.35, (0.9, 0.9, 0.9)), (0.5, (0.65, 0.65, 0.65))])
        body = mix(nt, 1.0, body, edge, "MULTIPLY")
        fleck = at(node(nt, "ShaderNodeTexNoise", Scale=60.0, Detail=2.0), vec)
        fleck_mask = ramp(nt, fleck.outputs["Fac"], [(0.68, (0, 0, 0)), (0.72, (1, 1, 1))])
        return mix(nt, fleck_mask, body, shade(c, 1.6))
    if kind == "crystal_vein":  # dark rock split by thin glowing veins the colour of the crystals
        grain = at(node(nt, "ShaderNodeTexNoise", Scale=6.0, Detail=6.0, Roughness=0.6), vec)
        body = ramp(nt, grain.outputs["Fac"], [(0.35, shade(c, 0.22)), (0.7, shade(c, 0.45))])
        warp = at(node(nt, "ShaderNodeTexNoise", Scale=2.0, Detail=2.0, Distortion=1.5), vec)
        warped = node(nt, "ShaderNodeVectorMath", operation="ADD")
        nt.links.new(vec, warped.inputs[0])
        nt.links.new(warp.outputs["Color"], warped.inputs[1])
        cell = at(node(nt, "ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE", Scale=0.9), warped.outputs[0])
        vein = ramp(nt, cell.outputs["Distance"], [(0.0, (1, 1, 1)), (0.015, (0.7, 0.7, 0.7)), (0.04, (0, 0, 0))])
        return mix(nt, vein, body, rgb(VEIN))
    raise ValueError(f"unknown texture {kind}")
