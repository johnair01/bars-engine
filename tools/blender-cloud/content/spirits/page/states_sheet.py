"""Round 12: the state sheet, the squint test and the veil test for one base in one element (shellback.py --state).

    python3 states_sheet.py OUT_DIR dissatisfied=DIR neutral=DIR satisfied=DIR veiled=DIR flooding=DIR [--element wood] [--base Tortoise]

Each DIR is a shellback.py OUT folder. Writes OUT_DIR/state-sheet.jpg (five forms by three states, labelled),
OUT_DIR/state-sprites.png (the fifteen 96 px sprites, labelled), OUT_DIR/squint.png (the same fifteen sprites shuffled and
numbered, no labels), OUT_DIR/squint-key.json (which number is which), OUT_DIR/veil.jpg (the dissatisfied creature beside
the veiled and the flooding one) and OUT_DIR/states-section.html, the page section with everything inline.
The shuffle is seeded, so the same folders always give the same squint sheet. Round 19: --seed sets the seed (each base
should pass its own, since rounds 17 and 18 shared one layout); it defaults to round 12's."""
import base64, io, json, pathlib, random, sys
from PIL import Image, ImageDraw, ImageFont

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
SRC = dict(a.split("=", 1) for a in sys.argv[2:] if "=" in a and not a.startswith("--"))
opt = {a.split("=", 1)[0][2:]: a.split("=", 1)[1] for a in sys.argv[2:] if a.startswith("--")}
EL = opt.get("element", "wood"); BASE = opt.get("base", "Tortoise")
STATES = ["dissatisfied", "neutral", "satisfied"]
ST = ["gas", "core", "hologram", "creature", "ascended"]
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


def sprite(state, st):
    return Image.open(pathlib.Path(SRC[state]) / "sprite" / f"{EL}-{st}.png").convert("RGBA")


def uri(im, fmt="JPEG"):
    b = io.BytesIO(); im.save(b, fmt, **({"quality": 84, "optimize": True} if fmt == "JPEG" else {"optimize": True}))
    return f"data:image/{fmt.lower()};base64," + base64.b64encode(b.getvalue()).decode()


# the state sheet: one row per state, one column per form
T = 300; L = 130; H = 30
sheet = Image.new("RGB", (L + T * 5, H + T * 3), BG); d = ImageDraw.Draw(sheet)
for j, st in enumerate(ST): d.text((L + j * T + 8, 6), LABEL[st], fill=(154, 162, 157), font=FONT)
for i, s in enumerate(STATES):
    d.text((8, H + i * T + T // 2 - 10), s.capitalize(), fill=(232, 234, 230), font=FONT)
    for j, st in enumerate(ST): sheet.paste(flat(pathlib.Path(SRC[s]) / "render" / f"{EL}-{st}.png", T), (L + j * T, H + i * T))
sheet.save(OUT / "state-sheet.jpg", quality=86)

# the sprites at their own size, labelled
P = 96; G = 14
sp = Image.new("RGBA", (L + (P + G) * 5, H + (P + G) * 3), BG + (255,)); d = ImageDraw.Draw(sp)
for j, st in enumerate(ST): d.text((L + j * (P + G), 8), st, fill=(154, 162, 157), font=SMALL)
for i, s in enumerate(STATES):
    d.text((8, H + i * (P + G) + 40), s, fill=(232, 234, 230), font=SMALL)
    for j, st in enumerate(ST): sp.alpha_composite(sprite(s, st), (L + j * (P + G), H + i * (P + G)))
sp.save(OUT / "state-sprites.png")

# the squint test: fifteen sprites shuffled, numbered, no labels
cells = [(s, st) for s in STATES for st in ST]
random.Random(opt.get("seed", "squint-r12")).shuffle(cells)
Z = 2  # shown at twice their size, pixel for pixel, the way the game scales them
sq = Image.new("RGBA", (5 * (P * Z + G) + G, 3 * (P * Z + G + 22) + G), BG + (255,)); d = ImageDraw.Draw(sq)
for k, (s, st) in enumerate(cells):
    x, y = G + (k % 5) * (P * Z + G), G + (k // 5) * (P * Z + G + 22)
    sq.alpha_composite(sprite(s, st).resize((P * Z, P * Z), Image.NEAREST), (x, y + 22))
    d.text((x + 4, y + 2), str(k + 1), fill=(232, 234, 230), font=FONT)
sq.save(OUT / "squint.png")
(OUT / "squint-key.json").write_text(json.dumps({str(k + 1): {"state": s, "form": st} for k, (s, st) in enumerate(cells)}, indent=1))

# the veil test: dissatisfied, veiled and flooding, the living creature
V = 360
veil = Image.new("RGB", (V * 3, V + H), BG); d = ImageDraw.Draw(veil)
for j, (key, name) in enumerate((("dissatisfied", "Dissatisfied"), ("veiled", "Veiled, polarity 6"), ("flooding", "Flooding, polarity -6"))):
    veil.paste(flat(pathlib.Path(SRC[key]) / "render" / f"{EL}-creature.png", V), (j * V, H))
    d.text((j * V + 8, 6), name, fill=(232, 234, 230), font=FONT)
veil.save(OUT / "veil.jpg", quality=86)
vsp = Image.new("RGBA", ((P * Z + G) * 3 + G, P * Z + 2 * G), BG + (255,))
for j, key in enumerate(("dissatisfied", "veiled", "flooding")):
    vsp.alpha_composite(Image.open(pathlib.Path(SRC[key]) / "sprite" / f"{EL}-creature.png").convert("RGBA").resize((P * Z, P * Z), Image.NEAREST), (G + j * (P * Z + G), G))
vsp.save(OUT / "veil-sprites.png")

rows = "".join(
    f'<div class="side states"><h3>{s.capitalize()}</h3>' + "".join(
        f'<figure><img src="{uri(flat(pathlib.Path(SRC[s]) / "render" / f"{EL}-{st}.png", 320))}" alt="{BASE}, {EL}, {LABEL[st].lower()}, {s}" loading="lazy"></figure>'
        for st in ST) + "</div>" for s in STATES)
head = '<div class="side states"><span></span>' + "".join(f'<span class="sidehead">{LABEL[st]}</span>' for st in ST) + "</div>"
(OUT / "states-section.html").write_text(f"""
  <style>.side.states{{grid-template-columns:6.5rem repeat(5,minmax(0,1fr))}}@media (max-width:760px){{.side.states{{grid-template-columns:4.5rem repeat(5,minmax(0,1fr))}}}}</style>
  <h2>Round 12: satisfied, neutral and dissatisfied</h2>
  <p>The {BASE.lower()} in {EL.capitalize()}, every form in its three states. Each state is the same model posed and re-materialled (board row <code>ss-markers</code>), so a state costs no new model. Neutral is the render you approved.</p>
  <ul>
    <li><strong>Dissatisfied:</strong> the Protector's push held and braced (<code>ss-feral-stance</code>). The living creature sets its forelegs wide, drops its head under the rim of its shell and tips the shell forward; the ally form hunches with both hands pushed out in front of it. The aura pulls in toward the body in a darker, denser shade, ringed by thorns that all point inward. The eyes narrow round a hot glint, the core is cracked and dimmed, and the shell and skin go rough.</li>
    <li><strong>Satisfied:</strong> the push completed and open. The creature lifts its head up and out and levels its shell; the ally form opens its arms wide. The aura spreads wider with a bright rim on the ground, the eyes open soft, and the core glows whole, with a ring of light round the gem in the smaller forms. Bright, never gold, so it cannot be mistaken for Meridia's crest.</li>
    <li><strong>Gas, core and hologram</strong> carry the state in their aura only: the motes pull into dark shards or spread wide under a ring, the core cracks or haloes, and the hologram's scanline breaks up or runs smooth.</li>
  </ul>
  {head}{rows}
  <h3 class="facehead">The fifteen sprites at 96 px</h3>
  <div class="sheetbox"><img src="{uri(sp, "PNG")}" alt="The fifteen 96 pixel sprites, one row per state" style="image-rendering:pixelated;max-width:none"></div>
  <h3 class="facehead">The squint test</h3>
  <p>The same fifteen sprites shuffled, with the labels off. Sort them into dissatisfied, neutral and satisfied by eye; the markers pass if 13 of 15 land right.</p>
  <div class="sheetbox"><img src="{uri(sq, "PNG")}" alt="Fifteen numbered spirit sprites in shuffled order" style="image-rendering:pixelated;max-width:none"></div>
  <h3 class="facehead">The veil test</h3>
  <p>The dissatisfied creature beside the same creature veiled at polarity 6 and flooding at -6 (<code>ss-not-veiled</code>). Dissatisfied is dense and dark; veiled is faint and fogged, and its state does not show, so it stands in the neutral pose; flooding is too big and too bright, with a glare in its own colour.</p>
  <figure><img src="{uri(veil)}" alt="Dissatisfied, veiled and flooding tortoises side by side" loading="lazy"></figure>
  <div class="sheetbox"><img src="{uri(vsp, "PNG")}" alt="The same three as sprites" style="image-rendering:pixelated;max-width:none"></div>
""")
print("wrote", OUT)
