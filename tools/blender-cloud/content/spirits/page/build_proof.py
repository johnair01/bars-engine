"""Builds the spirit proof page from one render folder per animal base (shellback.py's OUT dir for each).

    python3 build_proof.py OUT_DIR tortoise=DIR armadillo=DIR pangolin=DIR

Writes OUT_DIR/index.html with the renders and sprites inline, and OUT_DIR/glb/<base>-<element>-<stage>.glb
meshopt-compressed, which the page fetches when a model is picked (publish them beside the page as its files)."""
import base64, io, json, pathlib, subprocess, sys
from PIL import Image

OUT = pathlib.Path(sys.argv[1]); SRC = dict(a.split("=", 1) for a in sys.argv[2:])
BASES = {"tortoise": "Tortoise", "armadillo": "Armadillo", "pangolin": "Pangolin"}
EL = ["earth", "wood", "fire", "water", "metal"]; ST = ["gas", "core", "hologram", "creature", "ascended"]
LABEL = {"gas": "Gas", "core": "Core", "hologram": "Hologram", "creature": "Living creature", "ascended": "Highest ally form"}
NAMES = {"earth": "Earth", "wood": "Wood", "fire": "Fire", "water": "Water", "metal": "Metal"}
BG = (21, 24, 33)  # the panel colour: renders are flattened onto it and kept as JPEG, so the page stays small


def jpg(path, size):
    im = Image.open(path).convert("RGBA").resize((size, size), Image.LANCZOS)
    flat = Image.new("RGBA", im.size, BG + (255,)); flat.alpha_composite(im)
    b = io.BytesIO(); flat.convert("RGB").save(b, "JPEG", quality=84, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def png(path):
    b = io.BytesIO(); Image.open(path).convert("RGBA").save(b, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()


(OUT / "glb").mkdir(parents=True, exist_ok=True)
rows = side = sheet = ""
largest = 0
for base, name in BASES.items():
    W = pathlib.Path(SRC[base])
    for e in EL:
        for s in ST:
            subprocess.run(["npx", "-y", "@gltf-transform/cli@4", "meshopt", str(W / "glb" / f"{e}-{s}.glb"),
                            str(OUT / "glb" / f"{base}-{e}-{s}.glb")], check=True, capture_output=True)
    largest = max(largest, max(i["glb_kb"] for i in json.loads((W / "report.json").read_text())["items"]))
    rows += f'<div data-base="{base}"{"" if base == "armadillo" else " hidden"}>'
    for e in EL:
        cells = "".join(f'<figure><img src="{jpg(W / "render" / f"{e}-{s}.png", 360)}" alt="{NAMES[e]} {name.lower()}, {s} stage" '
                        f'width="360" height="360" loading="lazy"><figcaption>{LABEL[s]}</figcaption></figure>' for s in ST)
        rows += f'<section class="row"><h3>{NAMES[e]} {name.lower()}</h3><div class="strip">{cells}</div></section>'
    rows += "</div>"
    sheet += f'<h3>{name}</h3><div class="sheet">' + "".join(
        f'<img class="px" src="{png(W / "sprite" / f"{e}-{s}.png")}" alt="{NAMES[e]} {name.lower()} {s} sprite" width="96" height="96">'
        for e in EL for s in ST) + "</div>"
side = '<div class="side"><span></span>' + "".join(f'<span class="sidehead">{n}</span>' for n in BASES.values())
for e in EL:
    side += f"<h3>{NAMES[e]}</h3>" + "".join(
        f'<figure><img src="{jpg(pathlib.Path(SRC[b]) / "render" / f"{e}-creature.png", 300)}" alt="{NAMES[e]} {n.lower()}, living creature" '
        f'width="300" height="300" loading="lazy"></figure>' for b, n in BASES.items())
side += "</div>"

html = (pathlib.Path(__file__).parent / "proof_template.html").read_text()
html = html.replace("%%ROWS%%", rows).replace("%%SHEET%%", sheet).replace("%%SIDE%%", side).replace("%%FACES%%", str(largest))
(OUT / "index.html").write_text(html)
print(OUT / "index.html", round(len(html) / 1e6, 2), "MB;", sum(f.stat().st_size for f in (OUT / "glb").iterdir()) // 1024, "KB of models")
