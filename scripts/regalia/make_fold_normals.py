#!/usr/bin/env python3
"""FALLBACK since round 4: the shipped map is now baked from a high-poly sculpt by scripts/regalia/bake_fold_sculpt.py.
This height-field generator stays for when Blender is not at hand.

Elder regalia round 3: the baked normal map of the upper-body folds (his 2026-11-19 ruling: the upper body's cloth is
sculpted and baked on, not simulated). One 2048x1024 tangent-space map in the shell's own cylindrical coordinates:
u = atan2(rest.x, rest.z) / 2pi + 0.5 (0.5 at the front, 0 and 1 at the centre back, the map wraps), v = 0 at the sash,
1 at the shoulder line. painted.js samples it per fragment where the shell's torso weight (aFold) is on, so the folds
stay on the chest and back and the arms stay flat.

The folds are authored as a height field (what a Displace modifier would do to a subdivided shell) and the normals are
taken from its slope; there is no Blender high-poly pass behind this one. Four layers: fine gathers above the sash, drag
folds from the shoulders and bust down to the sash, a side-seam hollow, and short creases under each arm.
Run: python3 scripts/regalia/make_fold_normals.py [out.png]   (needs numpy and Pillow)"""
import sys
import numpy as np
from PIL import Image

W, H = 2048, 1024
R_TORSO, H_TORSO = 0.17, 0.52   # metres per radian round the torso, metres from the sash to the shoulder line
rng = np.random.default_rng(1119)
u = (np.arange(W) + 0.5) / W
v = 1.0 - (np.arange(H) + 0.5) / H           # row 0 is the shoulder line
U, V = np.meshgrid(u, v)
phi = (U - 0.5) * 2 * np.pi

def smooth_noise(n_phi, n_v, amp):
    """periodic in phi, so the map wraps"""
    g = rng.normal(size=(n_v + 1, n_phi))
    k = np.zeros((H, W))
    for iy in range(n_v + 1):
        for ix in range(n_phi):
            k += g[iy, ix] * np.cos(ix * phi + rng.uniform(0, 6.283)) * np.exp(-((V - iy / n_v) ** 2) * n_v ** 2 * 1.2)
    k /= np.abs(k).max() + 1e-9
    return k * amp

def ridge(s):
    """soft rounded crests, tighter valleys"""
    t = 0.5 + 0.5 * s
    return t ** 1.6 - 0.35

warp = smooth_noise(5, 4, 0.55)
h = np.zeros((H, W))
# 1. gathers above the sash: 24 fine folds, strongest at the sash, gone by a third of the way up
wg = np.clip(1 - V / 0.34, 0, 1) ** 1.6
h += 0.0042 * wg * ridge(np.sin(24 * phi + 2.2 * warp + 1.3 * V))
# 2. drag folds from the shoulder and the bust to the sash: 11 broad folds that bend with the warp and lean toward the
#    side seams as they rise; they carry through the chest and fade at the shoulder cap
wd = np.clip(V / 0.12, 0, 1) * (1 - np.clip((V - 0.82) / 0.18, 0, 1) ** 1.4) * (0.55 + 0.45 * np.cos(phi * 2) ** 2)
h += 0.0075 * wd * ridge(np.sin(11 * phi + 3.0 * warp + 0.9 * np.sin(2 * phi) * (V - 0.4)))
# 3. a slow hollow at each side seam where the cloth hangs from the arm
side = np.exp(-((np.abs(np.abs(phi) - np.pi / 2) / 0.28) ** 2))
h -= 0.0032 * side * np.clip(V / 0.5, 0, 1)
# 4. creases under each arm: short oblique ridges that fan from the armpit toward the chest
for sg in (-1, 1):
    ax = sg * (np.pi / 2 + 0.04)
    d = (phi - ax)
    arm = np.exp(-((d / 0.55) ** 2 + ((V - 0.78) / 0.16) ** 2))
    h += 0.0058 * arm * ridge(np.sin(13 * (V - 0.78) - sg * 9 * d + 0.5 * warp))
# a little fine grain so the crests are not machined
h += 0.0004 * smooth_noise(40, 18, 1.0) * np.clip(V / 0.2, 0, 1)

h *= 2.8   # centimetres of relief on a robe that is 4 to 5 mm thick: the folds stand off the shell by their own weight
dhdv = np.gradient(h, axis=0) * (-H) / H_TORSO        # rows run down, v runs up; per metre
dhdu = np.gradient(h, axis=1) * W / (2 * np.pi * R_TORSO)
dhdu = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5 * W / (2 * np.pi * R_TORSO)  # wraps at the back seam
n = np.stack([-dhdu, -dhdv, np.ones_like(h)], -1)
n /= np.linalg.norm(n, axis=-1, keepdims=True)
# alpha: the cavity, how much the fold hides from the light (valleys darker, crests clear); the shader multiplies the colour by it
cav = np.clip(1.0 + (h - np.percentile(h, 85)) / (np.percentile(h, 85) - np.percentile(h, 3)) * 0.55, 0.45, 1.0)
img = np.dstack([((n * 0.5 + 0.5) * 255 + 0.5).astype(np.uint8), (cav * 255 + 0.5).astype(np.uint8)])
out = sys.argv[1] if len(sys.argv) > 1 else 'public/between/cult/make/folds-normal.png'
Image.fromarray(img, 'RGBA').save(out, optimize=True)
print(out, img.shape, 'max slope', float(np.hypot(dhdu, dhdv).max()))
