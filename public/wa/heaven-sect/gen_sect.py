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
sys.path.insert(0, os.path.dirname(HERE))          # public/wa: the rules every map here must keep
from wa_export import apply as wa_apply, check as wa_check  # noqa: E402
args = sys.argv[1:]
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
BASE = json.load(open(os.path.join(HERE, 'sect-base.json')))
LEVEL = json.load(open(os.path.join(HERE, opt('--level', 'levels/heaven-sect-court.json'))))
for key in ('sheets', 'fills', 'stamps', 'walls', 'rules', 'room_kinds'):      # a level may override any base piece
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


def motes_sheet():
    """Three 16 px frames of a spirit: a soft water-teal light (#1a7a8a, ui-water-glow) with a pale core."""
    im = Image.new('RGBA', (SP * 3, SP), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for f, r in enumerate((3, 4, 3)):
        cx, cy = f * SP + 8, 8 + (1 - f % 2)
        d.ellipse([cx - r - 2, cy - r - 2, cx + r + 2, cy + r + 2], fill=(26, 122, 138, 70))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(60, 170, 185, 170))
        d.ellipse([cx - 1, cy - 1, cx + 1, cy + 1], fill=(235, 250, 245, 255))
    return im


def desks_sheet():
    """One desk, two 16 px tiles wide: a wooden top with a sheet of paper and a lamp. The name plate is a plaque drawn beside it."""
    im = Image.new('RGBA', (SP * 2, SP), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([1, 3, SP * 2 - 2, SP - 2], fill=(138, 92, 58, 255), outline=(80, 50, 30, 255))
    d.rectangle([3, 5, SP * 2 - 4, SP - 5], fill=(168, 118, 76, 255))
    d.rectangle([6, 6, 14, 10], fill=(240, 230, 205, 255), outline=(120, 100, 80, 255))
    d.ellipse([SP * 2 - 10, 5, SP * 2 - 5, 10], fill=(250, 214, 120, 255))
    return im


SHEET_DRAWN = {'@motes': motes_sheet, '@desks': desks_sheet}
for name, rel in BASE['sheets'].items():
    im = SHEET_DRAWN[rel]() if rel in SHEET_DRAWN else Image.open(os.path.join(HERE, rel)).convert('RGBA')
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


labels = [r['label'] for r in LEVEL['rooms']] + [e['label'] for e in LEVEL['exits']]
labels += [d['name'] for r in LEVEL['rooms'] for d in r.get('desks', [])]
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


def gid(sheet, x, y):
    s = sheets[sheet]; return s['gid0'] + y * s['cols'] + x


# ---- layers ----
N = W * H
L = {n: [0] * N for n in ('ground', 'detail', 'collisions', 'floorLayer', 'over1', 'over2', 'start')}
taken = [False] * N
I = lambda x, y: y * W + x
COLL = gid('wall', 2, 2)  # any non-zero tile marks a blocked square; the layer is hidden in play
problems = []


def block(x, y): L['collisions'][I(x, y)] = COLL


def blocked_sq(x, y): return L['collisions'][I(x, y)] != 0


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


def stamp_free(name, x, y):
    """Draw a piece inside an already-blocked square (the cloister garth): the picture goes down, collision is already set."""
    s = BASE['stamps'][name]
    for dy in range(s['h']):
        for dx in range(s['w']):
            i = I(x + dx, y + dy); g = gid(s['sheet'], s['x'] + dx, s['y'] + dy)
            if dy < s.get('over_rows', 0): L['over1'][i] = g
            else: L['detail'][i] = g


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
people = []      # (x, y, tint) staff standing at their desks, drawn in the render and the walk


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
    elif kind == 'mote_well':
        # the well at the centre on dark stone, a ring of motes above it, seats round it, the ladder plate on the north wall
        wx, wy = cx - 1, iy + ih // 2 - 1
        for dy in range(-2, 4):
            for dx in range(-3, 5):
                L['ground'][I(wx + dx, wy + dy)] = gid('ifloor', 11 + (wx + dx) % 4, 12 + (wy + dy) % 4)
        stamp('mote_well', wx, wy)
        for k, (mx, my, nm) in enumerate(((-2, -1, 'mote'), (3, 0, 'mote_2'), (-1, 3, 'mote_3'), (2, -2, 'mote_2'))):
            L['over1'][I(wx + mx, wy + my)] = gid('motes', int(nm[-1]) - 1 if nm != 'mote' else 0, 0)
        stamp('notice_board', cx - 1, iy)
        ring = [(wx - 2, wy), (wx - 2, wy + 1), (wx + 3, wy), (wx + 3, wy + 1), (wx, wy + 3), (wx + 1, wy + 3)]
        for (x, y) in ring[:n]: seat(rid, x, y)
        must[f'{r["label"]}: at the well'] = (wx, wy + 2)
        must[f'{r["label"]}: before the ladder plate'] = (cx, iy + 1)
        stamp('plant_pot', ix, iy); stamp('plant_pot', ix + iw - 1, iy)
        stamp('bookshelf', ix + 2, iy); stamp('jar', ix + iw - 3, iy + 1); stamp('fern', ix + 1, iy + ih - 1); stamp('fern', ix + iw - 2, iy + ih - 1)
    elif kind == 'cloister':
        # a garden court at the centre (blocked, planted), the round walked about it, seats on the outer edge, the plate on the north wall
        gw, gh = 7, 6
        gx0, gy0 = cx - gw // 2, iy + (ih - gh) // 2
        fill('grass', gx0, gy0, gw, gh)
        for yy in range(gy0, gy0 + gh):
            for xx in range(gx0, gx0 + gw): taken[I(xx, yy)] = True; block(xx, yy)
        stamp_free('plum', gx0 + 2, gy0 + 1)
        for (dx, dy, nm) in ((0, 0, 'fern'), (gw - 1, 0, 'bush'), (0, gh - 1, 'bush'), (gw - 1, gh - 1, 'fern'), (1, gh - 1, 'pebble_rock'), (gw - 2, 0, 'pebble_rock')):
            stamp_free(nm, gx0 + dx, gy0 + dy)
        stamp('notice_board', cx - 1, iy)
        mid = iy + ih // 2
        for (x, y) in ((ix, mid - 1), (ix, mid + 1), (ix + iw - 1, mid - 1), (ix + iw - 1, mid + 1))[:n]: seat(rid, x, y)
        must[f'{r["label"]}: on the round, north'] = (cx, iy + 1)
        must[f'{r["label"]}: on the round, south'] = (cx, iy + ih - 2)
        must[f'{r["label"]}: before the plate'] = (cx, iy + 1)
        stamp('plant_pot', ix, iy); stamp('plant_pot', ix + iw - 1, iy)
        stamp('jar', ix + 2, iy + 1); stamp('jar', ix + iw - 3, iy + 1)
        stamp('fern', ix, iy + ih - 1); stamp('fern', ix + iw - 1, iy + ih - 1)
    elif kind == 'staff_hall':
        # named desks: each desk 2 wide with its name plate on the square below it, the person standing behind (north of) it.
        # A desk with "present": false has its chair pushed back and nobody there. Desk and person squares are blocked;
        # the aisle between the rows stays open, and every person keeps 2 squares clear round them (rules.clear_round_npc).
        x0, y0 = r['box'][0], r['box'][1]
        own = {}
        for dk in r['desks']:
            dx, dy = x0 + dk['at'][0], y0 + dk['at'][1]
            stamp('desk', dx, dy)
            _, wt = PLAQUE[dk['name']]
            put_plaque(dk['name'], dx - (wt - 2) // 2, dy + 1)
            px, py = dx, dy - 1
            if dk.get('present', True):
                keep(px, py, 1, 1); block(px, py); people.append((px, py, len(people) % 4))
            else:
                stamp('chair', px, py)
            own[dk['name']] = ({(dx, dy), (dx + 1, dy)}, (px, py))
            must[f'{r["label"]}: before {dk["name"]}\'s desk'] = (dx, dy + 2)
            zones.append((f'Desk: {dk["name"]}', px, py, 2, 2, {'role': f'desk-{dk["name"].lower()}'}))
        clear = RULE['clear_round_npc']
        for dk in r['desks']:
            if not dk.get('present', True): continue
            mine, (px, py) = own[dk['name']]
            for ax in range(-clear, clear + 1):
                for ay in range(-clear, clear + 1):
                    m = (px + ax, py + ay)
                    if (ax or ay) and blocked_sq(*m) and m not in mine:
                        problems.append(f'{dk["name"]} has {m} blocked inside the {clear}-square clear space')
        stamp('plant_pot', ix, iy + ih - 2); stamp('plant_pot', ix + iw - 1, iy + ih - 2)
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
layers = [tl(1, 'ground', L['ground']), tl(2, 'detail', L['detail']),
          tl(3, 'collisions', L['collisions'], [prop('collides', True)], visible=False),
          tl(4, 'floorLayer', L['floorLayer']), tl(5, 'over1', L['over1']), tl(6, 'over2', L['over2']),
          tl(7, 'start', L['start'], visible=False),
          {'id': 8, 'name': 'areas', 'type': 'objectgroup', 'x': 0, 'y': 0, 'opacity': 1, 'visible': True, 'draworder': 'topdown', 'objects': areas}]
tmj = {'compressionlevel': -1, 'height': H, 'width': W, 'infinite': False, 'orientation': 'orthogonal', 'renderorder': 'right-down',
       'tiledversion': '1.10.2', 'tileheight': T, 'tilewidth': T, 'type': 'map', 'version': '1.10', 'nextlayerid': 9,
       'nextobjectid': len(areas) + 1, 'layers': layers, 'tilesets': tilesets,
       'properties': [prop('mapName', LEVEL['title']),
                      prop('mapDescription', 'The Heaven Sect, first 2D map: labelled meeting rooms and doors to other maps. Art: Ninja Adventure Asset Pack (Pixel-boy and AAA), CC0.'),
                      prop('generator', f'gen_sect.py --level levels/{MAP}.json --seed {SEED}')]}
# WorkAdventure reads this map differently from how Tiled draws it (floorLayer must be an Object Layer,
# collision is a tile property, a collided start tile spawns a player in a wall). See ../wa_export.py.
for _c in wa_apply(tmj): print('wa_export:', _c)
_wa = wa_check(tmj)
if _wa:
    print('WORKADVENTURE RULES FAILED:'); [print(' -', e) for e in _wa]; sys.exit(1)
json.dump(tmj, open(os.path.join(OUT, f'{MAP}.tmj'), 'w'), separators=(',', ':'))


# ---- render ----
def tile_img(g):
    for name, s in sorted(sheets.items(), key=lambda kv: -kv[1]['gid0']):
        if g >= s['gid0']:
            k = g - s['gid0']; x, y = k % s['cols'], k // s['cols']
            return s['img'].crop((x * T, y * T, x * T + T, y * T + T))


def tinted(sheet, k):
    """The walker with its colours swapped, so staff at their desks are told apart (the look Wendell answered A on)."""
    r, g, b, a = sheet.split()
    ch = [(r, g, b), (b, g, r), (g, r, b), (r, b, g)][k % 4]
    return Image.merge('RGBA', (*ch, a))


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
for (x, y, tint) in people:                 # staff at their desks
    canvas.alpha_composite(tinted(monk, tint).crop((0, 3 * 32, 32, 4 * 32)), (x * T, y * T - 6))
for name in ('over1', 'over2'):
    for i, g in enumerate(L[name]):
        if g: canvas.alpha_composite(tile_img(g), ((i % W) * T, (i // W) * T))
canvas.convert('RGB').save(os.path.join(OUT, f'{MAP}-render.png'))
seats = sum(len(v) for k, v in seats_at.items() if not k.endswith('-dais'))
print(f'ok: {MAP} {W}x{H} tiles at {T} px, seed {SEED}; {len(LEVEL["rooms"])} rooms, {seats} seats, {len(LEVEL["exits"])} exits; '
      f'{len(must)} named squares reachable from the start ({len(R)} walkable)')

# ---- a moving look, when the level has a "walk": a visitor walks the points, one spirit rises over the well ----
if LEVEL.get('walk'):
    WK = LEVEL['walk']
    pts = WK.get('points', []); cx0, cy0, cw, ch = WK['crop']
    base = Image.new('RGBA', (W * T, H * T), (20, 14, 11, 255))
    for name in ('ground', 'detail', 'floorLayer'):
        for i, g in enumerate(L[name]):
            if g: base.alpha_composite(tile_img(g), ((i % W) * T, (i // W) * T))
    top = Image.new('RGBA', base.size, (0, 0, 0, 0))
    for name in ('over1', 'over2'):
        for i, g in enumerate(L[name]):
            if g: top.alpha_composite(tile_img(g), ((i % W) * T, (i // W) * T))
    for (x, y, tint) in people:                          # staff at their desks, under the roof tiles like the walkers
        base.alpha_composite(tinted(monk, tint).crop((0, 3 * 32, 32, 4 * 32)), (x * T, y * T - 6))
    msheet = sheets['motes']['img']

    def trace(points, per=2):                         # one square per step, `per` frames a square
        out = []
        for (a, b) in zip(points, points[1:]):
            n = max(abs(b[0] - a[0]), abs(b[1] - a[1]))
            face = 1 if b[1] < a[1] else 3 if b[1] > a[1] else 2 if b[0] < a[0] else 0
            for k in range(n * per): out.append((a[0] + (b[0] - a[0]) * k / (n * per), a[1] + (b[1] - a[1]) * k / (n * per), face))
        return out
    path = trace(pts) if len(pts) > 1 else []
    path += [path[-1]] * 20 if path else []
    dloop = WK.get('daemon')                          # a daemon walks its round: the points, laps times
    dpath = []
    if dloop:
        dpts = dloop['points'] * dloop.get('laps', 1)
        dpts = dpts + [dloop['points'][0]] if dloop.get('close', True) else dpts
        dpath = trace(dpts)
        when = dloop.get('starts_when_visitor_at')      # the daemon sets off when the visitor first reaches this square
        if when and path:
            first = next((k for k, (px_, py_, _) in enumerate(path) if abs(px_ - when[0]) < 0.5 and abs(py_ - when[1]) < 0.5), 0)
            dpath = [dpath[0]] * first + dpath
    well = next((r for r in LEVEL['rooms'] if r['kind'] == 'mote_well'), None)
    total = max(len(path), len(dpath))
    if well:
        bx, by, bw, bh = well['box']
        wx, wy = bx + 1 + (bw - 2) // 2 - 1, by + 1 + (bh - 2) // 2 - 1
    daemon_sheet = monk.copy(); dp = daemon_sheet.load()      # the daemon: the walker redrawn in water-teal, with a glow under it
    for yy in range(daemon_sheet.height):
        for xx in range(daemon_sheet.width):
            r_, g_, b_, a_ = dp[xx, yy]
            if a_:
                v = (r_ + g_ + b_) // 3
                dp[xx, yy] = (int(40 + v * 0.35), int(120 + v * 0.55), int(135 + v * 0.55), 235)
    frames = []
    for f in range(total):
        im = base.copy()
        if path:
            x, y, facing = path[min(f, len(path) - 1)]
            im.alpha_composite(monk.crop(((f // 3 % 4) * 32, facing * 32, (f // 3 % 4) * 32 + 32, facing * 32 + 32)), (int(x * T), int(y * T) - 6))
        if dpath:
            x, y, facing = dpath[min(f, len(dpath) - 1)]
            glow = Image.new('RGBA', (T * 2, T * 2), (0, 0, 0, 0)); ImageDraw.Draw(glow).ellipse([4, 14, T * 2 - 4, T * 2 - 2], fill=(26, 122, 138, 90))
            im.alpha_composite(glow, (int(x * T) - T // 2, int(y * T) - 2))
            im.alpha_composite(daemon_sheet.crop(((f // 3 % 4) * 32, facing * 32, (f // 3 % 4) * 32 + 32, facing * 32 + 32)), (int(x * T), int(y * T) - 6))
        im.alpha_composite(top)
        if well:
            for m in range(3):                        # spirits drift up from the well and fade
                t = ((f + m * 14) % 42) / 42
                sp = msheet.crop((m * T, 0, m * T + T, T)).copy()
                sp.putalpha(sp.getchannel('A').point(lambda v, t=t: int(v * (1 - t))))
                im.alpha_composite(sp, ((wx + 1 + m - 1) * T, int((wy + 0.6 - 2.6 * t) * T)))
        frames.append(im.crop((cx0 * T, cy0 * T, (cx0 + cw) * T, (cy0 + ch) * T)).convert('RGB').resize((cw * T // 2, ch * T // 2), Image.NEAREST))
    frames[0].save(os.path.join(OUT, f'{MAP}-walk.gif'), save_all=True, append_images=frames[1:], duration=90, loop=0, optimize=True)
    print(f'ok: {MAP}-walk.gif, {len(frames)} frames')
