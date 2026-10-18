"""Keep the Spirit Art Proof page light: pictures and models load only when needed.

The page (claude.ai artifact B9zYsNyxe6UVhRF3jcNP85) grew to a 13.8 MB index.html (images inline) and
150 MB of model packs in its published files, against an Artifact limit of 16 MB a page and 256 MB a
version. An Artifact page cannot fetch from any other host (its CSP blocks bars-engine.vercel.app), so
the models move into the artifact's own asset store (1 GiB, 5,000 files, kept across versions), and the
pictures move into one JSON file per round section, fetched when the reader scrolls near it.

  python3 lighten.py split PAGE_DIR OUT_DIR
      Reads PAGE_DIR/index.html (a page as published, light or not) and writes OUT_DIR/index.html with
      every inline data: picture swapped for a lazy placeholder, plus OUT_DIR/parts/<hash>.json for each
      section's pictures. Safe to run on an already light page: only new inline pictures move.
      Parts are named by content, so a part already published is never rewritten.

  python3 lighten.py stage PACK_DIR STAGE_DIR [--have MANIFEST]
      Copies each model pack PACK_DIR/<name>.json to STAGE_DIR/<name>.js for upload (the Artifact
      tool takes 25 .js files a call but only one .json). With --have, skips packs the manifest
      already lists. The page fetches and parses them; it never runs them.

  python3 lighten.py manifest UPLOAD_RESULT... --into MANIFEST
      Reads the Artifact tool's asset upload results (pasted to text files) and merges
      {"<name>": "/_blob/<id>"} into MANIFEST (publish it as glb/manifest.json).

A round then: build its section and packs as before, run split on the page, stage the new packs,
upload them with Artifact publish (url, asset: true, file_paths), run manifest, and publish the new
index.html with parts/ and glb/manifest.json. Packs never go into the page's published files again.
"""
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

DATA_IMG = re.compile(r'src="(data:image/[a-z+]+;base64,[A-Za-z0-9+/=]+)"')
BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACw="
CHUNK = 1_200_000
LOADER_MARK = "<!-- lighten: picture loader -->"
LOADER = LOADER_MARK + """
<script>
(() => {
  const parts = {};
  const get = n => parts[n] = parts[n] || fetch("parts/" + n + ".json").then(r => r.json());
  const show = img => get(img.dataset.part).then(p => { img.src = p[+img.dataset.i]; img.removeAttribute("data-part"); })
    .catch(() => { img.alt = img.alt + " (the picture did not load)"; });
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { io.unobserve(e.target); show(e.target); } }), {rootMargin: "1500px 0px"}) : null;
  document.querySelectorAll("img[data-part]").forEach(img => io ? io.observe(img) : show(img));
})();
</script>
"""
MODEL_FETCH = 'fetch("glb/"+file+".json")'
MODEL_SRC = 'fetch(MODELS[file] || "glb/"+file+".json")'
MODELS_LINE = ('const MODELS = await fetch("glb/manifest.json").then(r => r.ok ? r.json() : {}).catch(() => ({}));'
               '  // model packs live in the asset store, see lighten.py\n')


def split(page_dir, out_dir):
    page, out = Path(page_dir), Path(out_dir)
    html = (page / "index.html").read_text(encoding="utf8")
    # A section runs from one <h2 to the next; its new inline pictures become one part.
    cuts = [m.start() for m in re.finditer(r"<h2[ >]", html)] + [len(html)]
    pieces, last = [], 0
    for cut in cuts:
        if cut > last:
            pieces.append(html[last:cut])
        last = cut
    (out / "parts").mkdir(parents=True, exist_ok=True)
    moved, written = 0, []
    for k, piece in enumerate(pieces):
        pics = [p for p in DATA_IMG.findall(piece) if p != BLANK]
        # Chunk a section's pictures so no part is much over CHUNK bytes.
        chunks, size = [[]], 0
        for pic in pics:
            if chunks[-1] and size + len(pic) > CHUNK:
                chunks.append([])
                size = 0
            chunks[-1].append(pic)
            size += len(pic)
        where = {}
        for chunk in filter(None, chunks):
            name = hashlib.sha256("".join(chunk).encode()).hexdigest()[:12]
            (out / "parts" / f"{name}.json").write_text(json.dumps(chunk), encoding="utf8")
            written.append(name)
            for i, pic in enumerate(chunk):
                where.setdefault(pic, (name, i))
        if where:
            pieces[k] = DATA_IMG.sub(lambda m: m.group(0) if m.group(1) not in where
                                     else 'src="%s" data-part="%s" data-i="%d"' % (BLANK, *where[m.group(1)]), piece)
            moved += len(pics)
    html = "".join(pieces)
    if LOADER_MARK not in html:
        html = html.replace("</body>", LOADER + "</body>") if "</body>" in html else html + LOADER
    if MODEL_FETCH in html:
        html = html.replace(MODEL_FETCH, MODEL_SRC)
    if "const MODELS =" not in html:
        html = html.replace("const cache = {}", MODELS_LINE + "const cache = {}", 1)
    (out / "index.html").write_text(html, encoding="utf8")
    print(f"index.html {len(html.encode()):,} bytes; moved {moved} pictures into {len(written)} new parts: {' '.join(written)}")


def stage(pack_dir, stage_dir, have=None):
    known = json.loads(Path(have).read_text()) if have and Path(have).exists() else {}
    out = Path(stage_dir)
    out.mkdir(parents=True, exist_ok=True)
    names = []
    for f in sorted(Path(pack_dir).glob("*.json")):
        if f.stem == "manifest" or f.stem in known:
            continue
        shutil.copyfile(f, out / f"{f.stem}.js")
        names.append(f.stem)
    print(f"staged {len(names)} packs in {out} (upload 25 a call)")


def manifest(results, into):
    path = Path(into)
    found = json.loads(path.read_text()) if path.exists() else {}
    hit = re.compile(r'([^/"\s]+)\.js"[^\n]*?"(/_blob/[0-9a-f]{32})"')
    added = 0
    for r in results:
        for name, url in hit.findall(Path(r).read_text(encoding="utf8")):
            added += found.get(name) != url
            found[name] = url
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(dict(sorted(found.items())), indent=0), encoding="utf8")
    print(f"{path}: {len(found)} packs, {added} new or changed")


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["split"] and len(a) == 3:
        split(a[1], a[2])
    elif a[:1] == ["stage"] and len(a) in (3, 5):
        stage(a[1], a[2], a[4] if len(a) == 5 else None)
    elif a[:1] == ["manifest"] and "--into" in a:
        i = a.index("--into")
        manifest(a[1:i], a[i + 1])
    else:
        sys.exit(__doc__)
