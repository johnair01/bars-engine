"""Generate the Calrunian Dojo map for the WorkAdventure world from the design language.
usage: python3 gen_dojo.py [--seed N] [--out DIR] [--lit 1,3] [--frame 0-3]   (--lit and --frame only change render.png)
Reads dojo-language.json (named pieces, fills and walkable-scale rules) and writes, into DIR (default: here):
  tiles/*.png        each source sheet drawn up to 32 px tiles (nearest neighbour)
  calrunian-dojo.tmj one orthogonal 32 px map: ground, detail, collisions, floorLayer, over1, over2, start, areas
  sprites/*-woka.png walker sheets (96x128, 3 frames x 4 facings) for Master Yun and a monk student
  render.png         the whole map drawn as the player would see it, with a walker at the gate
The layout code places names from the language, never raw tile numbers, and checks itself before writing:
every place a player must reach is reachable from the gate, and doors and corridors keep the rule widths."""
import json, os, sys, random, colorsys
from collections import deque
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))          # public/wa: the rules every map here must keep
from wa_export import apply as wa_apply, check as wa_check, check_exits as wa_exits  # noqa: E402
from check_assets import check_language as assets_language, check_map as assets_map, check_woka as assets_woka, fatal as assets_fatal  # noqa: E402
args = sys.argv[1:]
SEED = int(args[args.index('--seed') + 1]) if '--seed' in args else 7
OUT = args[args.index('--out') + 1] if '--out' in args else HERE
LANG = json.load(open(os.path.join(HERE, 'dojo-language.json')))
# The dojo is owned by the map editor (dojo-language.json says "owner": "editor"), so this generator is a
# seeder: the map in map-storage is the truth, and rewriting calrunian-dojo.tmj here would silently throw
# away every room someone drew in the client. Re-seed deliberately, into a scratch directory, or pass --force.
if LANG.get('owner') == 'editor' and '--force' not in args and os.path.abspath(OUT) == os.path.abspath(HERE):
    print(f"{HERE}/calrunian-dojo.tmj is owned by the map editor (see dojo-language.json).")
    print("This generator would overwrite it. Seed into a scratch directory instead:")
    print(f"  python3 gen_dojo.py --seed {SEED} --out /tmp/dojo-seed")
    print("or pass --force to overwrite the editor's map on purpose.")
    sys.exit(2)
SP, K = LANG['src_px'], LANG['scale']
T = SP * K
W, H = 44, 36
rnd = random.Random(SEED)
os.makedirs(os.path.join(OUT, 'tiles'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'sprites'), exist_ok=True)


def hex_rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# ---- sheets: draw up to 32 px, apply recolours, register as Tiled tilesets ----
sheets, tilesets, firstgid = {}, [], 1
for name, rel in LANG['sheets'].items():
    im = Image.open(os.path.join(HERE, rel)).convert('RGBA')
    im = im.crop((0, 0, im.width // SP * SP, im.height // SP * SP))
    big = im.resize((im.width * K, im.height * K), Image.NEAREST)
    for rc in LANG['recolor'].values():
        if not isinstance(rc, dict) or rc.get('sheet') != name: continue
        th = colorsys.rgb_to_hsv(*[c / 255 for c in hex_rgb(rc['hue_to'])])[0]
        box = (rc['x'] * T, rc['y'] * T, (rc['x'] + rc['w']) * T, (rc['y'] + rc['h']) * T)
        px = big.load()
        for y in range(box[1], box[3]):
            for x in range(box[0], box[2]):
                r, g, b, a = px[x, y]
                h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
                if a and s > 0.25 and 0.65 < h < 0.95:   # violet and magenta only
                    r2, g2, b2 = colorsys.hsv_to_rgb(th, min(1, s), v * 0.8)
                    px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    fn = f'tiles/{name}.png'
    big.save(os.path.join(OUT, fn))
    cols, rows = big.width // T, big.height // T
    sheets[name] = {'gid0': firstgid, 'cols': cols, 'img': big}
    tilesets.append({'firstgid': firstgid, 'name': name, 'image': fn, 'imagewidth': big.width, 'imageheight': big.height,
                     'tilewidth': T, 'tileheight': T, 'tilecount': cols * rows, 'columns': cols, 'margin': 0, 'spacing': 0})
    firstgid += cols * rows


# ---- derived sheet "lit": light drawn as animation, 4 frames each (Tiled tile animation, which WorkAdventure plays) ----
# the paper lantern at the gate (flame flickers, glow breathes over 3x3 tiles), and for each stance banner a lit
# version whose gold halo pulses, with a pulsing pool on the standing square. Lantern gold, as the notices carry.
FH = LANG['first_hour']
GOLD = hex_rgb(FH['gold'])
NF, DUR = 4, FH['frame_ms']
tiles_lit, anim_lit = [], {}          # tile images in sheet order; first-frame index -> frame indices


def add_frames(frames):
    first = len(tiles_lit); tiles_lit.extend(frames); anim_lit[first] = list(range(first, first + len(frames))); return first


def px16(rows):
    """16x16 art from {(x,y): colour}, drawn up 2x with nearest neighbour as the contract asks."""
    im = Image.new('RGBA', (SP, SP), (0, 0, 0, 0)); p = im.load()
    for (x, y), c in rows.items(): p[x, y] = c + (255,)
    return im.resize((T, T), Image.NEAREST)


OUTL, CAP, WOOD, RED = (70, 36, 18), (150, 60, 30), (110, 60, 30), (190, 50, 40)
BODY_ROWS = {4: (5, 10), 5: (4, 11), 6: (3, 12), 7: (3, 12), 8: (3, 12), 9: (3, 12), 10: (4, 11), 11: (5, 10)}
CORES = [(6, 9, 6, 9), (6, 9, 6, 8), (6, 9, 7, 9), (7, 9, 6, 9)]       # core x0,x1,y0,y1 per frame: the flame moves
FILLS = [((255, 190, 70), (255, 238, 170)), ((250, 175, 60), (255, 228, 150)), ((255, 196, 80), (255, 244, 185)), ((246, 170, 56), (255, 232, 160))]


def lantern_head(f):
    d = {}
    for x, y in ((7, 0), (8, 0), (7, 1), (8, 1)): d[(x, y)] = OUTL
    for y in (2, 3):
        for x in range(4, 12): d[(x, y)] = OUTL if (y == 2 or x in (4, 11)) else CAP
    mid, core = FILLS[f]
    for y, (x0, x1) in BODY_ROWS.items():
        for x in range(x0, x1 + 1):
            edge = x in (x0, x1) or y in (4, 11)
            d[(x, y)] = OUTL if edge else mid
    cx0, cx1, cy0, cy1 = CORES[f]
    for y in range(cy0, cy1 + 1):
        for x in range(cx0, cx1 + 1): d[(x, y)] = core
    for y in (12, 13):
        for x in range(4, 12): d[(x, y)] = OUTL if (y == 13 or x in (4, 11)) else CAP
    for y in (14, 15): d[(7, y)] = RED; d[(8, y)] = RED
    return px16(d)


def lantern_post():
    d = {}
    for y in range(0, 14):
        d[(7, y)] = OUTL; d[(8, y)] = WOOD
    for y in (13, 14, 15):
        for x in range(4, 12): d[(x, y)] = OUTL if (y == 15 or x in (4, 11)) else WOOD
    return px16(d)


def pulse(f, lo, hi):
    return int(lo + (hi - lo) * (0.5 + 0.5 * __import__('math').sin(2 * 3.14159 * f / NF)))


def lit_banner(tile, k):
    px = tile.load(); out = Image.new('RGBA', tile.size, (0, 0, 0, 0)); o = out.load()
    for y in range(tile.height):
        for x in range(tile.width):
            if px[x, y][3]: continue
            if any(0 <= x + dx < tile.width and 0 <= y + dy < tile.height and px[x + dx, y + dy][3]
                   for dx in (-2, -1, 0, 1, 2) for dy in (-2, -1, 0, 1, 2)): o[x, y] = GOLD + (k,)
    for y in range(tile.height):
        for x in range(tile.width):
            r, g, b, a = px[x, y]
            if a: o[x, y] = (min(255, int(r * 1.15 + 25)), min(255, int(g * 1.1 + 15)), min(255, int(b * 0.9)), a)
    return out


def pool(k):
    im = Image.new('RGBA', (T, T), (0, 0, 0, 0)); pp = im.load()
    for y in range(T):
        for x in range(T):
            dd = ((x - T / 2) ** 2 + ((y - T / 2) * 1.5) ** 2) ** 0.5
            if dd < T * 0.47: pp[x, y] = GOLD + (int(k * (1 - dd / (T * 0.47))) + 40,)
    return im


def glow_tiles(f):
    amp = (215, 255, 175, 240)[f]; R = 1.5 * T
    big = Image.new('RGBA', (3 * T, 3 * T), (0, 0, 0, 0)); gp = big.load()
    for y in range(3 * T):
        for x in range(3 * T):
            dd = ((x - 1.5 * T) ** 2 + (y - 1.5 * T) ** 2) ** 0.5
            if dd < R: gp[x, y] = GOLD + (int(amp * (1 - dd / R) ** 1.1),)
    return [big.crop((cx * T, cy * T, cx * T + T, cy * T + T)) for cy in range(3) for cx in range(3)]


FIRST = {}
FIRST['lantern_head'] = add_frames([lantern_head(f) for f in range(NF)])
FIRST['lantern_post'] = len(tiles_lit); tiles_lit.append(lantern_post())
gl = [glow_tiles(f) for f in range(NF)]
FIRST['glow'] = [add_frames([gl[f][i] for f in range(NF)]) for i in range(9)]
for k in range(6):
    for r in range(2):
        src = sheets['house']['img'].crop(((22 + k) * T, (20 + r) * T, (23 + k) * T, (21 + r) * T))
        FIRST[('banner', k, r)] = add_frames([lit_banner(src, (210, 140, 80, 140)[f]) for f in range(NF)])
FIRST['pool'] = add_frames([pool((170, 120, 70, 120)[f]) for f in range(NF)])
LITCOLS = 12
lit_im = Image.new('RGBA', (LITCOLS * T, -(-len(tiles_lit) // LITCOLS) * T), (0, 0, 0, 0))
for i, t in enumerate(tiles_lit): lit_im.alpha_composite(t, ((i % LITCOLS) * T, (i // LITCOLS) * T))
lit_im.save(os.path.join(OUT, 'tiles/lit.png'))
tilesets.append({'firstgid': firstgid, 'name': 'lit', 'image': 'tiles/lit.png', 'imagewidth': lit_im.width, 'imageheight': lit_im.height,
                 'tilewidth': T, 'tileheight': T, 'tilecount': LITCOLS * (lit_im.height // T), 'columns': LITCOLS, 'margin': 0, 'spacing': 0,
                 'tiles': [{'id': i, 'animation': [{'tileid': j, 'duration': DUR} for j in js]} for i, js in anim_lit.items()]})
sheets['lit'] = {'gid0': firstgid, 'cols': LITCOLS, 'img': lit_im}
firstgid += LITCOLS * (lit_im.height // T)
LG = lambda i: sheets['lit']['gid0'] + i


def gid(sheet, x, y):
    s = sheets[sheet]; return s['gid0'] + y * s['cols'] + x


# ---- layers ----
N = W * H
L = {n: [0] * N for n in ('ground', 'detail', 'collisions', 'floorLayer', 'glow', 'over1', 'over2', 'start')}
taken = [False] * N
I = lambda x, y: y * W + x
COLL = gid('wall', 2, 2)  # any non-zero tile marks a blocked square; the layer is hidden in play


def block(x, y): L['collisions'][I(x, y)] = COLL


def fill_grass(x0, y0, x1, y1):
    f = LANG['fills']['grass']
    for y in range(y0, y1):
        for x in range(x0, x1):
            L['ground'][I(x, y)] = gid(f['sheet'], *rnd.choice(f['tiles']))


def fill_grid4(name, x0, y0, x1, y1, layer='ground'):
    f = LANG['fills'][name]; bx, by = f['grid4']
    for y in range(y0, y1):
        for x in range(x0, x1):
            px, py = (x - x0) % 4, (y - y0) % 4
            L[layer][I(x, y)] = gid(f['sheet'], bx + min(px, 3), by + min(py, 3))


def nine(name, x0, y0, x1, y1, gaps=()):
    """Wall ring on the outer edge of [x0,x1)x[y0,y1); gaps are (x,y) squares left open as doors."""
    n = LANG['fills'][name]['nine']; sh = LANG['fills'][name]['sheet']
    for y in range(y0, y1):
        for x in range(x0, x1):
            edge = x in (x0, x1 - 1) or y in (y0, y1 - 1)
            if not edge or (x, y) in gaps: continue
            k = ('t' if y == y0 else 'b' if y == y1 - 1 else '') + ('l' if x == x0 else 'r' if x == x1 - 1 else '')
            L['detail'][I(x, y)] = gid(sh, *n[k]); block(x, y); taken[I(x, y)] = True


def can_stamp(name, x, y, pad=0):
    s = LANG['stamps'][name]
    for dy in range(-pad, s['h'] + pad):
        for dx in range(-pad, s['w'] + pad):
            xx, yy = x + dx, y + dy
            if not (0 <= xx < W and 0 <= yy < H) or taken[I(xx, yy)]: return False
    return True


def stamp(name, x, y):
    s = LANG['stamps'][name]
    for dy in range(s['h']):
        for dx in range(s['w']):
            i = I(x + dx, y + dy); g = gid(s['sheet'], s['x'] + dx, s['y'] + dy); taken[i] = True
            if dy < s.get('over_rows', 0):
                L['over1'][i] = g
            else:
                L['detail'][i] = g
                if s.get('collide', True): block(x + dx, y + dy)


# ---- the plan ----
DOJO = (10, 3, 34, 18)        # wall ring x0,y0,x1,y1 (exclusive)
DOOR = [(x, 17) for x in range(20, 24)]
COURT = (8, 19, 36, 27)
GATE_X = (20, 24)
fill_grass(0, 0, W, H)
# keep-clear zones (paths, courtyard, dojo) are marked taken so scatter avoids them
fill_grid4('paving', COURT[0], COURT[1], COURT[2], COURT[3])
fill_grid4('paving', GATE_X[0], COURT[3], GATE_X[1], H)
fill_grid4('paving', 20, 17, 24, 19)
for y in range(COURT[1] - 1, H):
    for x in range(COURT[0], COURT[2]):
        if y < COURT[3] or GATE_X[0] - 1 <= x <= GATE_X[1]: taken[I(x, y)] = True
for x in range(19, 25): taken[I(x, 18)] = True
# the dojo: formal board floor, medallion at the centre, wall ring with a four-square door
fill_grid4('dojo_floor', DOJO[0] + 1, DOJO[1] + 1, DOJO[2] - 1, DOJO[3] - 1)
m = LANG['fills']['dojo_medallion']
for dy in range(4):
    for dx in range(4): L['ground'][I(20 + dx, 9 + dy)] = gid(m['sheet'], m['x'] + dx, m['y'] + dy)
for y in range(DOJO[1], DOJO[3]):
    for x in range(DOJO[0], DOJO[2]): taken[I(x, y)] = True
nine('wall', *DOJO, gaps=set(DOOR))
# six stance panels along the north wall, one per master (beat a5-stance-on-empty)
for k, x in enumerate((13, 16, 19, 24, 27, 30)):
    stamp(f'stance_panel_{k + 1}', x, 4)
# the lantern post beside the gate path: lit, in view of the spawn, the first thing a newcomer can walk to
assert all(not taken[I(25, y)] for y in (29, 30, 31)), 'lantern square taken'
LANT = (25, 30)                               # head tile; the post stands under it and is the one blocked square
L['over1'][I(*LANT)] = LG(FIRST['lantern_head']); L['detail'][I(25, 31)] = LG(FIRST['lantern_post']); block(25, 31)
for dy in range(-1, 2):
    for dx in range(-1, 2): L['glow'][I(LANT[0] + dx, LANT[1] + dy)] = LG(FIRST['glow'][(dy + 1) * 3 + dx + 1])
for y in range(29, 32): taken[I(25, y)] = True
stamp('master_yun', 21, 8)
stamp('weapon_rack', 12, 14)
stamp('bench', 29, 15)
for (x, y) in ((31, 8), (31, 11), (12, 8), (12, 11)): stamp('dummy', x, y)
# elders' halls flank the courtyard, doors facing it
stamp('hall_thatch', 3, 20)
stamp('hall_timber', 37, 22)
for x in range(3, 7): taken[I(x, 27)] = True          # keep each hall's door step clear
for x in range(37, 41): taken[I(x, 27)] = True
# the grove: a ring of pine, bamboo and broad trees round the compound, open at the gate
ring = []
for x in range(0, W, 2): ring += [(x, 0), (x, H - 3)]
for y in range(2, H - 3, 2): ring += [(0, y), (W - 2, y)]
for (x, y) in ring:
    if y >= H - 3 and GATE_X[0] - 2 <= x <= GATE_X[1] + 1: continue
    for nm in rnd.sample(['pine', 'round_tree', 'pine', 'bamboo_short'], 4):
        if can_stamp(nm, x, y): stamp(nm, x, y); break
for x in range(W):
    for y in (0, 1, H - 1, H - 2, H - 3):
        if not (GATE_X[0] - 1 <= x <= GATE_X[1]) and not taken[I(x, y)]:
            stamp('bamboo_short', x, y - 1) if y > 0 and can_stamp('bamboo_short', x, y - 1) else block(x, y)
for y in range(H):
    for x in (0, 1, W - 2, W - 1):
        if not taken[I(x, y)]: block(x, y)
# garden pieces: plum in blossom, scholar rocks and bamboo, placed with room to walk round each
for nm, count in (('plum', 5), ('big_tree', 2), ('scholar_rock', 4), ('bamboo_tall', 10), ('pebble_rock', 6)):
    placed, tries = 0, 0
    while placed < count and tries < 4000:
        tries += 1
        x, y = rnd.randrange(2, W - 4), rnd.randrange(2, H - 4)
        if can_stamp(nm, x, y, pad=1): stamp(nm, x, y); placed += 1
for nm in ('bush', 'fern') * 14:
    x, y = rnd.randrange(2, W - 2), rnd.randrange(2, H - 2)
    if can_stamp(nm, x, y): stamp(nm, x, y)
# six hidden layers, one per stance panel: the banner lit and a gold pool on the standing square (dojo.js shows
# the layer for a player when they stand there). Walk-on is allowed: nothing here blocks the way past.
LIT = {}
for k, x in enumerate(FH['panel_xs']):
    lay = [0] * N
    lay[I(x, 4)] = LG(FIRST[('banner', k, 0)]); lay[I(x, 5)] = LG(FIRST[('banner', k, 1)]); lay[I(x, FH['stand_y'])] = LG(FIRST['pool'])
    LIT[k + 1] = lay
# the player starts at the gate
for x in range(21, 23): L['start'][I(x, H - 2)] = gid('wall', 2, 2)

# ---- checks ----
blocked = lambda x, y: L['collisions'][I(x, y)] != 0


def reach(src):
    seen = {src}; q = deque([src])
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if 0 <= n[0] < W and 0 <= n[1] < H and n not in seen and not blocked(*n): seen.add(n); q.append(n)
    return seen


R = reach((21, H - 2))
must = {'dojo door': (21, 17), 'before Master Yun': (21, 10), 'medallion': (22, 11),
        'thatched hall door': (4, 27), 'timber hall door': (38, 27)}
must.update({f'stance panel {k + 1}': (x, 6) for k, x in enumerate(FH['panel_xs'])})
must['lantern post'] = (24, 31)
problems = [f'{k} {v} not reachable from the gate' for k, v in must.items() if v not in R]
rule = LANG['rules']
if len(DOOR) < rule['door_min']: problems.append('dojo door narrower than door_min')
if GATE_X[1] - GATE_X[0] < rule['corridor_min']: problems.append('gate path narrower than corridor_min')
# clear ring round Master Yun
for dy in range(-rule['clear_round_npc'], rule['clear_round_npc'] + 1):
    for dx in range(-rule['clear_round_npc'], rule['clear_round_npc'] + 1):
        if (dx or dy) and blocked(21 + dx, 8 + dy): problems.append(f'square {(21 + dx, 8 + dy)} next to Yun is blocked')
if problems:
    print('CHECK FAILED:'); [print(' -', p) for p in problems]; sys.exit(1)

# ---- write the map ----
def tl(i, name, data, props=None, visible=True):
    l = {'id': i, 'name': name, 'type': 'tilelayer', 'x': 0, 'y': 0, 'width': W, 'height': H, 'opacity': 1, 'visible': visible, 'data': data}
    if props: l['properties'] = props
    return l


def area(i, name, x, y, w, h, role):
    return {'id': i, 'name': name, 'type': 'area', 'x': x * T, 'y': y * T, 'width': w * T, 'height': h * T, 'rotation': 0, 'visible': True,
            'properties': [{'name': 'role', 'type': 'string', 'value': role}]}


areas = [area(1, 'Dojo floor', 11, 4, 22, 13, 'practice-floor'), area(2, 'Stance wall', 12, 4, 20, 3, 'stance-wall'),
         area(3, 'Master Yun', 19, 7, 5, 5, 'npc-yun'), area(4, 'Dojo gate', 20, 16, 4, 3, 'dojo-gate'),
         area(5, 'Courtyard', COURT[0], COURT[1], COURT[2] - COURT[0], COURT[3] - COURT[1], 'courtyard'),
         area(6, 'Compound gate', GATE_X[0], H - 3, GATE_X[1] - GATE_X[0], 3, 'arrival'),
         area(7, 'Waymark', 12, 7, 20, 1, 'stance-waymark')]
areas += [area(8 + k, f'Stance {k + 1}', x, FH['stand_y'], 1, 2, f'stance-{k + 1}') for k, x in enumerate(FH['panel_xs'])]
layers = [tl(1, 'ground', L['ground']), tl(2, 'detail', L['detail']),
          tl(3, 'collisions', L['collisions'], [{'name': 'collides', 'type': 'bool', 'value': True}], visible=False),
          {'id': 4, 'name': 'floorLayer', 'type': 'objectgroup', 'x': 0, 'y': 0, 'opacity': 1, 'visible': True, 'draworder': 'topdown', 'objects': []}, tl(5, 'over1', L['over1']), tl(6, 'over2', L['over2']),
          tl(7, 'start', L['start'], visible=False),
          {'id': 8, 'name': 'areas', 'type': 'objectgroup', 'x': 0, 'y': 0, 'opacity': 1, 'visible': True, 'draworder': 'topdown', 'objects': areas}]
layers[4:4] = [tl(19, 'glow', L['glow'])] + [tl(20 + k, f'lit{k}', LIT[k], visible=False) for k in LIT]   # after floorLayer, before over1
tmj = {'compressionlevel': -1, 'height': H, 'width': W, 'infinite': False, 'orientation': 'orthogonal', 'renderorder': 'right-down',
       'tiledversion': '1.10.2', 'tileheight': T, 'tilewidth': T, 'type': 'map', 'version': '1.10', 'nextlayerid': 30,
       'nextobjectid': len(areas) + 1, 'layers': layers, 'tilesets': tilesets,
       'properties': [{'name': 'mapName', 'type': 'string', 'value': 'Calrunian Dojo'},
                      {'name': 'script', 'type': 'string', 'value': 'dojo.js'},
                      {'name': 'mapDescription', 'type': 'string', 'value': 'Master Yun\'s dojo in the sect, first slice. Art: Ninja Adventure Asset Pack (Pixel-boy and AAA), CC0.'},
                      {'name': 'generator', 'type': 'string', 'value': f'gen_dojo.py --seed {SEED}'}]}
# WorkAdventure reads this map differently from how Tiled draws it: floorLayer must be an Object Layer,
# collision is a tile property rather than a layer, and a collided start tile would spawn a player in a wall.
wa_apply(tmj)
# The map half of the contract (five WorkAdventure rules) and the art half (docs/WA_ASSET_CONTRACT.md):
# both fail the build, so a map that WorkAdventure would reject, or whose tiles no longer fit the world,
# is never written in the first place.
_wa = wa_check(tmj) + wa_exits(tmj, OUT) + assets_fatal(assets_language(LANG, HERE)) + assets_map(tmj, OUT)
if _wa:
    print('RULES FAILED:'); [print(' -', e) for e in _wa]; sys.exit(1)
json.dump(tmj, open(os.path.join(OUT, 'calrunian-dojo.tmj'), 'w'), separators=(',', ':'))

# ---- walker sheets (WorkAdventure woka: 3 frames x [down, left, right, up], 32 px) ----
def woka(src, out):
    im = Image.open(os.path.join(HERE, src)).convert('RGBA')
    sheet = Image.new('RGBA', (96, 128), (0, 0, 0, 0))
    for row, col in enumerate((0, 2, 3, 1)):          # ninja sheet columns: down, up, left, right
        for f, fr in enumerate((1, 0, 3)):
            fimg = im.crop((col * SP, fr * SP, col * SP + SP, fr * SP + SP)).resize((T, T), Image.NEAREST)
            sheet.paste(fimg, (f * T, row * T), fimg)
    sheet.save(os.path.join(OUT, out))
    return sheet


yun = woka('src16/MasterSheet.png', 'sprites/yun-woka.png')
monk = woka('src16/MonkSheet.png', 'sprites/monk-woka.png')
_wa = assets_woka([os.path.join(OUT, 'sprites/yun-woka.png'), os.path.join(OUT, 'sprites/monk-woka.png')])
if _wa:
    print('RULES FAILED:'); [print(' -', e) for e in _wa]; sys.exit(1)

# ---- render ----
FRAME = int(args[args.index('--frame') + 1]) if '--frame' in args else 0   # picture only: which animation frame to draw


def tile_img(g):
    lg = sheets['lit']['gid0']
    if g >= lg and (g - lg) in anim_lit: g = lg + anim_lit[g - lg][FRAME % NF]
    for name, s in sorted(sheets.items(), key=lambda kv: -kv[1]['gid0']):
        if g >= s['gid0']:
            k = g - s['gid0']; x, y = k % s['cols'], k // s['cols']
            return s['img'].crop((x * T, y * T, x * T + T, y * T + T))


canvas = Image.new('RGBA', (W * T, H * T), (20, 14, 11, 255))
for name in ('ground', 'detail', 'glow'):
    for i, g in enumerate(L[name]):
        if g: t = tile_img(g); canvas.alpha_composite(t, ((i % W) * T, (i // W) * T))
if '--lit' in args:   # picture only: show these banners lit, as a player who stood under them would see them
    for k in args[args.index('--lit') + 1].split(','):
        for i, g in enumerate(LIT[int(k)]):
            if g: canvas.alpha_composite(tile_img(g), ((i % W) * T, (i // W) * T))
walker = monk.crop((32, 96, 64, 128))       # the monk student, facing north into the compound
canvas.alpha_composite(walker, (21 * T + 16, (H - 4) * T))
for name in ('over1', 'over2'):
    for i, g in enumerate(L[name]):
        if g: t = tile_img(g); canvas.alpha_composite(t, ((i % W) * T, (i // W) * T))
canvas.convert('RGB').save(os.path.join(OUT, 'render.png'))
print(f'ok: {W}x{H} tiles at {T} px, seed {SEED}, {len(R)} walkable squares reachable from the gate; wrote {OUT}')
