"""Draws the stand-in pictures the first chamber dressing is built from.

No ChatGPT picture had reached the cave studio's Drive inbox on 2026-10-12, so the first run of the studio builds from
these: painted-looking concept pictures of one object each, on a plain paper background, seen from the front, the
shape ChatGPT is asked for (README.md here). They are drawn by this script, by hand-written shapes, and are own work.
When his first ChatGPT picture arrives it goes through the same tool, and these stay as the stand-ins
(council position cs-stand-in).

Run with any Python that has Pillow:  python3 content/ontology-game/cave/pictures/draw_standins.py
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 512, 640
PAPER = (232, 224, 208)


def paper(seed):
    rng = random.Random(seed)
    im = Image.new("RGB", (W, H), PAPER)
    px = im.load()
    for y in range(H):
        for x in range(W):
            n = rng.randint(-6, 6)
            px[x, y] = tuple(c + n for c in PAPER)
    return im


def shade(im, mask, light, dark, rim, seed, streaks=0):
    """Fills the mask with a left-lit gradient, brush noise and a dark rim, like a quick painted study."""
    rng = random.Random(seed)
    m = mask.load()
    px = im.load()
    xs = [x for y in range(H) for x in range(W) if m[x, y]]
    x0, x1 = min(xs), max(xs)
    for y in range(H):
        for x in range(W):
            if not m[x, y]:
                continue
            t = (x - x0) / max(1, x1 - x0)
            t = min(1, max(0, t + 0.08 * math.sin(y / 23.0 + seed) + rng.uniform(-0.05, 0.05)))
            if streaks and (y // streaks) % 2:
                t = min(1, t + 0.06)
            px[x, y] = tuple(int(light[i] * (1 - t) + dark[i] * t) for i in range(3))
    edge = mask.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3))
    e = edge.load()
    for y in range(H):
        for x in range(W):
            if e[x, y] and m[x, y]:
                px[x, y] = rim
    return im


def spire():
    """A stalagmite: a tall cone with three soft collars, drip-thick at the base."""
    mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mask)
    cx, base, top = W // 2, 600, 70
    left, right = [], []
    for i in range(61):
        t = i / 60
        y = base - t * (base - top)
        r = 130 * (1 - t) ** 0.8 + 6
        r *= 1 + 0.10 * math.exp(-((t - 0.28) / 0.05) ** 2) + 0.08 * math.exp(-((t - 0.55) / 0.04) ** 2) \
            + 0.07 * math.exp(-((t - 0.78) / 0.035) ** 2)
        left.append((cx - r, y))
        right.append((cx + r * 0.97, y))
    d.polygon(left + right[::-1], fill=255)
    im = shade(paper(1), mask, (200, 188, 168), (92, 80, 70), (60, 52, 46), 1, streaks=9)
    return im


def glowcap():
    """A glowing cave mushroom: thin stem, a wide domed cap with a lip."""
    mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mask)
    cx = W // 2
    d.polygon([(cx - 22, 600), (cx - 14, 330), (cx + 14, 330), (cx + 26, 600)], fill=255)
    d.ellipse((cx - 70, 570, cx + 74, 620), fill=255)          # the foot spreads into the floor
    d.pieslice((cx - 200, 150, cx + 200, 470), 180, 360, fill=255)  # dome
    d.ellipse((cx - 205, 290, cx + 205, 345), fill=255)         # lip
    im = shade(paper(2), mask, (210, 246, 214), (60, 140, 120), (40, 90, 80), 2)
    return im


def root():
    """A root breaking from the wall: a thick trunk curling down into two tapering tails."""
    mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mask)

    def stroke(points, r0, r1):
        n = len(points)
        for i, (x, y) in enumerate(points):
            r = r0 + (r1 - r0) * i / (n - 1)
            d.ellipse((x - r, y - r, x + r, y + r), fill=255)

    main = [(120 + 220 * math.sin(t * 1.6) * (1 - t * 0.4), 60 + 470 * t) for t in (i / 120 for i in range(121))]
    stroke(main, 44, 10)
    tail = [(250 + 160 * t, 300 + 130 * math.sin(t * 2.4)) for t in (i / 80 for i in range(81))]
    stroke(tail, 26, 6)
    im = shade(paper(3), mask, (170, 132, 98), (70, 48, 36), (45, 30, 22), 3, streaks=6)
    return im


if __name__ == "__main__":
    for name, fn in (("stone_spire", spire), ("glow_cap", glowcap), ("root_curl", root)):
        path = os.path.join(HERE, name + ".jpg")
        fn().save(path, quality=88, optimize=True)
        print("wrote", path, os.path.getsize(path), "bytes")
