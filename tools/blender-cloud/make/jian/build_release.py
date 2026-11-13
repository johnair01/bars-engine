"""Build or verify the reusable Calrunian jian family in public assets.

  python3 tools/blender-cloud/make/jian/build_release.py
  python3 tools/blender-cloud/make/jian/build_release.py --check
"""
import argparse
import hashlib
import json
import shutil
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
PUBLIC = ROOT / "public/calrunia/weapons/jian"
NATIONS = ("Argyra", "Pyrakanth", "Lamenth", "Virelune", "Meridia")
SOURCES = ("base_jian.py", "transform_contract.py", "build_inventory.py", "asset_study.py", "build_release.py", "jian-identities.json",
           "evidence.json", "reference/met-27931.jpg")

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def glb_json(path):
    data = path.read_bytes()
    if data[:4] != b"glTF": raise ValueError(f"not GLB: {path}")
    length = struct.unpack_from("<I", data, 12)[0]
    return json.loads(data[20:20+length])

def validate_glb(path):
    data=glb_json(path)
    names={n.get("name") for n in data.get("nodes",[])}
    needed={"Blade","Guard","Grip","Pommel","GripSocket"}
    missing=needed-names
    if missing: raise ValueError(f"{path.name}: missing nodes {sorted(missing)}")
    if data.get("animations"): raise ValueError(f"{path.name}: unexpected animation")
    return {"nodes":len(data.get("nodes",[])),"meshes":len(data.get("meshes",[])),"grip_socket":True}

def build():
    PUBLIC.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="jian-release-") as temp:
        staging=Path(temp)
        cmd=[sys.executable,str(HERE/"asset_study.py"),"jian","--spec",str(HERE/"jian-identities.json"),"--output",str(staging)]
        subprocess.run(cmd,check=True)
        study=json.loads((staging/"manifest.json").read_text())
        if any(study["stage_status"].get(g)!="passed" for g in ("geometry","inventory_render","icon_blade_contrast")):
            raise RuntimeError("study gates did not pass")
        catalog={"schema":"calrunia.jian_assets.v1","family":"jian","status":"approved_design_study_available_for_game_use",
                 "gameplay_activation":"catalog_only","reference":"tools/blender-cloud/make/jian/evidence.json",
                 "transform_spec":"tools/blender-cloud/make/jian/jian-identities.json",
                 "coordinate_contract":{"source_blender_tip_axis":"+Z","glb_tip_axis":"+Y","grip_socket_node":"GripSocket",
                                        "attachment_note":"Attach the character hand to GripSocket; do not assume the GLB origin is the grip."},
                 "source_sha256":{name:digest(HERE/name) for name in SOURCES},"variants":{}}
        for nation in NATIONS:
            slug=nation.lower()
            model_src,icon_src=staging/(slug+".glb"),staging/(slug+".png")
            details=validate_glb(model_src)
            for source in (model_src,icon_src): shutil.copyfile(source,PUBLIC/source.name)
            catalog["variants"][slug]={"nation":nation,"model":"/calrunia/weapons/jian/"+slug+".glb",
                "inventory_icon":"/calrunia/weapons/jian/"+slug+".png",
                "model_sha256":digest(PUBLIC/model_src.name),"icon_sha256":digest(PUBLIC/icon_src.name),
                "triangles":study["checks"][nation]["total_triangles"],
                "blade_length_m":round(study["checks"][nation]["dimensions_m"]["blade"],4),
                "overall_length_m":round(study["checks"][nation]["dimensions_m"]["overall"],4),
                "blade_contrast_delta_96px":study["blade_contrast_delta_96px"][nation],"glb":details}
        (PUBLIC/"manifest.json").write_text(json.dumps(catalog,indent=2)+"\n")
        (HERE/"review/checks.json").write_text(json.dumps(study["checks"],indent=2)+"\n")
    check()
    print("Built",len(NATIONS),"jian variants in",PUBLIC)

def check():
    catalog=json.loads((PUBLIC/"manifest.json").read_text())
    if catalog.get("schema")!="calrunia.jian_assets.v1" or set(catalog["variants"])!={n.lower() for n in NATIONS}:
        raise ValueError("invalid jian catalog")
    for name,expected in catalog["source_sha256"].items():
        if digest(HERE/name)!=expected: raise ValueError(f"source changed since build: {name}")
    for slug,row in catalog["variants"].items():
        for role,key in (("model","model_sha256"),("inventory_icon","icon_sha256")):
            path=ROOT/"public"/row[role].lstrip("/")
            # URLs include /calrunia; public is the filesystem root.
            if not path.is_file() or digest(path)!=row[key]: raise ValueError(f"missing or stale {slug} {role}")
        validate_glb(ROOT/"public"/row["model"].lstrip("/"))
        if row["triangles"]>1500 or row["blade_contrast_delta_96px"]<25:
            raise ValueError(f"{slug}: budget or icon gate failed")
    print("Verified",len(catalog["variants"]),"jian variants")

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--check",action="store_true")
    args=parser.parse_args()
    check() if args.check else build()
