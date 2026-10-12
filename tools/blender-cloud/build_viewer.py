"""Embed a GLB into viewer_template.html -> one self-contained HTML page.
usage: python build_viewer.py scene.glb cloud-walker.html
"""
import base64, pathlib, sys

here = pathlib.Path(__file__).parent
glb = base64.b64encode(pathlib.Path(sys.argv[1]).read_bytes()).decode()
html = (here / "viewer_template.html").read_text().replace("@@GLB@@", glb)
pathlib.Path(sys.argv[2]).write_text(html)
print(sys.argv[2], f"{len(html) / 1048576:.1f} MB")
