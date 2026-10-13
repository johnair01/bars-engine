"""Contact sheet for T3: per ask, the chamber before, after the recipe edit, after the code edit (front and top views).

    python3 sheet.py <asks.json> <trial dir> <base out dir> <sheet.png>
"""
import json
import sys

from PIL import Image, ImageDraw

asks, trial, base, out = json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3], sys.argv[4]
W, H, PAD, LAB = 240, 150, 6, 22
cols = [("before", base), ("recipe", None), ("code", None)]
sheet = Image.new("RGB", (PAD + 6 * (W + PAD), LAB + len(asks) * (H + LAB + PAD)), (24, 22, 20))
d = ImageDraw.Draw(sheet)
for c, (name, _) in enumerate(cols):
    d.text((PAD + c * 2 * (W + PAD), 4), f"{name}: front, top", fill=(230, 230, 230))
for i, ask in enumerate(asks, 1):
    y = LAB + (i - 1) * (H + LAB + PAD)
    d.text((PAD, y + 4), f"{i:02d}  {ask}", fill=(255, 220, 160))
    for c, (name, path) in enumerate(cols):
        folder = path or f"{trial}/{name}/{i:02d}/out"
        for v, view in enumerate(("front", "top")):
            im = Image.open(f"{folder}/view_{view}.png").convert("RGB").resize((W, H))
            sheet.paste(im, (PAD + (2 * c + v) * (W + PAD), y + LAB))
sheet.save(out)
