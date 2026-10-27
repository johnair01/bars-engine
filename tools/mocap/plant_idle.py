"""Plant a standing idle's feet and let its knees straighten: the legs of an 'Idle' action solved again with two-bone IK.

six-faces-council relationship-creature, mirror round 4. Wendell's note on mirror-light-look-01 (2026-10-26): "The right
knee never unbends which was the weird part of it all". The retarget (retarget_idle.py) copies the CMU subject's legs as
they were: in 77_02 the subject rests on one leg with the other knee soft, so on our figure one knee stayed bent 12 to 28
degrees for the whole loop and that ankle lifted up to 4 cm. This step keeps the upper body, the hips' sway and the
pelvis as retargeted, and solves only the legs:
  - each ankle is planted where the bind pose puts it, foot flat (its world rotation is the bind pose's),
  - each frame the hips sit as high as the farther leg allows with that knee at --straight degrees (a weight-bearing knee
    is nearly straight), so the other knee bends only as much as the sway asks, and the weight passes from leg to leg,
  - each knee bends toward the way it already pointed (the pole), so the thigh's twist is kept.
Nothing is named after one rig: the bone names come in as arguments, so the clothing kit's standard body (a Quaternius
rig, council/callsheets/clothing-kit.md) runs the same step once it carries an Idle. Rotations are quaternions throughout
(docs/3d-math.md rule 1). Walk, mesh and skin stay byte for byte; only the Idle's leg and hips tracks change.

  python3 tools/mocap/plant_idle.py IN.glb OUT.glb [--clip Idle] [--straight 3] [--root hips]
      [--legs hipL,kneeL,ankleL:hipR,kneeR,ankleR]

The check (rerunnable, prints FAIL): python3 tools/mocap/plant_idle.py --check IN.glb [--clip Idle] [same names]
  each knee reaches under --unbent degrees (6) at some point in the loop, neither knee passes --soft degrees (15), and
  each ankle stays within 5 mm of its bind height.
"""
import sys

import numpy as np

sys.path.insert(0, __file__.rsplit('/', 1)[0])
from retarget_idle import add_accessor, qinv, qmul, qnorm, qrot, qswing, read_glb, write_glb  # noqa: E402


def opts(a):
    o = {'clip': 'Idle', 'straight': 3.0, 'sway': 0.25, 'root': 'hips', 'legs': 'hipL,kneeL,ankleL:hipR,kneeR,ankleR',
         'unbent': 6.0, 'soft': 15.0, 'check': False}
    pos = []
    i = 0
    while i < len(a):
        if a[i] == '--check': o['check'] = True; i += 1
        elif a[i].startswith('--'): k = a[i][2:]; v = a[i + 1]; o[k] = type(o[k])(v) if k in o else v; i += 2
        else: pos.append(a[i]); i += 1
    o['legs'] = [tuple(l.split(',')) for l in o['legs'].split(':')]
    return o, pos


class Rig:
    """The GLB's nodes, one action's tracks laid over them, and forward kinematics per frame."""
    def __init__(self, js, bin_, clip):
        self.js, self.bin = js, bin_
        self.nodes = js['nodes']; self.nid = {n.get('name'): i for i, n in enumerate(self.nodes)}
        self.parent = {c: i for i, n in enumerate(self.nodes) for c in n.get('children', [])}
        self.anim = next(an for an in js['animations'] if an['name'] == clip)
        self.tr = {}
        for c in self.anim['channels']:
            s = self.anim['samplers'][c['sampler']]
            self.tr[(self.nodes[c['target']['node']]['name'], c['target']['path'])] = (c, s, self.acc(s['output']).astype(float))
        self.F = len(next(iter(self.tr.values()))[2])

    def acc(self, i):
        a = self.js['accessors'][i]; v = self.js['bufferViews'][a['bufferView']]
        n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]; off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        return np.frombuffer(bytes(self.bin[off:off + a['count'] * n * 4]), np.float32).reshape(-1, n)

    def rest(self, name, path):
        n = self.nodes[self.nid[name]]
        return np.array(n.get(path, [0, 0, 0, 1] if path == 'rotation' else [0, 0, 0]), float)

    def track(self, name, path, rest=False):
        if not rest and (name, path) in self.tr: return self.tr[(name, path)][2].copy()
        return np.tile(self.rest(name, path), (self.F, 1))

    def chain(self, name):
        c = []; i = self.nid[name]
        while True:
            c.append(i)
            if i not in self.parent: return c[::-1]
            i = self.parent[i]

    def world(self, name, rest=False, over=None):
        """World position (head) and rotation of a node, per frame; `over` replaces tracks: {(name, path): array}."""
        over = over or {}
        p = np.zeros((self.F, 3)); q = np.tile([0, 0, 0, 1.0], (self.F, 1))
        for i in self.chain(name):
            n = self.nodes[i]['name']
            t = over.get((n, 'translation'), self.track(n, 'translation', rest))
            r = over.get((n, 'rotation'), self.track(n, 'rotation', rest))
            p = p + qrot(q, t); q = qmul(q, r)
        return p, q


def knee_flex(h, k, a):
    u = h - k; v = a - k
    c = np.sum(u * v, 1) / (np.linalg.norm(u, axis=1) * np.linalg.norm(v, axis=1))
    return 180 - np.degrees(np.arccos(np.clip(c, -1, 1)))


def check(rig, o):
    ok = True
    for hip, knee, ankle in o['legs']:
        h, k, a = (rig.world(b)[0] for b in (hip, knee, ankle))
        f = knee_flex(h, k, a); ra = rig.world(ankle, rest=True)[0][0]
        lift = np.abs(a[:, 1] - ra[1]).max() * 1000
        bad = f.min() > o['unbent'] or f.max() > o['soft'] or lift > 5
        ok &= not bad
        print(f'  {knee}: flex {f.min():.1f}..{f.max():.1f} deg (mean {f.mean():.1f}), ankle height off bind {lift:.1f} mm'
              + ('  FAIL' if bad else ''))
    print('check', 'passes' if ok else 'FAILS', f'(each knee under {o["unbent"]} deg at some point, none past {o["soft"]}, ankles within 5 mm)')
    return ok


def plant(rig, o):
    F, root = rig.F, o['root']
    T = rig.track(root, 'translation')
    # the pelvis over the feet: the subject leaned on one leg for the whole take (hips 5 to 11 cm forward and up to 12 cm
    # to one side, one hip always higher), so the sway is centred over the bind pose's hips and scaled by --sway, and the
    # pelvis keeps its motion about the bind pose's level instead of the take's mean tilt (as retarget_idle.py does for
    # the neck and head)
    T0 = rig.rest(root, 'translation')
    T[:, [0, 2]] = T0[[0, 2]] + (T[:, [0, 2]] - T[:, [0, 2]].mean(0)) * o['sway']
    R = rig.track(root, 'rotation'); R = R * np.sign(np.sum(R * R[0], 1, keepdims=True)); M = qnorm(R.mean(0))
    dev = qmul(R, np.tile(qinv(M), (F, 1)))
    dev = qnorm(np.concatenate([dev[:, :3] * o['sway'], 1 + (dev[:, 3:] - 1) * o['sway']], 1))   # a short slerp from level
    R = qmul(dev, np.tile(rig.rest(root, 'rotation'), (F, 1)))
    over0 = {(root, 'rotation'): R}
    legs = []
    for hip, knee, ankle in o['legs']:
        hr, kr, ar = (rig.world(b, rest=True)[0][0] for b in (hip, knee, ankle))
        l1, l2 = np.linalg.norm(kr - hr), np.linalg.norm(ar - kr)
        s = np.radians(o['straight'])
        reach = np.sqrt(l1 * l1 + l2 * l2 + 2 * l1 * l2 * np.cos(s))   # hip to ankle with the knee at `straight` degrees
        legs.append(dict(hip=hip, knee=knee, ankle=ankle, A=ar, l1=l1, l2=l2, reach=reach,
                         footW=rig.world(ankle, rest=True)[1][0]))
    # the hips' height: as high as the farther leg allows (the bearing knee nearly straight), never above that
    dys = []
    for L in legs:
        v = rig.world(L['hip'], over={**over0, (root, 'translation'): T})[0] - L['A']
        dys.append(np.sqrt(np.maximum(L['reach'] ** 2 - v[:, 0] ** 2 - v[:, 2] ** 2, 0)) - v[:, 1])
    T[:, 1] += np.minimum(*dys)
    over = {**over0, (root, 'translation'): T}
    for L in legs:
        H, Pq = rig.world(L['hip'], over=over)                 # the hip joint's head, and the parent's rotation is below
        parentW = rig.world(rig.nodes[rig.parent[rig.nid[L['hip']]]]['name'], over=over)[1]
        K0 = rig.world(L['knee'], over=over)[0]; A0 = rig.world(L['ankle'], over=over)[0]
        A = np.tile(L['A'], (F, 1)); d = A - H; dist = np.linalg.norm(d, axis=1); dn = d / dist[:, None]
        dist = np.minimum(dist, L['l1'] + L['l2'] - 1e-6)
        # the pole: where the knee pointed, off the hip-to-ankle line (falls back to forward, +z)
        pole = K0 - (H + dn * np.sum((K0 - H) * dn, 1, keepdims=True))
        fw = np.tile([0, 0, 1.0], (F, 1)); fw = fw - dn * np.sum(fw * dn, 1, keepdims=True)
        small = np.linalg.norm(pole, axis=1) < 1e-4; pole[small] = fw[small]
        pole = pole / np.linalg.norm(pole, axis=1, keepdims=True)
        x = (L['l1'] ** 2 - L['l2'] ** 2 + dist ** 2) / (2 * dist); y = np.sqrt(np.maximum(L['l1'] ** 2 - x ** 2, 0))
        K = H + dn * x[:, None] + pole * y[:, None]
        # thigh: swing its current world rotation so its child (the knee) lands on K; the twist rides along
        Wt = Pq
        Wt = qmul(qswing(K0 - H, K - H), Wt)
        Lt = qmul(qinv(parentW), Wt)
        Ks = rig.world(L['knee'], over={**over, (L['hip'], 'rotation'): Lt})[1]
        Ws = qmul(qswing(qrot(Ks, np.tile(rig.rest(L['ankle'], 'translation'), (F, 1))), A - K), Ks)
        Ls = qmul(qinv(Wt), Ws)
        La = qmul(qinv(Ws), np.tile(L['footW'], (F, 1)))      # the foot flat, as bound
        over[(L['hip'], 'rotation')] = qnorm(Lt); over[(L['knee'], 'rotation')] = qnorm(Ls); over[(L['ankle'], 'rotation')] = qnorm(La)
    return over


def write(rig, over, out):
    js, bin_ = rig.js, rig.bin
    for (name, path), arr in over.items():
        if path == 'rotation':   # one hemisphere along the track, as the retarget writes them
            for i in range(1, len(arr)):
                if np.dot(arr[i], arr[i - 1]) < 0: arr[i] = -arr[i]
        if (name, path) in rig.tr:
            c, s, _ = rig.tr[(name, path)]
            s['output'] = add_accessor(js, bin_, arr, 'VEC4' if path == 'rotation' else 'VEC3')
        else:
            times = next(iter(rig.tr.values()))[1]['input']
            rig.anim['samplers'].append({'input': times, 'output': add_accessor(js, bin_, arr, 'VEC4' if path == 'rotation' else 'VEC3'), 'interpolation': 'LINEAR'})
            rig.anim['channels'].append({'sampler': len(rig.anim['samplers']) - 1, 'target': {'node': rig.nid[name], 'path': path}})
    rig.anim.setdefault('extras', {})['planted'] = 'tools/mocap/plant_idle.py: legs by two-bone IK, feet flat at bind, bearing knee at most a few degrees'
    # drop the accessors and buffer bytes nothing points at any more (the old leg tracks), so the file does not grow
    used = set()
    for m in js.get('meshes', []):
        for p in m['primitives']:
            used |= set(p['attributes'].values()); used.add(p.get('indices'))
            for t in p.get('targets', []): used |= set(t.values())
    for sk in js.get('skins', []): used.add(sk.get('inverseBindMatrices'))
    for an in js['animations']:
        for s in an['samplers']: used |= {s['input'], s['output']}
    used.discard(None)
    keep = sorted(used); amap = {old: new for new, old in enumerate(keep)}
    views = sorted({js['accessors'][i]['bufferView'] for i in keep} | {im['bufferView'] for im in js.get('images', []) if 'bufferView' in im})
    vmap = {old: new for new, old in enumerate(views)}; nb = bytearray()
    newviews = []
    for v in views:
        bv = dict(js['bufferViews'][v]); off = bv.get('byteOffset', 0)
        while len(nb) % 4: nb.append(0)
        chunk = bin_[off:off + bv['byteLength']]; bv['byteOffset'] = len(nb); nb += chunk; newviews.append(bv)
    accs = []
    for i in keep:
        a = dict(js['accessors'][i]); a['bufferView'] = vmap[a['bufferView']]; accs.append(a)
    js['accessors'], js['bufferViews'] = accs, newviews
    for im in js.get('images', []):
        if 'bufferView' in im: im['bufferView'] = vmap[im['bufferView']]
    for m in js.get('meshes', []):
        for p in m['primitives']:
            p['attributes'] = {k: amap[v] for k, v in p['attributes'].items()}
            if 'indices' in p: p['indices'] = amap[p['indices']]
            if 'targets' in p: p['targets'] = [{k: amap[v] for k, v in t.items()} for t in p['targets']]
    for sk in js.get('skins', []):
        if 'inverseBindMatrices' in sk: sk['inverseBindMatrices'] = amap[sk['inverseBindMatrices']]
    for an in js['animations']:
        for s in an['samplers']: s['input'] = amap[s['input']]; s['output'] = amap[s['output']]
    write_glb(out, js, nb)


def main():
    o, pos = opts(sys.argv[1:])
    js, bin_ = read_glb(pos[0])
    rig = Rig(js, bin_, o['clip'])
    if o['check']:
        sys.exit(0 if check(rig, o) else 1)
    print('before'); check(rig, o)
    over = plant(rig, o)
    write(rig, over, pos[1])
    js2, bin2 = read_glb(pos[1]); print('after'); ok = check(Rig(js2, bin2, o['clip']), o)
    print('wrote', pos[1]); sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
