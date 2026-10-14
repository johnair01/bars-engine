import base64, io, json, pathlib, sys
from PIL import Image

W = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2])
EL = ["earth", "wood", "fire", "water", "metal"]; ST = ["gas", "core", "hologram", "creature", "ascended"]
LABEL = {"gas": "Gas", "core": "Core", "hologram": "Hologram", "creature": "Living creature", "ascended": "Highest ally form"}
NAMES = {"earth": "Earth", "wood": "Wood", "fire": "Fire", "water": "Water", "metal": "Metal"}

def png(path, size=None):
    im = Image.open(path).convert("RGBA")
    if size: im = im.resize((size, size), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

renders = {f"{e}-{s}": png(W / "render" / f"{e}-{s}.png", 360) for e in EL for s in ST}
sprites = {f"{e}-{s}": png(W / "sprite" / f"{e}-{s}.png") for e in EL for s in ST}
glbs = {f"{e}-{s}": base64.b64encode((W / "glb" / f"{e}-{s}.glb").read_bytes()).decode() for e in EL for s in ST}
report = json.loads((W / "report.json").read_text())

rows = ""
for e in EL:
    cells = "".join(f'<figure><img src="{renders[f"{e}-{s}"]}" alt="{NAMES[e]} Shellback, {s} stage" width="360" height="360"><figcaption>{LABEL[s]}</figcaption></figure>' for s in ST)
    rows += f'<section class="row"><h3>{NAMES[e]}</h3><div class="strip">{cells}</div></section>'
sheet = "".join(f'<img class="px" src="{sprites[f"{e}-{s}"]}" alt="{NAMES[e]} {s} sprite" width="96" height="96">' for e in EL for s in ST)

html = (pathlib.Path(__file__).parent / "proof_template.html").read_text()
html = html.replace("%%ROWS%%", rows).replace("%%SHEET%%", sheet).replace("%%GLBS%%", json.dumps(glbs)) \
           .replace("%%FACES%%", str(max(i["glb_kb"] for i in report["items"])))
OUT.write_text(html)
print(OUT, round(len(html) / 1e6, 2), "MB")
