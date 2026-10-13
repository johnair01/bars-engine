"""G7's stand-in for the network: runs blenderkit_fetch.main() with urllib.request.urlopen replaced by a stub that
answers for both hosts and records every request's URL and headers to argv[1]. No socket is opened.

usage: python3 _g7_driver.py RECORD.json -- <blenderkit_fetch.py arguments>
"""
import importlib.util, io, json, pathlib, sys, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
record_path = pathlib.Path(sys.argv[1])
sys.argv = ["blenderkit_fetch.py", *sys.argv[sys.argv.index("--") + 1:]]
seen = []
API = "https://api.blenderkit.com/api/v1"
ASSET = "https://assets.blenderkit.com/files/stub.glb"


class Reply(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def stub(req, timeout=None, context=None):
    url = req.full_url
    seen.append({"url": url, "headers": {k.lower(): v for k, v in req.header_items()}})
    record_path.write_text(json.dumps(seen))
    if url.startswith(API + "/search/"):
        return Reply(json.dumps({"results": [{
            "isFree": True, "name": "Stub Chair", "author": {"fullName": "Stub"}, "license": "cc_zero", "id": "id-1",
            "assetBaseId": "base-1", "files": [{"fileType": "gltf", "downloadUrl": API + "/downloads/1/"}]}]}).encode())
    if url.startswith(API + "/downloads/"):
        return Reply(json.dumps({"filePath": ASSET}).encode())
    if url.startswith(ASSET):
        return Reply(b"glTF stub bytes")
    raise AssertionError(f"unexpected URL {url}")


urllib.request.urlopen = stub
spec = importlib.util.spec_from_file_location("blenderkit_fetch", HERE.parent / "blenderkit_fetch.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
mod.main()
