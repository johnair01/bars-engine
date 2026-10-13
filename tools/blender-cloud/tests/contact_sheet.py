"""Builds the contact sheet for E1 and E2 with bpy's own image tools (no extra package). Run under the bpy venv.

usage: python contact_sheet.py OUT.jpg ROWS.json
ROWS.json: [{"label": "stone_spire 0.987", "images": ["a.png", "b_mask.npy", ...]}, ...]. A .npy is from_picture's
saved outlines, drawn as an overlay. Each image is fitted into a
240 by 240 cell; each row's label is written into the run summary, not drawn (bpy has no text drawing).
"""
import json, sys

import bpy
import numpy as np

CELL = 240


def overlay(path):
    """From_picture's saved [picture outline, model outline]: picture only red, model only blue, both white."""
    mask, sil = np.load(path)
    px = np.zeros(mask.shape + (3,), np.float32)
    px[mask] = (0.85, 0.2, 0.2)
    px[sil] = (0.2, 0.35, 0.9)
    px[mask & sil] = (0.92, 0.92, 0.92)
    return px[::-1]  # picture rows run top-down, bpy's bottom-up


def load(path):
    if path.endswith(".npy"):
        px = overlay(path)
    else:
        im = bpy.data.images.load(path)
        w, h = im.size
        px = np.array(im.pixels[:], dtype=np.float32).reshape(h, w, im.channels)[:, :, :3]
    h, w = px.shape[:2]
    step = max(w, h) / CELL
    ys = (np.arange(int(h / step)) * step).astype(int)
    xs = (np.arange(int(w / step)) * step).astype(int)
    return px[ys][:, xs]


out, rows = sys.argv[1], json.load(open(sys.argv[2]))
cols = max(len(r["images"]) for r in rows)
sheet = np.full((CELL * len(rows), CELL * cols, 3), 0.12, dtype=np.float32)
for r, row in enumerate(rows):
    for c, path in enumerate(row["images"]):
        px = load(path)
        y0 = sheet.shape[0] - CELL * (r + 1)  # bpy pixels run bottom-up; the first row goes at the top
        sheet[y0:y0 + px.shape[0], c * CELL:c * CELL + px.shape[1]] = px
img = bpy.data.images.new("sheet", sheet.shape[1], sheet.shape[0])
img.pixels.foreach_set(np.dstack([sheet, np.ones(sheet.shape[:2], np.float32)]).ravel())
img.filepath_raw = out
img.file_format = "JPEG"
bpy.context.scene.render.image_settings.quality = 80
img.save()
