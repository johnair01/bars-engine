"""Seed the Workroom: the one WorkAdventure world Wendell draws in himself.

usage: python3 gen_workroom.py [--seed]

Writes tiles.png, workroom.tmj and workroom.wam here from workroom-language.json. Without --seed it refuses to
overwrite an existing workroom.tmj, because after the seed the client's map editor is the author and a regenerate
would eat the drawing (Wendell's answer C on wa-world-door-intake-1, 2026-11-23).
"""
import json, os, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
LANG = json.load(open(os.path.join(HERE, 'workroom-language.json')))
T = LANG['size']['tile']
W, H = LANG['size']['width'], LANG['size']['height']
TMJ = os.path.join(HERE, 'workroom.tmj')
WAM = os.path.join(HERE, 'workroom.wam')

# tileset: 1 plank floor, 2 stone wall, 3 table, 4 doorway, 5 chalk line
COLS = [(150, 118, 84), (104, 100, 104), (126, 86, 54), (74, 60, 50), (168, 140, 106)]


def tiles():
    img = Image.new('RGBA', (T * len(COLS), T), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i, c in enumerate(COLS):
        x = i * T
        d.rectangle((x, 0, x + T - 1, T - 1), fill=c + (255,))
        dark = tuple(max(0, v - 28) for v in c) + (255,)
        if i == 0:                                        # planks, with a seam every eight pixels
            for y in range(0, T, 8):
                d.line((x, y, x + T - 1, y), fill=dark)
        elif i == 1:                                      # stone courses, offset every other row
            for y in range(0, T, 10):
                d.line((x, y, x + T - 1, y), fill=dark)
                d.line((x + (0 if y % 20 else 16), y, x + (0 if y % 20 else 16), min(T - 1, y + 9)), fill=dark)
        elif i == 2:                                      # a table top with legs
            d.rectangle((x + 2, 6, x + T - 3, T - 7), fill=c + (255,), outline=dark)
            for lx in (x + 4, x + T - 6):
                d.line((lx, T - 7, lx, T - 2), fill=dark)
        elif i == 3:                                      # doorway: dark gap in the wall
            d.rectangle((x + 4, 0, x + T - 5, T - 1), fill=(30, 24, 20, 255))
        elif i == 4:                                      # chalk square on the floor
            d.rectangle((x, 0, x + T - 1, T - 1), fill=COLS[0] + (255,))
            d.rectangle((x + 1, 1, x + T - 2, T - 2), outline=(226, 222, 210, 190))
    img.save(os.path.join(HERE, 'tiles.png'))
    return img.size[0] // T


def layer(lid, name, data, props=None):
    L = {'id': lid, 'name': name, 'type': 'tilelayer', 'x': 0, 'y': 0, 'width': W, 'height': H,
         'opacity': 1, 'visible': True, 'data': data}
    if props:
        L['properties'] = props
    return L


def build(count):
    n = W * H
    ground = [1] * n
    coll = [0] * n
    over1 = [0] * n
    start = [0] * n
    door_x = W // 2

    for k in range(W):                                    # north and south walls
        ground[k] = 2
        coll[k] = 2
        ground[(H - 1) * W + k] = 2
        coll[(H - 1) * W + k] = 2
    for y in range(H):                                    # east and west walls
        for x in (0, W - 1):
            ground[y * W + x] = 2
            coll[y * W + x] = 2
    for dx in (0, 1):                                     # the doorway in the south wall, two tiles wide
        i = (H - 1) * W + door_x + dx
        ground[i] = 4
        coll[i] = 0

    for x in range(3, 3 + 8):                             # the workbench along the north wall
        i = 2 * W + x
        over1[i] = 3
        coll[i] = 3

    sx, sy = 4, 6                                         # the chalk stage: eight by six, bare floor
    for y in range(sy, sy + 6):
        for x in range(sx, sx + 8):
            ground[y * W + x] = 5

    start[(H - 3) * W + door_x] = 1                       # arrive just inside the door

    tileset = {'firstgid': 1, 'name': 'tiles', 'image': 'tiles.png', 'imagewidth': count * T,
               'imageheight': T, 'tilewidth': T, 'tileheight': T, 'tilecount': count, 'columns': count,
               'margin': 0, 'spacing': 0}
    exit_url = LANG['exits'][0]['url']
    objects = {'id': 40, 'name': 'objects', 'type': 'objectgroup', 'x': 0, 'y': 0, 'opacity': 1,
               'visible': True, 'draworder': 'topdown',
               'objects': [{'id': 1, 'name': 'door-south', 'type': 'area',
                            'x': door_x * T, 'y': (H - 1) * T, 'width': 2 * T, 'height': T,
                            'rotation': 0, 'visible': True,
                            'properties': [{'name': 'exitUrl', 'type': 'string', 'value': exit_url}]}]}
    return {'compressionlevel': -1, 'height': H, 'width': W, 'infinite': False,
            'orientation': 'orthogonal', 'renderorder': 'right-down', 'tiledversion': '1.10.2',
            'tileheight': T, 'tilewidth': T, 'type': 'map', 'version': '1.10',
            'nextobjectid': 2, 'nextlayerid': 50,
            'properties': [{'name': 'mapName', 'type': 'string', 'value': LANG['title']}],
            'tilesets': [tileset],
            'layers': [layer(1, 'ground', ground),
                       layer(2, 'collisions', coll, [{'name': 'collides', 'type': 'bool', 'value': True}]),
                       layer(3, 'floorLayer', [0] * n),
                       layer(4, 'over1', over1),
                       layer(5, 'start', start),
                       objects]}


def wam():
    return {'version': '1.0.0', 'mapUrl': 'workroom.tmj', 'areas': [], 'entities': {},
            'entityCollections': [], 'lastMigrationTimestamp': 0}


def main():
    seed = '--seed' in sys.argv[1:]
    if os.path.exists(TMJ) and not seed:
        print('workroom.tmj exists and the client owns it: rerun with --seed only to throw the drawing away')
        return 1
    count = tiles()
    json.dump(build(count), open(TMJ, 'w'), indent=1)
    if not os.path.exists(WAM):
        json.dump(wam(), open(WAM, 'w'), indent=1)
    print(f'wrote workroom.tmj ({W}x{H}) and kept workroom.wam')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
