"""Generate a 2D Heaven Sect map for the WorkAdventure world from two design-language files.
usage: python3 gen_sect.py [--level levels/heaven-sect-court.json] [--seed N] [--out DIR]

sect-base.json  the shared language: sheets, fills, wall colours, named stamps, plaque style, walk rules, room grammar
levels/*.json   one level: its rooms (kind, box, doors, seats), paved walks and labelled exits to other maps

Writes into DIR (default: here), named after the level:
  tiles/*.png         each source sheet drawn up to 32 px, plus <map>-signs.png (the room-name plaques)
  <map>.tmj           one orthogonal 32 px map: ground, detail, collisions, floorLayer, over1, over2, start, areas
  <map>-render.png    the whole map as a player sees it
The layout code places named pieces, never raw tile numbers. Before writing it checks itself: rooms meet the size
rule, doors and walks keep the rule widths, and every seat, door and exit is reachable from the start."""
import json, os, sys, random, colorsys
from collections import deque
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[1:]
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
BASE = json.load(open(os.path.join(HERE, 'sect-base.json')))
LEVEL = json.load(open(os.path.join(HERE, opt('--level', 'levels/heaven-sect-court.json'))))
for key in ('fills', 'stamps', 'walls', 'rules', 'room_kinds'):      # a level may override any base piece
    BASE[key].update(LEVEL.get(key, {}))
SEED = int(opt('--seed', LEVEL.get('seed', 7)))
OUT = opt('--out', HERE)
MAP = LEVEL['map']
SP, K = BASE['src_px'], BASE['scale']
T = SP * K
W, H = LEVEL['size']
rnd = random.Random(SEED)
RULE = BASE['rules']
for d in ('tiles',):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)


def hex_rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# ---- sheets: drawn up to 32 px, recoloured, registered as Tiled tilesets ----
sheets, tilesets, firstgid = {}, [], 1


def add_sheet(name, big, fn):
    global firstgid
    cols, rows = big.width // T, big.height // T
    sheets[name] = {'gid0': firstgid, 'cols': cols, 'img': big}
    tilesets.append({'firstgid': firstgid, 'name': name, 'image': fn, 'imagewidth': big.width, 'imageheight': big.height,
                     'tilewidth': T, 'tileheight': T, 'tilecount': cols * rows, 'columns': cols, 'margin': 0, 'spacing': 0})
    firstgid += cols * rows


for name, rel in BASE['sheets'].items():
    im = Image.open(os.path.join(HERE, rel)).convert('RGBA')
    im = im.crop((0, 0, im.width // SP * SP, im.height // SP * SP))
    big = im.resize((im.width * K, im.height * K), Image.NEAREST)
    for rc in BASE['recolor'].values():
        if not isinstance(rc, dict) or rc.get('sheet') != name: continue
        th = colorsys.rgb_to_hsv(*[c / 255 for c in hex_rgb(rc['hue_to'])])[0]
        px = big.load()
        for y in range(rc['y'] * T, (rc['y'] + rc['h']) * T):
            for x in range(rc['x'] * T, (rc['x'] + rc['w']) * T):
                r, g, b, a = px[x, y]
                h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
                if a and s > 0.25 and 0.65 < h < 0.95:   # violet and magenta only
                    r2, g2, b2 = colorsys.hsv_to_rgb(th, min(1, s), v * 0.8)
                    px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    fn = f'tiles/{name}.png'
    big.save(os.path.join(OUT, fn))
    add_sheet(name, big, fn)


# ---- plaques: every room and exit label drawn as a wooden board, one tile high ----
PQ = BASE['plaque']
font = ImageFont.truetype(PQ['font'], PQ['px'])


def plaque_img(text):
    tw = int(font.getlength(text)) + 8
    wt = -(-tw // SP)                                   # width in 16 px tiles
    im = Image.new('RGBA', (wt * SP, SP), (0, 0, 0, 0))
    d = ImageDraw.Draw(im); d.fontmode = '1'
    d.rectangle([0, 2, wt * SP - 1, SP - 3], fill=hex_rgb(PQ['wood']) + (255,), outline=hex_rgb(PQ['edge']) + (255,))
    d.text(((wt * SP - tw) // 2 + 4, 3), text, font=font, fill=hex_rgb(PQ['ink']) + (255,))
    return im, wt


GUIDE = LEVEL.get('guide')
RAIL = LEVEL.get('rail') if GUIDE else None
PATHS, pathlayers = {}, []
labels = [r['label'] for r in LEVEL['rooms']] + [e['label'] for e in LEVEL['exits']]
pimgs = [plaque_img(t) for t in labels]
cols = max(wt for _, wt in pimgs)
sign_sheet = Image.new('RGBA', (cols * SP, len(pimgs) * SP), (0, 0, 0, 0))
PLAQUE = {}
for row, (t, (im, wt)) in enumerate(zip(labels, pimgs)):
    sign_sheet.paste(im, (0, row * SP)); PLAQUE[t] = (row, wt)
sign_big = sign_sheet.resize((sign_sheet.width * K, sign_sheet.height * K), Image.NEAREST)
sign_fn = f'tiles/{MAP}-signs.png'
sign_big.save(os.path.join(OUT, sign_fn))
add_sheet('signs', sign_big, sign_fn)

# ---- the guide as a tile, and the lantern that lights a path to a hall ----
if GUIDE:
    wk = Image.open(os.path.join(HERE, GUIDE['sheet'])).convert('RGBA')
    fx, fy = GUIDE['frame']
    gt = wk.crop((fx * T, fy * T, fx * T + T, fy * T + T))
    gt.save(os.path.join(OUT, 'tiles/guide.png')); add_sheet('guide', gt, 'tiles/guide.png')
    glow = Image.new('RGBA', (T, T), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    gd.ellipse([8, 8, 23, 23], fill=(42, 26, 16, 255)); gd.ellipse([10, 10, 21, 21], fill=(255, 190, 70, 255))
    gd.ellipse([13, 13, 18, 18], fill=(255, 240, 200, 255))
    glow.save(os.path.join(OUT, 'tiles/glow.png')); add_sheet('glow', glow, 'tiles/glow.png')
    if RAIL:   # the rail's lantern: frame 0 dark, frame 1 lit
        ls = Image.new('RGBA', (2 * T, T), (0, 0, 0, 0)); ld = ImageDraw.Draw(ls)
        for f, (body, rim) in enumerate(((hex_rgb('#4a3b2e'), hex_rgb('#2a1a10')), (hex_rgb('#ffbe46'), hex_rgb('#6b3a10')))):
            ox = f * T
            if f: ld.ellipse([ox + 1, 1, ox + 30, 30], fill=(255, 190, 70, 70))                                # glow halo
            ld.rectangle([ox + 14, 24, ox + 17, 31], fill=hex_rgb('#5a3b22') + (255,))                      # post
            ld.rectangle([ox + 6, 5, ox + 25, 8], fill=rim + (255,))                                          # cap
            ld.rectangle([ox + 8, 9, ox + 23, 23], fill=body + (255,), outline=rim + (255,))                  # paper
            ld.rectangle([ox + 7, 24, ox + 24, 25], fill=rim + (255,))                                        # foot
            if f: ld.rectangle([ox + 11, 12, ox + 20, 20], fill=(255, 240, 200, 255))                         # flame glow
        ls.save(os.path.join(OUT, 'tiles/rail-lantern.png')); add_sheet('railLantern', ls, 'tiles/rail-lantern.png')
    # the "first time here?" bubble over her head: a small cream speech bubble, shown only to a player who has not talked to her
    himg, HINT_WT = plaque_img(GUIDE['hint'])
    hs = Image.new('RGBA', (max(HINT_WT, 1) * SP, 2 * SP), (0, 0, 0, 0)); hd = ImageDraw.Draw(hs)
    hd.rectangle([0, 1, HINT_WT * SP - 1, SP - 1], fill=hex_rgb('#f3e2c0') + (255,), outline=hex_rgb('#2a1a10') + (255,))
    hd.text(((HINT_WT * SP - int(font.getlength(GUIDE['hint']))) // 2, 2), GUIDE['hint'], font=font, fill=hex_rgb('#2a1a10') + (255,))
    hd.polygon([(5, SP), (11, SP), (8, SP + 5)], fill=hex_rgb('#f3e2c0') + (255,), outline=hex_rgb('#2a1a10') + (255,))
    hbig = hs.resize((hs.width * K, hs.height * K), Image.NEAREST)
    hbig.save(os.path.join(OUT, 'tiles/hint.png')); add_sheet('hint', hbig, 'tiles/hint.png')


def gid(sheet, x, y):
    s = sheets[sheet]; return s['gid0'] + y * s['cols'] + x


# ---- layers ----
N = W * H
HINT = [0] * N
L = {n: [0] * N for n in ('ground', 'detail', 'collisions', 'floorLayer', 'over1', 'over2', 'start')}
taken = [False] * N
I = lambda x, y: y * W + x
COLL = gid('wall', 2, 2)  # any non-zero tile marks a blocked square; the layer is hidden in play
problems = []


def block(x, y): L['collisions'][I(x, y)] = COLL


def keep(x0, y0, w, h):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if 0 <= x < W and 0 <= y < H: taken[I(x, y)] = True


def fill(name, x0, y0, w, h):
    f = BASE['fills'][name]
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if not (0 <= x < W and 0 <= y < H): continue
            if 'tiles' in f:
                L['ground'][I(x, y)] = gid(f['sheet'], *rnd.choice(f['tiles']))
            else:
                bx, by = f['grid4']
                L['ground'][I(x, y)] = gid(f['sheet'], bx + (x - x0) % 4, by + (y - y0) % 4)


def can_stamp(name, x, y, pad=0):
    s = BASE['stamps'][name]
    for dy in range(-pad, s['h'] + pad):
        for dx in range(-pad, s['w'] + pad):
            xx, yy = x + dx, y + dy
            if not (0 <= xx < W and 0 <= yy < H) or taken[I(xx, yy)]: return False
    return True


def stamp(name, x, y, force=False):
    s = BASE['stamps'][name]
    for dy in range(s['h']):
        for dx in range(s['w']):
            i = I(x + dx, y + dy); g = gid(s['sheet'], s['x'] + dx, s['y'] + dy); taken[i] = True
            if dy < s.get('over_rows', 0):
                L['over1'][i] = g
            else:
                L['detail'][i] = g
                if s.get('collide', True): block(x + dx, y + dy)


def put_plaque(text, x, y):
    row, wt = PLAQUE[text]      # a plaque wt source tiles wide spans wt map tiles once drawn up
    for k in range(wt):
        if 0 <= x + k < W: L['over2'][I(x + k, y)] = gid('signs', k, row)
    return wt


def wall_ring(colour, x0, y0, w, h, gaps):
    c = BASE['walls'][colour]; n = BASE['walls']['nine']
    x1, y1 = x0 + w, y0 + h
    for y in range(y0, y1):
        for x in range(x0, x1):
            if not (x in (x0, x1 - 1) or y in (y0, y1 - 1)) or (x, y) in gaps: continue
            k = ('t' if y == y0 else 'b' if y == y1 - 1 else '') + ('l' if x == x0 else 'r' if x == x1 - 1 else '')
            tx, ty = n[k]
            L['detail'][I(x, y)] = gid(c['sheet'], c['ox'] + tx, c['oy'] + ty); block(x, y)


# ---- ground: grass everywhere, then walks, then rooms ----
fill('grass', 0, 0, W, H)
for name, (x, y, w, h) in ((k, v) for k, v in LEVEL['paths'].items() if k != 'about'):
    fill('paving', x, y, w, h); keep(x, y, w, h)
    if min(w, h) < RULE['corridor_min'] and not name.endswith('step'):
        problems.append(f'walk "{name}" is {min(w, h)} wide, under corridor_min {RULE["corridor_min"]}')

must = {}        # name -> square that must be reachable from the start
seats_at = {}    # room id -> list of seat squares
zones = []       # (name, x, y, w, h, props)


def seat(rid, x, y):
    stamp('cushion', x, y); seats_at.setdefault(rid, []).append((x, y))


def furnish(r, ix, iy, iw, ih):
    """Lay out one room's interior [ix, iy, iw, ih] by its kind's plan."""
    kind, rid, n = r['kind'], r['id'], r['seats']
    cx = ix + iw // 2
    if kind == 'assembly':
        # dais on the north: altar table for the founder, the founder's seat behind it, six School banners on the wall
        for k, b in enumerate(('banner_5', 'banner_2', 'banner_1', 'banner_3', 'banner_4', 'banner_6')):
            stamp(b, ix + 2 + k * 2 + (6 if k >= 3 else 0) + (iw - 22) // 2, iy)
        f = BASE['fills']['medallion']
        for dy in range(4):
            for dx in range(4): L['ground'][I(cx - 2 + dx, iy + 2 + dy)] = gid(f['sheet'], f['x'] + dx, f['y'] + dy)
        stamp('altar_table', cx - 1, iy + 4)
        seat(rid + '-dais', cx - 1, iy + 3)
        # rows of seats facing the dais, split by a centre aisle
        per_side = 3; rows = -(-n // (per_side * 2))
        y = iy + 8
        placed = 0
        for rr in range(rows):
            for side in (-1, 1):
                for k in range(per_side):
                    if placed >= n: break
                    x = cx + side * (3 + 2 * k) - (1 if side < 0 else 0)
                    seat(rid, x, y); placed += 1
            y += 2
        for (x, y) in ((ix, iy + ih - 2), (ix + iw - 1, iy + ih - 2)): stamp('plant_pot', x, y)
        must[f'{r["label"]}: before the dais'] = (cx, iy + 6)
    elif kind == 'circle':
        stamp(r['banner'], cx, iy)
        stamp('low_table', cx - 1, iy + ih // 2)
        ring = [(cx - 1, iy + ih // 2 - 1), (cx, iy + ih // 2 - 1), (cx + 1, iy + ih // 2 - 1),
                (cx - 1, iy + ih // 2 + 1), (cx, iy + ih // 2 + 1), (cx + 1, iy + ih // 2 + 1),
                (cx - 2, iy + ih // 2), (cx + 2, iy + ih // 2)]
        for (x, y) in ring[:n]: seat(rid, x, y)
        stamp('plant_pot', ix, iy); stamp('plant_pot', ix + iw - 1, iy)
        stamp('bookshelf', ix + 2, iy) if iw > 9 else None
        stamp('jar', ix + iw - 3, iy + 1)
    elif kind == 'dojo':
        f = BASE['fills']['medallion']
        my = iy + ih // 2 - 2
        for dy in range(4):
            for dx in range(4): L['ground'][I(cx - 2 + dx, my + dy)] = gid(f['sheet'], f['x'] + dx, f['y'] + dy)
        step = max(2, (iw - 4) // 6)
        for k in range(6): stamp(f'banner_{k + 1}', ix + 2 + k * step + (k >= 3) * 2, iy)
        stamp('master_yun', cx, iy + 3)
        must[f'{r["label"]}: before Master Yun'] = (cx, iy + 5)
        side = [(ix + 1, my - 1 + 2 * k) for k in range(n // 2)] + [(ix + iw - 2, my - 1 + 2 * k) for k in range(n - n // 2)]
        for (x, y) in side: seat(rid, x, y)
        stamp('weapon_rack', ix + 1, iy + ih - 3); stamp('dummy', ix + iw - 3, iy + 3); stamp('dummy', ix + 3, iy + 3)
    elif kind == 'tea':
        k = 0
        while ix + 1 + k * 3 + 2 <= ix + iw - 1:
            stamp('bookshelf', ix + 1 + k * 3, iy); k += 1
        tables = max(1, n // 2)
        gap = iw // (tables + 1)
        for t in range(tables):
            x = ix + gap * (t + 1); y = iy + ih // 2 + 1
            stamp('tea_table', x, y); seat(rid, x - 1, y); seat(rid, x + 1, y)
        stamp('plant_pot', ix, iy + ih - 2); stamp('plant_pot', ix + iw - 1, iy + ih - 2)
    elif kind == 'shrine':
        stamp('sage_statue', cx - 1, iy)
        stamp('altar_table', cx - 1, iy + 2)
        seat(rid, cx - 1, iy + 3); seat(rid, cx, iy + 3)
        stamp('jar', ix + 1, iy + 1); stamp('jar', ix + iw - 2, iy + 1)
    elif kind == 'court':
        pass


for r in LEVEL['rooms']:
    kind = BASE['room_kinds'][r['kind']]
    x0, y0, w, h = r['box']
    if kind['wall'] is None:
        fill(kind['floor'], x0, y0, w, h); keep(x0, y0, w, h)
        gx = LEVEL['start']['x'] - 1
        stamp('torii', gx, y0 + h - 2)
        stamp('notice_board', gx - 6, y0 + 2)
        for (px, py) in ((x0 + 1, y0 + 1), (x0 + w - 4, y0 + 1)): stamp('plum', px, py)
        stamp('jar', gx - 3, y0 + h - 2); stamp('jar', gx + 4, y0 + h - 2)
        put_plaque(r['label'], gx - 7, y0 + h - 1)
        zones.append((r['label'], x0, y0, w, h, {'role': r['id'], 'seats': r['seats']}))
        must[r['label']] = (x0 + w // 2, y0 + h // 2)
        continue
    iw, ih = w - 2, h - 2
    mw, mh = RULE['room_min_interior']
    if r['kind'] != 'shrine' and (iw < mw or ih < mh):
        problems.append(f'{r["label"]} inside is {iw}x{ih}, under the {mw}x{mh} meeting-room minimum')
    gaps = set()
    for d in r['doors']:
        if d['w'] < RULE['door_min']: problems.append(f'{r["label"]} door is {d["w"]} wide, under door_min')
        if d['side'] not in ('N', 'S'): problems.append(f'{r["label"]} door on {d["side"]}: doors go on N or S walls')
        yy = y0 if d['side'] == 'N' else y0 + h - 1
        for x in range(d['x'], d['x'] + d['w']): gaps.add((x, yy))
        fill('paving', d['x'], yy, d['w'], 1)
        out = (d['x'], yy - 1 if d['side'] == 'N' else yy + 1)
        must[f'{r["label"]} door ({d["side"]})'] = out
        if d.get('plaque', True):
            _, wt = PLAQUE[r['label']]
            if d['x'] - wt > x0: px = d['x'] - wt                         # on the wall left of the door
            elif d['x'] + d['w'] + wt < x0 + w: px = d['x'] + d['w']        # or right of it
            else: problems.append(f'{r["label"]} plaque ({wt} tiles) fits neither side of its door'); continue
            put_plaque(r['label'], px, yy)
    keep(x0, y0, w, h)
    fill(kind['floor'], x0 + 1, y0 + 1, iw, ih)
    wall_ring(kind['wall'], x0, y0, w, h, gaps)
    furnish(r, x0 + 1, y0 + 1, iw, ih)
    for (sx, sy) in seats_at.get(r['id'], []): must[f'{r["label"]} seat {sx},{sy}'] = (sx, sy)
    props = {'role': r['id'], 'seats': r['seats']}
    if kind['meeting']:
        props.update({'jitsiRoom': f'{MAP}-{r["id"]}', 'focusable': True})
    zones.append((r['label'], x0 + 1, y0 + 1, iw, ih, props))
    have = len(seats_at.get(r['id'], []))
    if have != r['seats']: problems.append(f'{r["label"]} drew {have} seats, the level asks {r["seats"]}')

for e in LEVEL['exits']:
    x, y, w, h = e['box']
    fill('paving', x, y, w, h); keep(x, y, w, h)
    put_plaque(e['label'], *e['plaque_at'])
    must[f'exit to {e["label"]}'] = (x + w // 2, y + h // 2)
    zones.append((e['label'], x, y, w, h, {'exitUrl': e['exitUrl'], 'role': e['id']}))

if GUIDE:
    gx0, gy0 = GUIDE['at']
    L['detail'][I(gx0, gy0)] = gid('guide', 0, 0); block(gx0, gy0); taken[I(gx0, gy0)] = True
    HINT_AT = (gx0 - HINT_WT // 2, gy0 - 2)
    for k in range(HINT_WT):
        HINT[I(HINT_AT[0] + k, HINT_AT[1])] = gid('hint', k, 0)
        if k == HINT_WT // 2: HINT[I(HINT_AT[0] + k, HINT_AT[1] + 1)] = gid('hint', 0, 1)
    tx, ty, tw, th = GUIDE['talk']
    zones.append((GUIDE['label'], tx, ty, tw, th, {'role': GUIDE['id']}))
    must[GUIDE['label'] + ' (stand-at)'] = (gx0, gy0 + 1)

# ---- the grove: a border of pine, bamboo and broad trees, open at the exits; garden pieces in the gaps ----
ring = []
for x in range(0, W, 2): ring += [(x, 0), (x, H - 2)]
for y in range(2, H - 2, 2): ring += [(0, y), (W - 2, y)]
for (x, y) in ring:
    for nm in rnd.sample(['pine', 'round_tree', 'pine', 'bamboo_short'], 4):
        if can_stamp(nm, x, y): stamp(nm, x, y); break
for y in range(H):
    for x in range(W):
        if (x < 2 or x >= W - 2 or y < 2 or y >= H - 2) and not taken[I(x, y)]: block(x, y)
for nm, count in (('plum', 10), ('big_tree', 4), ('scholar_rock', 8), ('bamboo_tall', 24), ('pine', 10), ('pebble_rock', 10)):
    placed, tries = 0, 0
    while placed < count and tries < 6000:
        tries += 1
        x, y = rnd.randrange(2, W - 4), rnd.randrange(2, H - 4)
        if can_stamp(nm, x, y, pad=1): stamp(nm, x, y); placed += 1
for nm in ('bush', 'fern') * 40:
    x, y = rnd.randrange(2, W - 2), rnd.randrange(2, H - 2)
    if can_stamp(nm, x, y): stamp(nm, x, y)
sx, sy = LEVEL['start']['x'], LEVEL['start']['y']
for x in range(sx, sx + 2): L['start'][I(x, sy)] = COLL

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


R = reach((sx, sy))
problems += [f'{k} {v} not reachable from the start' for k, v in must.items() if v not in R]
if problems:
    print('CHECK FAILED:'); [print(' -', p) for p in problems]; sys.exit(1)

# ---- the guide's paths: one hidden layer per hall, a line of lanterns from the Steward to that hall's door ----
import heapq
PATHS = {}      # hall id -> [(x, y), ...]
HALLS = {}      # hall id -> {label, layer, to: [px, py]}


def lantern_route(src, dst):
    """Cheapest walk src -> dst on free squares, charging for each turn so lanterns run in straight lines."""
    best = {}; pq = [(0, src[0], src[1], -1, None)]; prev = {}
    while pq:
        c, x, y, d, pr = heapq.heappop(pq)
        if (x, y, d) in best: continue
        best[(x, y, d)] = c; prev[(x, y, d)] = pr
        if (x, y) == dst:
            out, k = [], (x, y, d)
            while k: out.append(k[:2]); k = prev[k]
            return out[::-1]
        for nd, (dx, dy) in enumerate(((1, 0), (-1, 0), (0, 1), (0, -1))):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and not blocked(nx, ny):
                heapq.heappush(pq, (c + 1 + (3 if d not in (-1, nd) else 0), nx, ny, nd, (x, y, d)))
    return None


if GUIDE:
    here_sq = (GUIDE['at'][0], GUIDE['at'][1] + 1)
    for r in LEVEL['rooms']:
        door = must.get(f'{r["label"]} door (S)')
        HALLS[r['id']] = {'label': r['label'], 'layer': f'path-{r["id"]}', 'to': None}
        if r['kind'] == 'court':
            HALLS[r['id']]['to'] = [here_sq[0] * T + T // 2, here_sq[1] * T + T // 2]
            continue
        if not door: problems.append(f'{r["label"]} has no south door for the guide to walk to'); continue
        route = lantern_route(here_sq, door)
        if not route: problems.append(f'no walk from the Gate Steward to {r["label"]}'); continue
        PATHS[r['id']] = route[1:]
        HALLS[r['id']]['to'] = [door[0] * T + T // 2, door[1] * T + T // 2]
    ink = open(os.path.join(HERE, 'guide.ink')).read()
    for r in LEVEL['rooms']:
        knot = 'hall_' + r['id'].replace('-', '_')
        if f'=== {knot} ===' not in ink: problems.append(f'guide.ink has no knot {knot} for {r["label"]}')
        if r['kind'] != 'court' and f'# path: {r["id"]}' not in ink: problems.append(f'guide.ink knot {knot} lacks "# path: {r["id"]}"')
    if problems:
        print('CHECK FAILED:'); [print(' -', p) for p in problems]; sys.exit(1)
    pathlayers = []
    for k, (hid, route) in enumerate(PATHS.items()):
        data = [0] * N
        for (x, y) in route: data[I(x, y)] = gid('glow', 0, 0)
        pathlayers.append(data)

RAILL = {}     # hall id -> {'dark': [...], 'lit': [...]} tile layers, and the area name its popup uses
if RAIL:
    ry, rx0 = RAIL['y'], RAIL['x0']
    for k, h in enumerate(RAIL['halls']):
        x = rx0 + 2 * k
        for dx in (0, 1):
            if blocked(x + dx, ry): problems.append(f'lantern rail square {x + dx},{ry} is not free')
        dark, lit = [0] * N, [0] * N
        dark[I(x, ry)] = gid('railLantern', 0, 0); lit[I(x, ry)] = gid('railLantern', 1, 0)
        RAILL[h['id']] = {'dark': dark, 'lit': lit, 'area': f'Rail {h["id"]}'}
        zones.append((f'Rail {h["id"]}', x, ry, 2, 2, {'role': 'lantern-rail', 'hall': h['id']}))
    if problems:
        print('CHECK FAILED:'); [print(' -', p) for p in problems]; sys.exit(1)

# ---- write the map ----
def tl(i, name, data, props=None, visible=True):
    l = {'id': i, 'name': name, 'type': 'tilelayer', 'x': 0, 'y': 0, 'width': W, 'height': H, 'opacity': 1, 'visible': visible, 'data': data}
    if props: l['properties'] = props
    return l


def prop(k, v):
    t = 'bool' if isinstance(v, bool) else 'int' if isinstance(v, int) else 'string'
    return {'name': k, 'type': t, 'value': v}


areas = [{'id': i + 1, 'name': name, 'type': 'area', 'x': x * T, 'y': y * T, 'width': w * T, 'height': h * T, 'rotation': 0,
          'visible': True, 'properties': [prop(k, v) for k, v in p.items()]} for i, (name, x, y, w, h, p) in enumerate(zones)]
layers = [tl(1, 'ground', L['ground']), tl(2, 'detail', L['detail'])] + [tl(10 + k, f'path-{hid}', pathlayers[k], visible=False) for k, hid in enumerate(PATHS)] + [
          tl(3, 'collisions', L['collisions'], [prop('collides', True)], visible=False),
          {'id': 4, 'name': 'floorLayer', 'type': 'objectgroup', 'x': 0, 'y': 0, 'opacity': 1, 'visible': True, 'draworder': 'topdown', 'objects': []}, tl(5, 'over1', L['over1']), tl(6, 'over2', L['over2']),
          tl(7, 'start', L['start'], visible=False),
          *([tl(30, 'hint-new', HINT, visible=False)] if GUIDE else []),
          *[tl(40 + 2 * k, f'rail-{hid}-dark', v['dark']) for k, (hid, v) in enumerate(RAILL.items())],
          *[tl(41 + 2 * k, f'rail-{hid}-lit', v['lit'], visible=False) for k, (hid, v) in enumerate(RAILL.items())],
          {'id': 8, 'name': 'areas', 'type': 'objectgroup', 'x': 0, 'y': 0, 'opacity': 1, 'visible': True, 'draworder': 'topdown', 'objects': areas}]
tmj = {'compressionlevel': -1, 'height': H, 'width': W, 'infinite': False, 'orientation': 'orthogonal', 'renderorder': 'right-down',
       'tiledversion': '1.10.2', 'tileheight': T, 'tilewidth': T, 'type': 'map', 'version': '1.10', 'nextlayerid': 40 + 2 * len(RAILL) + 1,
       'nextobjectid': len(areas) + 1, 'layers': layers, 'tilesets': tilesets,
       'properties': [prop('mapName', LEVEL['title']),
                      *([prop('script', 'guide.js')] if GUIDE else []),
                      prop('mapDescription', 'The Heaven Sect, first 2D map: labelled meeting rooms and doors to other maps. Art: Ninja Adventure Asset Pack (Pixel-boy and AAA), CC0.'),
                      prop('generator', f'gen_sect.py --level levels/{MAP}.json --seed {SEED}')]}
json.dump(tmj, open(os.path.join(OUT, f'{MAP}.tmj'), 'w'), separators=(',', ':'))
if GUIDE:
    rail = [{'id': h['id'], 'place': h['place'], 'lights': h['lights'], 'waiting': h.get('waiting'), 'dark': f'rail-{h["id"]}-dark', 'lit': f'rail-{h["id"]}-lit', 'area': RAILL[h['id']]['area']} for h in RAIL['halls']] if RAIL else []
    json.dump({'guide': GUIDE['label'], 'halls': HALLS, 'rail': rail}, open(os.path.join(OUT, 'guide-halls.json'), 'w'), indent=1)
    import subprocess, shutil
    if OUT != HERE: shutil.copy(os.path.join(HERE, 'guide.html'), os.path.join(OUT, 'guide.html'))
    r = subprocess.run(['node', os.path.join(HERE, 'compile_ink.mjs'), OUT], capture_output=True, text=True)
    print(r.stdout.strip() or r.stderr.strip())
    if r.returncode: sys.exit('CHECK FAILED: guide.ink did not compile (run npm install at the repo root for inkjs)')


# ---- render ----
def tile_img(g):
    for name, s in sorted(sheets.items(), key=lambda kv: -kv[1]['gid0']):
        if g >= s['gid0']:
            k = g - s['gid0']; x, y = k % s['cols'], k // s['cols']
            return s['img'].crop((x * T, y * T, x * T + T, y * T + T))


canvas = Image.new('RGBA', (W * T, H * T), (20, 14, 11, 255))
for name in ('ground', 'detail', 'floorLayer'):
    for i, g in enumerate(L[name]):
        if g: canvas.alpha_composite(tile_img(g), ((i % W) * T, (i // W) * T))
monk = Image.open(os.path.join(HERE, '../calrunian-dojo/sprites/monk-woka.png')).convert('RGBA')
walkers = [(sx, sy - 2, 3)]
for rid, pts in seats_at.items():           # a few students sitting, so a seat reads as a seat
    for (x, y) in pts[: (3 if rid == 'founders-hall' else 2)]: walkers.append((x, y, 3))
for (x, y, facing) in walkers:
    canvas.alpha_composite(monk.crop((32, facing * 32, 64, facing * 32 + 32)), (x * T, y * T - 6))
if GUIDE and '--hint' in args:
    for i, g in enumerate(HINT):
        if g: canvas.alpha_composite(tile_img(g), ((i % W) * T, (i // W) * T))
LIT_RAIL = (opt('--lit-rail', '') or '').split(',')    # hall ids whose rail lantern is drawn lit, for a picture
for hid, v in RAILL.items():
    for i, g in enumerate(v['lit'] if hid in LIT_RAIL else v['dark']):
        if g: canvas.alpha_composite(tile_img(g), ((i % W) * T, (i // W) * T))
LIT = opt('--lit', None)
if LIT and LIT in PATHS:
    for (x, y) in PATHS[LIT]: canvas.alpha_composite(tile_img(gid('glow', 0, 0)), (x * T, y * T))
for name in ('over1', 'over2'):
    for i, g in enumerate(L[name]):
        if g: canvas.alpha_composite(tile_img(g), ((i % W) * T, (i // W) * T))
canvas.convert('RGB').save(os.path.join(OUT, f'{MAP}-render.png'))
seats = sum(len(v) for k, v in seats_at.items() if not k.endswith('-dais'))
print(f'ok: {MAP} {W}x{H} tiles at {T} px, seed {SEED}; {len(LEVEL["rooms"])} rooms, {seats} seats, {len(LEVEL["exits"])} exits; '
      f'{len(must)} named squares reachable from the start ({len(R)} walkable)')
