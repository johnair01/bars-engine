"""Shared bits for the Blender pipeline tests (spec: .specify/specs/blender-pipeline-test/spec.md).

Each test module registers tests with @test and calls main(). main() runs the ids named on the command line (all when
none) and prints one JSON line per test: {"id", "status", "detail"}. status is pass, fail, gap (a known gap that still
fails), or skip. run.py collects the lines. Plain Python 3; test_bpy.py imports this under the bpy venv too.
"""
import hashlib, json, os, pathlib, shutil, struct, sys, tempfile, traceback

TESTS = pathlib.Path(__file__).resolve().parent
TOOLS = TESTS.parent
REPO = TOOLS.parent.parent
GAME = REPO / "content" / "ontology-game"
W = pathlib.Path(os.environ.get("W", "/tmp/blender-cloud"))

_registry = []


class Skip(Exception):
    pass


class Gap(Exception):
    """A failure that spec.md (or a board position) already names as a known gap. Reported, not failed."""


def test(tid, gap=False):
    """gap=True marks a known gap (spec.md): a failure is reported as gap and does not fail the run."""
    def wrap(fn):
        _registry.append((tid, gap, fn))
        return fn
    return wrap


def check(cond, msg):
    if not cond:
        raise AssertionError(msg)


def sha(path):
    return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()


def glb_json(path):
    b = pathlib.Path(path).read_bytes()
    n = struct.unpack("<I", b[12:16])[0]
    return json.loads(b[20:20 + n])


def tmpdir(name):
    W.mkdir(parents=True, exist_ok=True)
    return pathlib.Path(tempfile.mkdtemp(prefix=name + "-", dir=W))


def copy_tree(dest):
    """A copy of the parts of the repo the build scripts read and write, so a rebuild never touches the checkout."""
    for rel in ("tools/blender-cloud", "content/ontology-game/body", "content/ontology-game/cave"):
        shutil.copytree(REPO / rel, dest / rel, ignore=shutil.ignore_patterns("tests", "__pycache__", "*.pyc"))
    return dest


def main():
    want = set(sys.argv[1].split(",")) if len(sys.argv) > 1 and sys.argv[1] else None
    for tid, gap, fn in _registry:
        if want and tid not in want:
            continue
        try:
            detail = fn() or ""
            status = "pass"
            if gap:
                detail = ("known gap now passes, unmark it in the spec. " + detail).strip()
        except Skip as e:
            status, detail = "skip", str(e)
        except Gap as e:
            status, detail = "gap", str(e)
        except AssertionError as e:
            status, detail = ("gap" if gap else "fail"), str(e)
        except Exception as e:
            status = "gap" if gap else "fail"
            detail = f"{type(e).__name__}: {e} | " + traceback.format_exc(limit=2).replace("\n", " ")[-300:]
        print(json.dumps({"id": tid, "status": status, "detail": detail}), flush=True)


def glb_read(path):
    """(json, binary chunk) of a GLB."""
    b = pathlib.Path(path).read_bytes()
    n = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + n])
    rest = b[20 + n:]
    return j, rest[8:8 + struct.unpack("<I", rest[:4])[0]] if rest else b""


def accessor(j, bin_, i):
    """An accessor's values as a list of tuples (float and unsigned int component types, no sparse)."""
    a = j["accessors"][i]
    v = j["bufferViews"][a["bufferView"]]
    width = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}[a["type"]]
    fmt = {5126: "f", 5125: "I", 5123: "H", 5121: "B"}[a["componentType"]]
    size = struct.calcsize(fmt) * width
    stride = v.get("byteStride", size)
    start = v.get("byteOffset", 0) + a.get("byteOffset", 0)
    return [struct.unpack_from("<" + fmt * width, bin_, start + k * stride) for k in range(a["count"])]


def components(j, bin_, mesh_index):
    """Connected pieces of a mesh, joining vertices that share a position (flat shading splits them)."""
    parent = {}

    def find(x):
        while parent.setdefault(x, x) != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for prim in j["meshes"][mesh_index]["primitives"]:
        pos = [tuple(round(c, 5) for c in p) for p in accessor(j, bin_, prim["attributes"]["POSITION"])]
        idx = [t[0] for t in accessor(j, bin_, prim["indices"])]
        for k in range(0, len(idx), 3):
            a, b, c = (pos[i] for i in idx[k:k + 3])
            parent[find(b)] = find(a)
            parent[find(c)] = find(a)
    return len({find(x) for x in list(parent)})
