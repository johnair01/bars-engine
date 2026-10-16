"""Round 13: a new family's first base as a page section and sheets, set beside the bases already built.

    python3 family_section.py OUT_DIR NEW=DIR [Fox=DIR Tortoise=DIR ...] --noun=raccoon --intro=intro.html [--states=DIR]

NEW is the new base's shellback.py OUT folder (neutral); every other NAME=DIR is an earlier base, shown beside it in the
order given. --states is a states_sheet.py OUT folder, whose state sheet, squint sheet and veil trio join the section.
Writes OUT_DIR/contact-sheet.jpg (the new base's 25 renders, a row per element), OUT_DIR/sprites-beside.png (each base's
25 sprites side by side, labelled), OUT_DIR/creatures-beside.jpg (each base's living creature and highest ally form, a
row per element) and OUT_DIR/section.html (everything inline, for splicing into the proof page above the last round)."""
import base64, io, pathlib, sys
from PIL import Image, ImageDraw, ImageFont

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
pos = [a for a in sys.argv[2:] if "=" in a and not a.startswith("--")]
opt = {a.split("=", 1)[0][2:]: a.split("=", 1)[1] for a in sys.argv[2:] if a.startswith("--")}
SRC = [(k, pathlib.Path(v)) for k, v in (a.split("=", 1) for a in pos)]
NEW = SRC[0][1]; NOUN = opt.get("noun", "new base")
EL = ["earth", "wood", "fire", "water", "metal"]; ST = ["gas", "core", "hologram", "creature", "ascended"]
LABEL = {"gas": "Gas", "core": "Core", "hologram": "Hologram", "creature": "Living creature", "ascended": "Highest ally form"}
BG = (21, 24, 33)
try:
    FONT = ImageFont.truetype("DejaVuSans.ttf", 18); SMALL = ImageFont.truetype("DejaVuSans.ttf", 13)
except OSError:
    FONT = SMALL = ImageFont.load_default()


def flat(path, size):
    im = Image.open(path).convert("RGBA").resize((size, size), Image.LANCZOS)
    f = Image.new("RGBA", im.size, BG + (255,)); f.alpha_composite(im)
    return f.convert("RGB")


def uri(im, fmt="JPEG"):
    b = io.BytesIO(); im.save(b, fmt, **({"quality": 84, "optimize": True} if fmt == "JPEG" else {"optimize": True}))
    return f"data:image/{fmt.lower()};base64," + base64.b64encode(b.getvalue()).decode()


def grid(cells, cols, size, left=80, top=30, rows_label=(), cols_label=()):
    rows = (len(cells) + cols - 1) // cols
    im = Image.new("RGB", (left + cols * size, top + rows * size), BG); d = ImageDraw.Draw(im)
    for i, c in enumerate(cols_label): d.text((left + i * size + 6, 6), c, fill=(200, 205, 215), font=SMALL)
    for j, r in enumerate(rows_label): d.text((6, top + j * size + size // 2 - 9), r, fill=(200, 205, 215), font=FONT)
    for k, c in enumerate(cells): im.paste(c, (left + (k % cols) * size, top + (k // cols) * size))
    return im


contact = grid([flat(NEW / "render" / f"{e}-{s}.png", 300) for e in EL for s in ST], 5, 300,
               rows_label=[e.capitalize() for e in EL], cols_label=[LABEL[s] for s in ST])
contact.save(OUT / "contact-sheet.jpg", quality=86)

sheets = []
for name, d in SRC:
    cells = []
    for e in EL:
        for s in ST:
            sp = Image.open(d / "sprite" / f"{e}-{s}.png").convert("RGBA")
            f = Image.new("RGBA", sp.size, BG + (255,)); f.alpha_composite(sp); cells.append(f.convert("RGB"))
    sheets.append(grid(cells, 5, 96, 0, 26, cols_label=[name]))
w = sum(s.width for s in sheets) + 24 * (len(sheets) - 1)
beside = Image.new("RGB", (w, sheets[0].height), BG); x = 0
for s in sheets: beside.paste(s, (x, 0)); x += s.width + 24
beside.save(OUT / "sprites-beside.png")

heads = [f"{n} {'ally' if s == 'ascended' else ''}".strip() for n, _ in SRC for s in ("creature", "ascended")]
creatures = grid([flat(d / "render" / f"{e}-{s}.png", 260) for e in EL for _, d in SRC for s in ("creature", "ascended")],
                 2 * len(SRC), 260, rows_label=[e.capitalize() for e in EL], cols_label=heads)
creatures.save(OUT / "creatures-beside.jpg", quality=84)

html = pathlib.Path(opt["intro"]).read_text() if "intro" in opt else ""
html += f'<h3 class="facehead">Every form in every element</h3><figure><img src="{uri(contact)}" alt="The {NOUN} in five forms and five elements" loading="lazy" style="width:100%;height:auto"></figure>'
html += f'<h3 class="facehead">At sprite size, beside the other bases</h3><figure><img class="px" src="{uri(beside, "PNG")}" alt="Sprites of the {NOUN} beside the other bases" style="width:auto;height:auto;max-width:100%"></figure>'
html += f'<h3 class="facehead">Living creature and highest ally form, beside the other bases</h3><figure><img src="{uri(creatures)}" alt="The {NOUN} beside the other bases, creature and ally form" loading="lazy" style="width:100%;height:auto"></figure>'
if "states" in opt:
    S = pathlib.Path(opt["states"])
    html += f'<h3 class="facehead">Its three states</h3><figure><img src="{uri(Image.open(S / "state-sheet.jpg").convert("RGB"))}" alt="The {NOUN} in five forms by three states" loading="lazy" style="width:100%;height:auto"></figure>'
    html += f'<h3 class="facehead">Squint test: fifteen sprites, shuffled, labels off</h3><figure><img class="px" src="{uri(Image.open(S / "squint.png").convert("RGBA"), "PNG")}" alt="Fifteen shuffled sprites of the {NOUN}" style="width:auto;height:auto;max-width:100%"></figure>'
    html += f'<h3 class="facehead">Veil test: dissatisfied, veiled, flooding</h3><figure><img src="{uri(Image.open(S / "veil.jpg").convert("RGB"))}" alt="The {NOUN} dissatisfied, veiled and flooding" loading="lazy" style="width:100%;height:auto"></figure>'
(OUT / "section.html").write_text(html)
print(OUT / "section.html", round(len(html) / 1e6, 2), "MB")
