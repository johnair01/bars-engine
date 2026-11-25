"""The asset half of the five map rules: does this map's art fit the world it belongs to?

usage: python3 check_assets.py <map dir> [--lang dojo-language.json]
       python3 check_assets.py --woka sprites/monk-woka.png [...]
       (generators call check_map(), check_language(), check_woka() directly, before writing)

The rules are written out in docs/WA_ASSET_CONTRACT.md. What is checked here is the part a machine can
settle: grid, sheet geometry, embedded tilesets, tile ranges, woka frame layout, and that art carries a
licence. What is not checked here is style — a palette that reads as the dojo, a room that feels like a
room. Those are review, and saying so is part of the contract.

No Pillow: a PNG's size is two integers at a fixed offset, and this has to run in CI wherever Python is.
"""
import json
import os
import struct
import sys

PNG_SIG = b"\x89PNG\r\n\x1a\n"
# Tiled packs three flags into the high bits of a gid; the tile number is the rest.
GID_MASK = 0x0FFFFFFF
WOKA_W, WOKA_H, WOKA_FRAMES, WOKA_FACINGS = 96, 128, 3, 4


def png_size(path):
    """(width, height) of a PNG, or raise ValueError if it is not one."""
    with open(path, "rb") as f:
        head = f.read(33)
    if len(head) < 24 or head[:8] != PNG_SIG:
        raise ValueError("not a PNG")
    if head[12:16] != b"IHDR":
        raise ValueError("first chunk is not IHDR")
    return struct.unpack(">II", head[16:24])


def find_licence(root):
    """The first licence file under root, or None. Art without a licence cannot ship."""
    for dirpath, dirnames, filenames in os.walk(root):
        if os.path.relpath(dirpath, root).count(os.sep) > 1:
            dirnames[:] = []
            continue
        for name in sorted(filenames):
            if name.upper().startswith("LICENSE") or name.upper().startswith("COPYING"):
                return os.path.join(dirpath, name)
    return None


def check_language(lang, root):
    """The sheets a design language names: on disk, PNG, usable, and under a licence.

    Strings beginning "note:" are not failures. A pack's source sheet often has a bleed of a few pixels past
    its last whole cell (TilesetFloor.png is 352x417): the generator crops to whole cells, so the source is
    usable and the note is there to be printed, not to stop a build. The strict grid rule is enforced on the
    drawn-up sheets the map actually loads, in check_map()."""
    errs = []
    src_px = lang.get("src_px", 32)
    if not lang.get("sheets"):
        errs.append("the language names no sheets: there is nothing to draw a map out of")
    for name, rel in (lang.get("sheets") or {}).items():
        path = os.path.join(root, rel)
        if not os.path.isfile(path):
            errs.append(f'sheet "{name}" points at {rel}, which is not there')
            continue
        try:
            w, h = png_size(path)
        except ValueError as error:
            errs.append(f'sheet "{name}" ({rel}) cannot be read as a PNG: {error}')
            continue
        if w < src_px or h < src_px:
            errs.append(f'sheet "{name}" ({rel}) is {w}x{h}: smaller than one {src_px} px cell')
        elif w % src_px or h % src_px:
            errs.append(f'note: sheet "{name}" ({rel}) is {w}x{h}, so its last column/row is a partial cell; '
                        f'the generator crops to {w // src_px}x{h // src_px}')
    if not find_licence(root):
        errs.append(f"no LICENSE* file under {root}: every sheet has to say where it came from and under what licence")
    return errs


def check_map(tmj, map_dir):
    """The art a map actually references: embedded tilesets on the map's own grid, gids inside them."""
    errs = []
    tw, th = tmj.get("tilewidth"), tmj.get("tileheight")
    if tw != th:
        errs.append(f"map tiles are {tw}x{th}: only square tiles line up with a whole-tile grid")
    for ts in tmj.get("tilesets") or []:
        label = ts.get("name") or ts.get("firstgid")
        if ts.get("source"):
            errs.append(f'tileset "{label}" is external ({ts["source"]}): WorkAdventure loads embedded tilesets only')
            continue
        image = ts.get("image")
        if not image:
            errs.append(f'tileset "{label}" has no image: a tileset with no art is a hole in the map')
            continue
        path = os.path.join(map_dir, image)
        if not os.path.isfile(path):
            errs.append(f'tileset "{label}" is drawn from {image}, which is not beside the map')
            continue
        try:
            w, h = png_size(path)
        except ValueError as error:
            errs.append(f'tileset "{label}" image {image} cannot be read as a PNG: {error}')
            continue
        colw, colh = ts.get("tilewidth"), ts.get("tileheight")
        if colw != tw or colh != th:
            errs.append(f'tileset "{label}" tiles are {colw}x{colh}, the map is {tw}x{th}: the art would not line up')
        if not colw or not colh:
            continue
        if w % colw or h % colh:
            errs.append(f'tileset "{label}" image {image} is {w}x{h}, not a whole number of {colw}x{colh} tiles')
            continue
        columns = ts.get("columns")
        if columns != w // colw:
            errs.append(f'tileset "{label}" says {columns} columns, its image is {w // colw} tiles wide')
        count = ts.get("tilecount")
        if count is not None and count > (w // colw) * (h // colh):
            errs.append(f'tileset "{label}" claims {count} tiles, its image holds {(w // colw) * (h // colh)}')
    ranges = [(ts.get("firstgid") or 1, ts.get("tilecount")) for ts in tmj.get("tilesets") or [] if ts.get("tilecount")]
    for layer in tmj.get("layers") or []:
        data = layer.get("data")
        if not data:
            continue
        for gid in set(data):
            gid &= GID_MASK
            if gid == 0:
                continue
            if not any(lo <= gid < lo + n for lo, n in ranges):
                errs.append(f'layer "{layer.get("name")}" uses tile {gid}, which no tileset in this map provides')
                break
    return errs


def check_woka(paths):
    """Walkers are a fixed layout: 3 frames across, 4 facings down, left, right, up."""
    errs = []
    for path in paths:
        if not os.path.isfile(path):
            errs.append(f"{path} is missing: the map names a walker that does not exist")
            continue
        try:
            w, h = png_size(path)
        except ValueError as error:
            errs.append(f"{path} cannot be read as a PNG: {error}")
            continue
        if (w, h) != (WOKA_W, WOKA_H):
            errs.append(f"{os.path.basename(path)} is {w}x{h}: WorkAdventure walkers are {WOKA_W}x{WOKA_H} "
                        f"({WOKA_FRAMES} frames x {WOKA_FACINGS} facings, 32 px each)")
    return errs


def fatal(errs):
    """Errors that must stop a build: everything except the notes check_language() prints."""
    return [e for e in errs if not e.startswith("note:")]


def run_all(map_dir, lang=None):
    """Everything above, for one map directory."""
    errs = []
    if lang:
        errs += check_language(lang, map_dir)
    tmj_path = None
    for name in sorted(os.listdir(map_dir)) if os.path.isdir(map_dir) else []:
        if name.startswith("._") or name.startswith("."):
            continue  # AppleDouble and other shadow files are not maps
        if name.endswith(".tmj"):
            tmj_path = os.path.join(map_dir, name)
            break
    if tmj_path:
        with open(tmj_path) as f:
            errs += check_map(json.load(f), map_dir)
    else:
        errs.append(f"no .tmj in {map_dir}: nothing to check the art against")
    wokas = []
    sprites = os.path.join(map_dir, "sprites")
    if os.path.isdir(sprites):
        wokas = [os.path.join(sprites, n) for n in sorted(os.listdir(sprites)) if n.endswith(".png")]
    if wokas:
        errs += check_woka(wokas)
    return errs


def main(argv):
    if not argv:
        print(__doc__.strip())
        return 2
    errs = []
    if argv[0] == "--woka":
        errs = check_woka([a for a in argv[1:] if not a.startswith("--")])
    else:
        map_dir = os.path.abspath(argv[0])
        lang = None
        if "--lang" in argv:
            with open(os.path.join(map_dir, argv[argv.index("--lang") + 1])) as f:
                lang = json.load(f)
        errs = run_all(map_dir, lang)
    notes = [e for e in errs if e.startswith("note:")]
    errs = [e for e in errs if not e.startswith("note:")]
    for note in notes:
        print(" ", note)
    if errs:
        print("ASSET CONTRACT FAILED:")
        for e in errs:
            print(" -", e)
        return 1
    print("asset contract: ok")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
