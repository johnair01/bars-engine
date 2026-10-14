"""Builds the spirit proof page from one render folder per animal base (shellback.py's OUT dir for each).

    python3 build_proof.py OUT_DIR tortoise=DIR armadillo=DIR pangolin=DIR [fox=DIR meridia-fox=DIR] [otter=DIR meridia-otter=DIR] [before=DIR] [plain-tortoise=DIR ...]

Writes OUT_DIR/index.html with the renders and sprites inline, and OUT_DIR/glb/<base>-<element>-<stage>.glb
meshopt-compressed, and OUT_DIR/glb/<base>-<element>-<stage>.txt, the same file in base64, which the page fetches when a
model is picked (the artifact host serves .txt but not .glb; publish the .txt files beside the page).
When the render folders hold head close-ups (shellback.py --heads), the page shows the faces too; before=DIR, a folder of
<base>/head/<element>-<stage>.png from the last round, adds a before and after row for them. plain-<base>=DIR for all three bases, the same renders without the nation layer
(shellback.py --nation), adds a with and without section. fox=DIR (round 8, the Player's Romp) adds the fox to the viewer,
the rows and the sprite sheet, and a section setting it beside the tortoise; meridia-fox=DIR, the fox met in Meridia, sets
each element beside it. otter=DIR and meridia-otter=DIR (round 9) do the same for the otter, which the viewer then
opens on, and write OUT_DIR/otter-section.html as well. A base whose folder has no glb/ keeps the models already published beside the page."""
import base64, io, json, pathlib, subprocess, sys
from PIL import Image

OUT = pathlib.Path(sys.argv[1]); SRC = dict(a.split("=", 1) for a in sys.argv[2:])
SHELL = {"tortoise": "Tortoise", "armadillo": "Armadillo", "pangolin": "Pangolin"}
ROMP = {b: n for b, n in (("otter", "Otter"), ("fox", "Fox")) if b in SRC}  # round 9 adds the otter, and the viewer opens on it
BASES = {**ROMP, **SHELL}
FIRST = next(iter(ROMP), "armadillo")  # the base the viewer and rows open on
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
    for e in EL if (W / "glb").is_dir() else ():
        for s in ST:
            subprocess.run(["npx", "-y", "@gltf-transform/cli@4", "meshopt", str(W / "glb" / f"{e}-{s}.glb"),
                            str(OUT / "glb" / f"{base}-{e}-{s}.glb")], check=True, capture_output=True)
        for s in ST:
            g = OUT / "glb" / f"{base}-{e}-{s}.glb"
            g.with_suffix(".txt").write_text(base64.b64encode(g.read_bytes()).decode())
    largest = max(largest, max(i["glb_kb"] for i in json.loads((W / "report.json").read_text())["items"]))
    rows += f'<div data-base="{base}"{"" if base == FIRST else " hidden"}>'
    for e in EL:
        cells = "".join(f'<figure><img src="{jpg(W / "render" / f"{e}-{s}.png", 360)}" alt="{NAMES[e]} {name.lower()}, {s} stage" '
                        f'width="360" height="360" loading="lazy"><figcaption>{LABEL[s]}</figcaption></figure>' for s in ST)
        rows += f'<section class="row"><h3>{NAMES[e]} {name.lower()}</h3><div class="strip">{cells}</div></section>'
    rows += "</div>"
    sheet += f'<h3>{name}</h3><div class="sheet">' + "".join(
        f'<img class="px" src="{png(W / "sprite" / f"{e}-{s}.png")}" alt="{NAMES[e]} {name.lower()} {s} sprite" width="96" height="96">'
        for e in EL for s in ST) + "</div>"
side = '<div class="side"><span></span>' + "".join(f'<span class="sidehead">{n}</span>' for n in SHELL.values())
for e in EL:
    side += f"<h3>{NAMES[e]}</h3>" + "".join(
        f'<figure><img src="{jpg(pathlib.Path(SRC[b]) / "render" / f"{e}-creature.png", 300)}" alt="{NAMES[e]} {n.lower()}, living creature" '
        f'width="300" height="300" loading="lazy"></figure>' for b, n in SHELL.items())
side += "</div>"

faces = ""
if all((pathlib.Path(SRC[b]) / "head").is_dir() for b in SHELL):
    head = lambda d, e, s: jpg(pathlib.Path(d) / "head" / f"{e}-{s}.png", 300)
    if "before" in SRC:
        B = pathlib.Path(SRC["before"])
        faces += '<div class="side"><span></span>' + "".join(f'<span class="sidehead">{n}</span>' for n in BASES.values())
        for tag, src in (("Before", lambda b: B / b), ("After", lambda b: SRC[b])):
            faces += f"<h3>{tag}</h3>" + "".join(
                f'<figure><img src="{head(src(b), "wood", "creature")}" alt="Wood {n.lower()}\'s face, {tag.lower()}" '
                f'width="300" height="300" loading="lazy"></figure>' for b, n in BASES.items())
        faces += "</div>"
    for s_, lab in (("creature", "Living creature"), ("ascended", "Highest ally form")):
        faces += f'<h3 class="facehead">{lab}</h3><div class="side"><span></span>' + "".join(f'<span class="sidehead">{n}</span>' for n in BASES.values())
        for e in EL:
            faces += f"<h3>{NAMES[e]}</h3>" + "".join(
                f'<figure><img src="{head(SRC[b], e, s_)}" alt="{NAMES[e]} {n.lower()}\'s face, {lab.lower()}" '
                f'width="300" height="300" loading="lazy"></figure>' for b, n in BASES.items())
        faces += "</div>"

nation = ""  # plain-<base>=DIR, the same base without the nation, sets each element beside its nation version
if all(f"plain-{b}" in SRC for b in SHELL):
    for base, name in SHELL.items():
        P, W = pathlib.Path(SRC[f"plain-{base}"]), pathlib.Path(SRC[base])
        nation += f'<div data-base="{base}"{"" if base == "armadillo" else " hidden"}>'
        for e in EL:
            for tag, d in (("without", P), ("met in Meridia", W)):
                cells = "".join(f'<figure><img src="{jpg(d / "render" / f"{e}-{s}.png", 300)}" alt="{NAMES[e]} {name.lower()}, {s} stage, {tag}" '
                                f'width="300" height="300" loading="lazy"><figcaption>{LABEL[s]}</figcaption></figure>' for s in ST)
                nation += f'<section class="row"><h3>{NAMES[e]} {name.lower()}, {tag}</h3><div class="strip">{cells}</div></section>'
        nation += f'<div class="sheetbox"><div class="sheethead"><span>Gas</span><span>Core</span><span>Hologram</span><span>Creature</span><span>Highest</span></div>'
        for tag, d in (("Without", P), ("Met in Meridia", W)):
            nation += f'<h3>{name} sprites, {tag.lower()}</h3><div class="sheet">' + "".join(
                f'<img class="px" src="{png(d / "sprite" / f"{e}-{s}.png")}" alt="{NAMES[e]} {name.lower()} {s} sprite, {tag.lower()}" width="96" height="96">'
                for e in EL for s in ST) + "</div>"
        nation += "</div></div>"

romp = ""  # round 8: the fox beside the tortoise, its faces, and the fox met in Meridia
if "fox" in SRC:
    F, T = pathlib.Path(SRC["fox"]), pathlib.Path(SRC["plain-tortoise"] if "plain-tortoise" in SRC else SRC["tortoise"])
    romp += '<div class="sheetbox"><div class="pair">' + "".join(
        f'<div><h3>{n}</h3><div class="sheethead"><span>Gas</span><span>Core</span><span>Hologram</span><span>Creature</span><span>Highest</span></div>'
        f'<div class="sheet">' + "".join(f'<img class="px" src="{png(d / "sprite" / f"{e}-{s}.png")}" alt="{NAMES[e]} {n.lower()} {s} sprite" width="96" height="96">'
                                         for e in EL for s in ST) + "</div></div>" for n, d in (("Shellback tortoise", T), ("Romp fox", F))) + "</div></div>"
    romp += '<h3 class="facehead">Living creature and highest ally form, side by side</h3><div class="side four"><span></span>' + "".join(
        f'<span class="sidehead">{h}</span>' for h in ("Tortoise", "Fox", "Tortoise ally", "Fox ally"))
    for e in EL:
        romp += f"<h3>{NAMES[e]}</h3>" + "".join(
            f'<figure><img src="{jpg(d / "render" / f"{e}-{s}.png", 300)}" alt="{NAMES[e]} {n}, {LABEL[s].lower()}" width="300" height="300" loading="lazy"></figure>'
            for s in ("creature", "ascended") for n, d in (("tortoise", T), ("fox", F)))
    romp += "</div>"
    if (F / "head").is_dir():
        romp += '<h3 class="facehead">The fox\'s face</h3><div class="side"><span></span>' + "".join(
            f'<span class="sidehead">{h}</span>' for h in ("Living creature", "Highest ally form", "Sprite"))
        for e in EL:
            romp += f"<h3>{NAMES[e]}</h3>" + "".join(
                f'<figure><img src="{jpg(F / "head" / f"{e}-{s}.png", 300)}" alt="{NAMES[e]} fox\'s face, {LABEL[s].lower()}" width="300" height="300" loading="lazy"></figure>'
                for s in ("creature", "ascended")) + f'<figure><img class="px big" src="{png(F / "sprite" / f"{e}-creature.png")}" alt="{NAMES[e]} fox creature sprite" width="96" height="96"></figure>'
        romp += "</div>"
    if "meridia-fox" in SRC:
        M = pathlib.Path(SRC["meridia-fox"])
        romp += '<h3 class="facehead">The fox met in Meridia</h3><p>The same nation switch as the Shellback\'s, unchanged: sun ring, terraced plinth and dais, sun crest, terraced collar and trade coins.</p>'
        for e in EL:
            for tag, d in (("without", F), ("met in Meridia", M)):
                cells = "".join(f'<figure><img src="{jpg(d / "render" / f"{e}-{s}.png", 300)}" alt="{NAMES[e]} fox, {s} stage, {tag}" '
                                f'width="300" height="300" loading="lazy"><figcaption>{LABEL[s]}</figcaption></figure>' for s in ST)
                romp += f'<section class="row"><h3>{NAMES[e]} fox, {tag}</h3><div class="strip">{cells}</div></section>'


otter = ""  # round 9: the otter beside the fox and the tortoise, side by side with the fox, its faces, and met in Meridia
if "otter" in SRC:
    O, F, T = pathlib.Path(SRC["otter"]), pathlib.Path(SRC["fox"]), pathlib.Path(SRC["plain-tortoise"] if "plain-tortoise" in SRC else SRC["tortoise"])
    otter += '<div class="sheetbox"><div class="pair">' + "".join(
        f'<div><h3>{n}</h3><div class="sheethead"><span>Gas</span><span>Core</span><span>Hologram</span><span>Creature</span><span>Highest</span></div>'
        f'<div class="sheet">' + "".join(f'<img class="px" src="{png(d / "sprite" / f"{e}-{s}.png")}" alt="{NAMES[e]} {n.lower()} {s} sprite" width="96" height="96">'
                                         for e in EL for s in ST) + "</div></div>" for n, d in (("Romp otter", O), ("Romp fox", F), ("Shellback tortoise", T))) + "</div></div>"
    otter += '<h3 class="facehead">Living creature and highest ally form, beside the fox</h3><div class="side four"><span></span>' + "".join(
        f'<span class="sidehead">{h}</span>' for h in ("Fox", "Otter", "Fox ally", "Otter ally"))
    for e in EL:
        otter += f"<h3>{NAMES[e]}</h3>" + "".join(
            f'<figure><img src="{jpg(d / "render" / f"{e}-{s}.png", 300)}" alt="{NAMES[e]} {n}, {LABEL[s].lower()}" width="300" height="300" loading="lazy"></figure>'
            for s in ("creature", "ascended") for n, d in (("fox", F), ("otter", O)))
    otter += "</div>"
    if (O / "head").is_dir():
        otter += '<h3 class="facehead">The otter\'s face</h3><div class="side"><span></span>' + "".join(
            f'<span class="sidehead">{h}</span>' for h in ("Living creature", "Highest ally form", "Sprite"))
        for e in EL:
            otter += f"<h3>{NAMES[e]}</h3>" + "".join(
                f'<figure><img src="{jpg(O / "head" / f"{e}-{s}.png", 300)}" alt="{NAMES[e]} otter\'s face, {LABEL[s].lower()}" width="300" height="300" loading="lazy"></figure>'
                for s in ("creature", "ascended")) + f'<figure><img class="px big" src="{png(O / "sprite" / f"{e}-creature.png")}" alt="{NAMES[e]} otter creature sprite" width="96" height="96"></figure>'
        otter += "</div>"
    if "meridia-otter" in SRC:
        M = pathlib.Path(SRC["meridia-otter"])
        otter += '<h3 class="facehead">The otter met in Meridia</h3><p>The same nation switch, unchanged: sun ring, terraced plinth and dais, sun crest, terraced collar, and trade coins at the ally form\'s belt.</p>'
        for e in EL:
            for tag, d in (("without", O), ("met in Meridia", M)):
                cells = "".join(f'<figure><img src="{jpg(d / "render" / f"{e}-{s}.png", 300)}" alt="{NAMES[e]} otter, {s} stage, {tag}" '
                                f'width="300" height="300" loading="lazy"><figcaption>{LABEL[s]}</figcaption></figure>' for s in ST)
                otter += f'<section class="row"><h3>{NAMES[e]} otter, {tag}</h3><div class="strip">{cells}</div></section>'
    (OUT / "otter-section.html").write_text(otter)  # for splicing into a page that carries hand-made sections

html = (pathlib.Path(__file__).parent / "proof_template.html").read_text()
html = html.replace("%%ROWS%%", rows).replace("%%SHEET%%", sheet).replace("%%SIDE%%", side).replace("%%HEADS%%", faces).replace("%%NATION%%", nation).replace("%%ROMP%%", romp).replace("%%OTTER%%", otter)\
    .replace("%%VIEWBASES%%", json.dumps(BASES)).replace("%%FIRST%%", FIRST).replace("%%FACES%%", str(largest))
(OUT / "index.html").write_text(html)
print(OUT / "index.html", round(len(html) / 1e6, 2), "MB;", sum(f.stat().st_size for f in (OUT / "glb").iterdir()) // 1024, "KB of models")
