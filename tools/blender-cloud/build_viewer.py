"""Build the Cloud Walker viewer: OUT_DIR/viewer.html plus OUT_DIR/model.json, a base64 copy of the GLB that the page fetches.
(Artifacts do not serve .glb files, so the model rides in a .json file.)

usage: python build_viewer.py scene.glb OUT_DIR --asset assets/Painted_Wooden_Chair_02.json [--allow-restricted]

--asset is the sidecar JSON that blenderkit_fetch.py wrote. Only CC0 models may sit in a published page: a Royalty
Free model must not be extractable by a third party (Blendkit terms, art. 5), and a GLB in a page is. The build
stops on any other licence unless --allow-restricted is given, which is for pages nobody else can open.
"""
import argparse, base64, html, json, pathlib, sys

ap = argparse.ArgumentParser()
ap.add_argument("glb")
ap.add_argument("out_dir")
ap.add_argument("--asset", action="append", default=[], help="sidecar JSON of each downloaded asset in the scene")
ap.add_argument("--allow-restricted", action="store_true")
a = ap.parse_args()

if not a.asset:
    sys.exit("STOP: pass --asset <sidecar.json> for every downloaded model in the scene, so the licence can be checked.")
infos = [json.loads(pathlib.Path(p).read_text()) for p in a.asset]
bad = [i for i in infos if i.get("license") != "cc_zero"]
if bad and not a.allow_restricted:
    sys.exit("STOP: " + ", ".join(f"{i['name']!r} is {i['license']}" for i in bad) +
             ". Only CC0 models may be embedded in a published page. Pick a CC0 asset: blenderkit_fetch.py searches CC0 by default.")

here = pathlib.Path(__file__).parent
out = pathlib.Path(a.out_dir)
out.mkdir(parents=True, exist_ok=True)
data = pathlib.Path(a.glb).read_bytes()
(out / "model.json").write_text(json.dumps({"mime": "model/gltf-binary", "encoding": "base64", "data": base64.b64encode(data).decode()}))
credit = " ".join(f"The {'chair' if 'chair' in i['name'].lower() else 'model'} is “{html.escape(i['name'])}” by "
                  f"{html.escape(i['author'].strip())} via Blendkit, CC0." for i in infos)
page = (here / "viewer_template.html").read_text().replace("@@MODEL@@", "model.json").replace("@@CREDIT@@", credit)
(out / "viewer.html").write_text(page)
print(out / "viewer.html", f"{len(page) / 1024:.0f} KB", "+ model.json", f"{(out / 'model.json').stat().st_size / 1048576:.2f} MB")
