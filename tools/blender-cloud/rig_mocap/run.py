"""Rig a character.py figure with Rigify and walk it with a CMU mocap clip: the "rig + mocap" step.

usage: python tools/blender-cloud/rig_mocap/run.py FIGURE.glb CLIP.bvh OUTDIR [--keep-steps]

Run it with the bpy venv's Python (README). It strips the figure's own armature, builds a Rigify rig fitted to the
figure's joints (fitmeta.py holds the landmark table of content/ontology-game/cave/character.py figures), binds the
mesh, makes the game skeleton, runs rig_check, and retargets the clip with retarget.py (cycle found by pose
matching, head and torso levelled). Writes OUTDIR/mocap.blend (action MocapWalk) and OUTDIR/rig_mocap.json.
Every step is a subprocess, so a failure names the step. The CMU BVH is not stored in the repo (licence: README)."""
import json, pathlib, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
SKILL = HERE.parent / "skill_run.py"
PY = sys.executable


def sh(label, args):
    r = subprocess.run([PY, *map(str, args)], capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"{label} exited {r.returncode}: {(r.stdout + r.stderr)[-600:]}")
    line = next((l for l in r.stdout.splitlines() if l.startswith("@@JSON@@")), None)
    out = json.loads(line[8:]) if line else {}
    if out.get("ok") is False:
        sys.exit(f"{label} failed: {line[:400]}")
    return r, out


def main():
    pos = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(pos) != 3:
        sys.exit(__doc__)
    glb, bvh, out = (pathlib.Path(p).resolve() for p in pos)
    out.mkdir(parents=True, exist_ok=True)
    b = lambda n: out / f"{n}.blend"
    sh("strip", [HERE / "strip.py", "--", glb, b("mesh")])
    sh("rigify add+fit", [SKILL, "blender-character-rigging/rigify_build.py", "--blend", b("mesh"), "--", "--add", "basic_human",
                          "--fit", "Figure", "--no-face", "--generate", "--save", b("rigged")])
    sh("fitmeta", [HERE / "fitmeta.py", "--", b("rigged"), b("meta")])
    sh("rigify generate", [SKILL, "blender-character-rigging/rigify_build.py", "--blend", b("meta"), "--", "--metarig",
                           "META_Figure", "--generate", "--save", b("rig2")])
    sh("bind", [SKILL, "blender-character-rigging/bind_mesh.py", "--blend", b("rig2"), "--", "--armature", "RIG_Figure",
                "--meshes", "Figure", "--save", b("bound")])
    sh("game skeleton", [SKILL, "blender-character-rigging/rigify_build.py", "--blend", b("bound"), "--", "--rig",
                         "RIG_Figure", "--game-skeleton", "--save", b("game")])
    _, rc = sh("rig_check", [SKILL, "blender-character-rigging/rig_check.py", "--blend", b("game"), "--", "--armature",
                             "GAME_RIG_Figure", "--meshes", "Figure", "--profile", "game"])
    if not rc.get("pass"):
        sys.exit(f"rig_check errors: {rc.get('errors')}")
    sh("retarget", [HERE / "retarget.py", "--", b("game"), bvh, b("mocap")])
    _, chk = sh("check", [HERE / "check.py", "--", b("mocap")])
    chk["rig_check_warnings"] = rc.get("warnings", [])
    (out / "rig_mocap.json").write_text(json.dumps(chk, indent=1))
    print(json.dumps(chk))


if __name__ == "__main__":
    main()
