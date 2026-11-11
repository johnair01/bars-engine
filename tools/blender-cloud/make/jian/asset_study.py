"""One-command, portable transform and check packet for the first two asset classes.

Examples:
  python3 asset_study.py jian --spec jian-identities-v2.json --output inventory-v2
  python3 asset_study.py gourd --spec gourd-variants.json --output gourd-study
"""
import argparse
import hashlib
import json
import shutil
import struct
import subprocess
import statistics
from datetime import datetime, timezone
from pathlib import Path

from transform_contract import compile_gourd, compile_jian

HERE = Path(__file__).resolve().parent
NATIONS = ("Argyra", "Pyrakanth", "Lamenth", "Virelune", "Meridia")

def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def command(args):
    subprocess.run(args, check=True)

def blade_contrast_96px(path):
    raw=subprocess.check_output([shutil.which("ffmpeg") or "ffmpeg","-loglevel","error","-i",str(path),
                                 "-vf","scale=72:96:flags=area","-f","rawvideo","-pix_fmt","rgb24","pipe:1"])
    if len(raw)!=72*96*3: raise RuntimeError(f"unexpected review render dimensions: {path}")
    def luminance(x,y):
        i=(y*72+x)*3;r,g,b=raw[i:i+3]
        return .2126*r+.7152*g+.0722*b
    return round(statistics.median(luminance(36,y) for y in range(16,60))-
                 statistics.median(luminance(6,y) for y in range(16,60)),1)

def attach_captures(result, directory):
    directory=directory.resolve()
    names=list(result["glbs"]) if result["kind"]=="jian" else list(result["variants"])
    captures={}
    for name in names:
        hits=sorted(directory.glob(f"{result['kind']}-{name.lower()}-fire-*.png"))
        if len(hits)!=1: raise ValueError(f"expected one fire capture for {name}, found {len(hits)}")
        path=hits[0]; data=path.read_bytes()
        if not data.startswith(b"\x89PNG\r\n\x1a\n") or len(data)<24: raise ValueError(f"invalid PNG: {path}")
        width,height=struct.unpack(">II",data[16:24])
        if width<320 or height<320: raise ValueError(f"capture too small: {path}")
        captures[name]={"path":str(path),"sha256":hashlib.sha256(data).hexdigest(),"pixels":[width,height]}
    if len({tuple(v["pixels"]) for v in captures.values()})!=1: raise ValueError("captures use different sizes")
    if len({v["sha256"] for v in captures.values()})!=len(captures): raise ValueError("captures are byte-identical; check for stale preview")
    result["captures"]=captures
    result["stage_status"]["scene_render"]="captured_distinct_images"

def study_jian(spec, output):
    compiled = compile_jian(spec)
    if set(compiled["variants"]) != set(NATIONS):
        raise ValueError("jian packet must cover the five named nations")
    output.mkdir(parents=True, exist_ok=True)
    for stale in ("checks.json", "contact-sheet.png", "manifest.json"):
        (output/stale).unlink(missing_ok=True)
    (output / "compiled.json").write_text(json.dumps(compiled,indent=2))
    command([shutil.which("blender") or "blender", "-b", "-t", "2", "--python", str(HERE / "build_inventory.py"), "--", "--spec", str(spec), "--output", str(output)])
    if not (output/"checks.json").is_file(): raise RuntimeError("Blender did not finish the geometry gate; no fresh checks.json")
    files = [output / (n.lower()+".png") for n in NATIONS]
    if not all(p.is_file() for p in files): raise RuntimeError("missing inventory render")
    contrast={n:blade_contrast_96px(output/(n.lower()+".png")) for n in NATIONS}
    if any(value<25 for value in contrast.values()): raise RuntimeError(f"blade contrast below 25/255 at 96px: {contrast}")
    cmd=[shutil.which("ffmpeg") or "ffmpeg","-y","-loglevel","error"]
    for path in files: cmd += ["-i",str(path)]
    cmd += ["-filter_complex","hstack=inputs=5","-frames:v","1",str(output/"contact-sheet.png")]
    command(cmd)
    checks=json.loads((output/"checks.json").read_text())
    return {"kind":"jian","compiled":str(output/"compiled.json"),"checks":checks,
            "blade_contrast_delta_96px":contrast,
            "inventory_views":{n:str(output/(n.lower()+".png")) for n in NATIONS},
            "glbs":{n:str(output/(n.lower()+".glb")) for n in NATIONS},
            "contact_sheet":str(output/"contact-sheet.png"),
            "stage_status":{"geometry":"passed","inventory_render":"passed","icon_blade_contrast":"passed","game_scene":"requires_capture","blind_identity":"requires_evaluation"}}

def study_gourd(spec, output):
    compiled=compile_gourd(spec)
    output.mkdir(parents=True, exist_ok=True)
    (output/"compiled.json").write_text(json.dumps(compiled,indent=2))
    return {"kind":"gourd","compiled":str(output/"compiled.json"),"variants":list(compiled["variants"]),
            "stage_status":{"typed_parameters":"passed","dependent_clearance_rule":"required_by_compiler",
                            "game_robe_clearance":"requires_scene_check","scene_render":"requires_capture","blind_identity":"requires_evaluation"}}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("kind",choices=["jian","gourd"])
    p.add_argument("--spec",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True)
    p.add_argument("--scene-captures",type=Path)
    a=p.parse_args()
    spec=a.spec.resolve();out=a.output.resolve()
    result=(study_jian if a.kind=="jian" else study_gourd)(spec,out)
    if a.scene_captures: attach_captures(result,a.scene_captures)
    result.update({"schema":"calrunia.asset_study.v0","generated_utc":datetime.now(timezone.utc).isoformat(),
                   "input_spec":str(spec),"input_sha256":sha256(spec)})
    (out/"manifest.json").write_text(json.dumps(result,indent=2))
    print(json.dumps({"manifest":str(out/"manifest.json"),"stage_status":result["stage_status"]},indent=2))

if __name__=="__main__":main()
