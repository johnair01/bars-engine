"""Retarget a CMU mocap trial onto Average Dusk's rig as a looping 'Idle' action, with quaternions throughout.

six-faces-council relationship-creature, "Mirror light and standing idle build" (Wendell's rule lt-idle-default: any figure
not moving or sitting plays a real standing idle). docs/3d-math.md rules 1 and 2: rotations are quaternions, every BVH
frame is turned into a quaternion whole (no Euler curve is sampled between frames), and each bone's roll residual is
printed. No Blender needed: the BVH is read here, the rig is read from the GLB's own nodes, and the action is appended
to the GLB's JSON and binary chunks, so the mesh, skin and the 'Walk' action stay byte for byte as they were.

  python3 tools/mocap/retarget_idle.py IN.glb TRIAL.bvh OUT.glb [--seconds 4] [--fps 30] [--blend 0.6] [--start S]

Mocap: CMU Graphics Lab Motion Capture Database, http://mocap.cs.cmu.edu/ (the data used in this project was obtained
from mocap.cs.cmu.edu; the database was created with funding from NSF EIA-0196217), Bruce Hahne's BVH conversion via
https://github.com/una-dinosauria/cmu-mocap. The BVH itself is not stored in the repo.

Method, per target bone b (source rotation joint r, source direction joint a -> c):
  Y   the yaw that turns the subject to face +z (mean over the window, from the hip line),
  O   the swing taking the source rest direction (a -> c, BVH rest is all zero rotations) onto b's rest direction,
  D   = Y S_r(t) O^-1, the source's world rotation since rest, with the rest poses aligned (T-pose onto A-pose),
  D'  = swing(D d_b -> Y (p_c(t) - p_a(t))) D, so the bone points exactly where the source points,
  world(b) = D' R_b, and local(b) = world(parent)^-1 world(b).
The hips keep the subject's sway (scaled by leg length) and their height is set each frame so the lower ankle stays at
its rest height (feet stay on the floor whatever the subject's knee bend). The loop is a window of whole frames chosen
where the end pose best matches the start, and its first `blend` seconds are a slerp from the frames just past the end
into the start, so the last key equals the first.
"""
import json
import struct
import sys

import numpy as np

# ---------- quaternions, (x, y, z, w) like glTF ----------
def qmul(a, b):
    ax, ay, az, aw = np.moveaxis(a, -1, 0); bx, by, bz, bw = np.moveaxis(b, -1, 0)
    return np.stack([aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
                     aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz], -1)
def qinv(q): return q * np.array([-1, -1, -1, 1.0])
def qrot(q, v):
    p = np.concatenate([v, np.zeros(v.shape[:-1] + (1,))], -1)
    return qmul(qmul(q, p), qinv(q))[..., :3]
def qaxis(axis, ang):
    axis = np.asarray(axis, float); s = np.sin(ang / 2)[..., None]
    return np.concatenate([axis * s, np.cos(ang / 2)[..., None]], -1)
def qswing(u, v):
    """The shortest rotation taking unit u onto unit v (arrays of vectors)."""
    u = u / np.linalg.norm(u, axis=-1, keepdims=True); v = v / np.linalg.norm(v, axis=-1, keepdims=True)
    c = np.cross(u, v); w = 1 + np.sum(u * v, -1, keepdims=True)
    q = np.concatenate([c, w], -1)
    bad = w[..., 0] < 1e-8   # opposite: any perpendicular axis
    if np.any(bad):
        perp = np.cross(u[bad], np.array([1.0, 0, 0])); small = np.linalg.norm(perp, axis=-1) < 1e-6
        perp[small] = np.cross(u[bad][small], np.array([0, 0, 1.0]))
        q[bad] = np.concatenate([perp, np.zeros((perp.shape[0], 1))], -1)
    return q / np.linalg.norm(q, axis=-1, keepdims=True)
def qnorm(q): return q / np.linalg.norm(q, axis=-1, keepdims=True)
def qslerp(a, b, t):
    d = np.sum(a * b, -1, keepdims=True); b = np.where(d < 0, -b, b); d = np.abs(d)
    t = np.asarray(t, float)[..., None] if np.ndim(t) else t
    lin = d > 0.9995
    th = np.arccos(np.clip(d, -1, 1)); s = np.sin(th)
    wa = np.where(lin, 1 - t, np.sin((1 - t) * th) / np.where(lin, 1, s)); wb = np.where(lin, t, np.sin(t * th) / np.where(lin, 1, s))
    return qnorm(wa * a + wb * b)
def qangle(a, b): return 2 * np.arccos(np.clip(np.abs(np.sum(a * b, -1)), 0, 1))

# ---------- BVH ----------
def read_bvh(path):
    tok = open(path).read().split(); i = 0
    joints = []   # dicts: name, parent, offset, channels
    stack = []
    while tok[i] != 'MOTION':
        t = tok[i]
        if t == 'HIERARCHY': i += 1
        elif t in ('ROOT', 'JOINT'):
            joints.append({'name': tok[i + 1], 'parent': stack[-1] if stack else -1, 'channels': [], 'end': None}); i += 2
        elif t == 'End':
            i += 2; assert tok[i] == '{' and tok[i + 1] == 'OFFSET'
            joints[stack[-1]]['end'] = np.array([float(x) for x in tok[i + 2:i + 5]]); i += 6   # { OFFSET x y z }
        elif t == '{': stack.append(len(joints) - 1); i += 1
        elif t == '}': stack.pop(); i += 1
        elif t == 'OFFSET': joints[-1]['offset'] = np.array([float(x) for x in tok[i + 1:i + 4]]); i += 4
        elif t == 'CHANNELS':
            n = int(tok[i + 1]); joints[-1]['channels'] = tok[i + 2:i + 2 + n]; i += 2 + n
        else: raise ValueError(t)
    n = int(tok[i + 2]); ft = float(tok[i + 5]); data = np.array(tok[i + 6:], float).reshape(n, -1)
    return joints, data, ft

def bvh_fk(joints, data):
    """World rotations (F, J, 4) and joint positions (F, J, 3); each frame's Euler angles become one quaternion."""
    F, J = data.shape[0], len(joints)
    rot = np.zeros((F, J, 4)); pos = np.zeros((F, J, 3)); col = 0
    for j, jt in enumerate(joints):
        q = np.tile([0, 0, 0, 1.0], (F, 1)); tr = None
        for ch in jt['channels']:
            v = data[:, col]; col += 1
            if ch.endswith('position'):
                tr = np.zeros((F, 3)) if tr is None else tr; tr[:, 'XYZ'.index(ch[0])] = v
            else:
                q = qmul(q, qaxis(np.eye(3)['XYZ'.index(ch[0])], np.radians(v)))   # intrinsic, in the listed order
        jt['q'] = q; jt['t'] = tr
    for j, jt in enumerate(joints):
        p = jt['parent']
        if p < 0: rot[:, j] = jt['q']; pos[:, j] = jt['offset'] + (jt['t'] if jt['t'] is not None else 0)
        else: rot[:, j] = qmul(rot[:, p], jt['q']); pos[:, j] = pos[:, p] + qrot(rot[:, p], np.tile(jt['offset'], (F, 1)))
    return rot, pos

# ---------- GLB ----------
def read_glb(path):
    d = open(path, 'rb').read()
    jl = struct.unpack('<I', d[12:16])[0]; js = json.loads(d[20:20 + jl])
    bl = struct.unpack('<I', d[20 + jl:24 + jl])[0]; bin_ = bytearray(d[28 + jl:28 + jl + bl])
    return js, bin_

def write_glb(path, js, bin_):
    while len(bin_) % 4: bin_.append(0)
    js['buffers'][0]['byteLength'] = len(bin_)
    j = json.dumps(js, separators=(',', ':')).encode(); j += b' ' * ((4 - len(j) % 4) % 4)
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(j) + 8 + len(bin_)) + struct.pack('<II', len(j), 0x4E4F534A) + j + struct.pack('<II', len(bin_), 0x004E4942) + bytes(bin_)
    open(path, 'wb').write(out)

def add_accessor(js, bin_, arr, typ, minmax=False):
    while len(bin_) % 4: bin_.append(0)
    arr = np.ascontiguousarray(arr, np.float32); off = len(bin_); bin_ += arr.tobytes()
    js['bufferViews'].append({'buffer': 0, 'byteOffset': off, 'byteLength': arr.nbytes})
    acc = {'bufferView': len(js['bufferViews']) - 1, 'componentType': 5126, 'count': arr.shape[0], 'type': typ}
    if minmax: acc['min'] = [float(arr.min())]; acc['max'] = [float(arr.max())]
    js['accessors'].append(acc); return len(js['accessors']) - 1

# ---------- the map: target bone -> (source rotation joint, direction from, direction to) ----------
MAP = {
    'hips': ('Hips', 'Hips', 'Spine'), 'spine': ('Spine1', 'LowerBack', 'Neck'), 'neck': ('Neck1', 'Neck', 'Head'), 'head': ('Head', 'Head', 'Head:end'),
    'shoulderL': ('LeftArm', 'LeftArm', 'LeftForeArm'), 'elbowL': ('LeftForeArm', 'LeftForeArm', 'LeftHand'), 'wristL': ('LeftHand', 'LeftHand', 'LeftHandIndex1'),
    'shoulderR': ('RightArm', 'RightArm', 'RightForeArm'), 'elbowR': ('RightForeArm', 'RightForeArm', 'RightHand'), 'wristR': ('RightHand', 'RightHand', 'RightHandIndex1'),
    'hipL': ('LeftUpLeg', 'LeftUpLeg', 'LeftLeg'), 'kneeL': ('LeftLeg', 'LeftLeg', 'LeftFoot'), 'ankleL': ('LeftFoot', 'LeftFoot', 'LeftToeBase'),
    'hipR': ('RightUpLeg', 'RightUpLeg', 'RightLeg'), 'kneeR': ('RightLeg', 'RightLeg', 'RightFoot'), 'ankleR': ('RightFoot', 'RightFoot', 'RightToeBase'),
}

def main():
    a = sys.argv[1:]; opt = lambda k, d: float(a[a.index(k) + 1]) if k in a else d
    glb_in, bvh, glb_out = a[0], a[1], a[2]
    SECONDS, FPS, BLEND, START = opt('--seconds', 4.0), opt('--fps', 30.0), opt('--blend', 0.6), opt('--start', -1)
    joints, data, ft = read_bvh(bvh)
    step = max(1, round(1 / (FPS * ft)))   # whole source frames only (rule 1)
    data = data[::step]; FPS = 1 / (ft * step)
    srot, spos = bvh_fk(joints, data)
    names = [j['name'] for j in joints]; F = data.shape[0]
    def P(n):   # source joint position track, 'X:end' for an end site
        if n.endswith(':end'):
            j = names.index(n[:-4]); return spos[:, j] + qrot(srot[:, j], np.tile(joints[j]['end'], (F, 1)))
        return spos[:, names.index(n)]
    srest = {}   # rest positions: BVH rest is all zero rotations
    for j, jt in enumerate(joints): srest[jt['name']] = (srest[joints[jt['parent']]['name']] if jt['parent'] >= 0 else np.zeros(3)) + jt['offset']
    for j, jt in enumerate(joints):
        if jt['end'] is not None: srest[jt['name'] + ':end'] = srest[jt['name']] + jt['end']

    # the loop window: N frames, the end pose closest to the start pose, among the calmest stretches
    N = int(round(SECONDS * FPS)); B = int(round(BLEND * FPS))
    used = [names.index(MAP[b][0]) for b in MAP]
    vel = np.concatenate([[0], qangle(srot[1:, used], srot[:-1, used]).sum(1)])
    hipv = np.linalg.norm(np.diff(P('Hips')[:, [0, 2]], axis=0), axis=1)
    footv = np.linalg.norm(np.diff(P('LeftFoot'), axis=0), axis=1) + np.linalg.norm(np.diff(P('RightFoot'), axis=0), axis=1)
    best, bs = None, 1e9
    starts = [int(START * FPS)] if START >= 0 else range(0, F - N - B - 1, 2)
    for s in starts:
        e = s + N
        pose = qangle(srot[s, used], srot[e, used]).sum() + 0.05 * np.linalg.norm(P('Hips')[s] - P('Hips')[e])
        calm = vel[s:e + B].mean() * 3 + hipv[s:e + B].sum() * 0.02 + footv[s:e + B].sum() * 0.2   # inches of hip travel a little, of foot travel a lot (an idle does not step)
        if pose + calm < bs: bs, best = pose + calm, s
    s0 = best; idx = np.arange(s0, s0 + N + B)
    srot, spos = srot[idx], spos[idx]; F = len(idx)
    print(f'foot travel in window {footv[s0:s0 + N + B].sum() * 2.54:.1f} cm (source units x2.54)'); print(f'window: source frames {s0 * step}..{(s0 + N + B) * step} of {data.shape[0] * step} at {FPS:.1f} fps, start-end pose error {qangle(srot[0, used], srot[N, used]).sum():.3f} rad summed')

    # face +z: the subject's right -> left hip line onto +x, averaged over the window
    hl = P('LeftUpLeg') - P('RightUpLeg'); hl = hl.mean(0); yaw = np.arctan2(-hl[2], hl[0])   # angle of the hip line from +x about +y
    Y = qaxis([0, 1, 0], np.array(-yaw)); Yb = np.tile(Y, (F, 1))
    Ywork = lambda q: qmul(Yb, q)   # the whole capture turned by Y (rest is all zero rotations, facing +z, left at +x)
    # sanity: after Y the left hip is at +x and the chest faces +z
    chk = qrot(Yb, P('LeftUpLeg') - P('RightUpLeg')).mean(0); print('hip line after yaw (x, z):', np.round(chk[[0, 2]], 2))

    # ---------- the target rig ----------
    js, bin_ = read_glb(glb_in)
    nodes = js['nodes']; nid = {n.get('name'): i for i, n in enumerate(nodes)}
    parent = {}
    for i, n in enumerate(nodes):
        for c in n.get('children', []): parent[c] = i
    def local(i): n = nodes[i]; return np.array(n.get('translation', [0, 0, 0]), float), np.array(n.get('rotation', [0, 0, 0, 1]), float)
    def world_rest(i):
        t, q = local(i)
        if i in parent: pt, pq = world_rest(parent[i]); return pt + qrot(pq, t), qmul(pq, q)
        return t, q
    skin = js['skins'][0]['joints']
    bones = [nodes[j]['name'] for j in skin]
    rest = {b: world_rest(nid[b]) for b in bones}
    def tdir(b):   # the bone's rest direction: to its child, or its own +Y for a leaf
        ch = [nodes[c]['name'] for c in nodes[nid[b]].get('children', []) if nodes[c]['name'] in MAP]
        if ch and b != 'hips':
            if b == 'spine': ch = ['neck']
            return rest[ch[0]][0] - rest[b][0]
        return qrot(rest[b][1], np.array([0, 1.0, 0]))

    W = {}; roll = {}; corr = {}
    for b, (r, fa, fc) in MAP.items():
        Rb = np.tile(rest[b][1], (F, 1)); db = tdir(b); db = db / np.linalg.norm(db)
        dsr = srest[fc] - srest[fa]
        O = np.tile(qswing(dsr[None], db[None])[0], (F, 1))
        D = qmul(Ywork(srot[:, names.index(r)]), qinv(O))
        dnow = qrot(Yb, spos_end(joints, names, srot, spos, fc) - spos_end(joints, names, srot, spos, fa))
        Dp = qmul(qswing(qrot(D, np.tile(db, (F, 1))), dnow), D)
        W[b] = qmul(Dp, Rb)
        corr[b] = np.degrees(qangle(Dp, D)).max()
        # rule 2: roll residual, the target's X axis against the source's X axis carried the same way, about the bone
        xt = qrot(W[b], np.tile([1.0, 0, 0], (F, 1))); xs = qrot(qmul(D, Rb), np.tile([1.0, 0, 0], (F, 1)))
        dd = dnow / np.linalg.norm(dnow, axis=1, keepdims=True)
        pt = xt - np.sum(xt * dd, 1, keepdims=True) * dd; ps = xs - np.sum(xs * dd, 1, keepdims=True) * dd
        cosr = np.sum(pt * ps, 1) / (np.linalg.norm(pt, axis=1) * np.linalg.norm(ps, axis=1) + 1e-9)
        roll[b] = np.degrees(np.arccos(np.clip(cosr, -1, 1))).max()
    print('per bone: max direction correction / max roll residual (deg)')
    for b in MAP: print(f'  {b:10s} {corr[b]:6.1f} {roll[b]:6.1f}' + ('  FAIL' if roll[b] > 10 else ''))

    # local rotations
    L = {}
    for b in MAP:
        p = parent[nid[b]]; pn = nodes[p]['name']
        L[b] = qmul(qinv(W[pn]), W[b]) if pn in W else qmul(qinv(np.tile(world_rest(p)[1], (F, 1))), W[b])
    for b in bones:
        if b not in L: L[b] = np.tile(local(nid[b])[1], (F, 1))   # the hem bones keep their rest
    # CMU's neck and head hang forward of its rest skeleton (the 2026-10-18 notes: the head pitches down), so the neck and
    # head keep the subject's motion about our rest instead: L'(t) = L(t) M^-1 R0, M the window's mean local rotation
    for b in ('neck', 'head'):
        q = L[b] * np.sign(np.sum(L[b] * L[b][0], 1, keepdims=True)); M = qnorm(q.mean(0)); R0 = local(nid[b])[1]
        print(f'  {b}: mean offset from rest {np.degrees(qangle(M, R0)):.1f} deg removed')
        L[b] = qmul(qmul(L[b], np.tile(qinv(M), (F, 1))), np.tile(R0, (F, 1)))
    # hips: sway from the source (scaled by leg length), height so the lower ankle stays at its rest height
    sleg = np.linalg.norm(srest['LeftLeg'] - srest['LeftUpLeg']) + np.linalg.norm(srest['LeftFoot'] - srest['LeftLeg'])
    tleg = np.linalg.norm(rest['kneeL'][0] - rest['hipL'][0]) + np.linalg.norm(rest['ankleL'][0] - rest['kneeL'][0])
    k = tleg / sleg
    # the hips relative to the feet, so a drift of the whole subject never moves the figure off its spot
    feet = (spos[:, names.index('LeftFoot')] + spos[:, names.index('RightFoot')]) / 2
    hp = qrot(Yb, spos[:, names.index('Hips')] - feet); hp = (hp - hp.mean(0)) * k
    ht, _ = local(nid['hips'])
    T = np.tile(ht, (F, 1)); T[:, 0] += hp[:, 0]; T[:, 2] += hp[:, 2]
    # FK on the target for ankle heights (hips' parent, the Rig, is the identity)
    def fk_pos(name, Tt):
        chain = []; i = nid[name]
        while i in parent and nodes[i]['name'] != 'Rig': chain.append(i); i = parent[i]
        pos = np.zeros((F, 3)); q = np.tile([0, 0, 0, 1.0], (F, 1))
        for i in reversed(chain):
            t = Tt if nodes[i]['name'] == 'hips' else np.tile(local(i)[0], (F, 1))
            pos = pos + qrot(q, t); q = qmul(q, L[nodes[i]['name']])
        return pos
    rest_ankle = rest['ankleL'][0][1]
    T = np.tile(ht, (F, 1))   # the sway comes from the legs themselves: the hips go where the feet stay put
    aL, aR = fk_pos('ankleL', T), fk_pos('ankleR', T)
    mid = (aL + aR) / 2; rmid = (rest['ankleL'][0] + rest['ankleR'][0]) / 2
    T[:, 0] -= mid[:, 0] - rmid[0]; T[:, 2] -= mid[:, 2] - rmid[2]
    T[:, 1] += rest_ankle - np.minimum(aL[:, 1], aR[:, 1])
    aL, aR = fk_pos('ankleL', T), fk_pos('ankleR', T)
    slide = max(np.ptp(aL[:, [0, 2]], axis=0).max(), np.ptp(aR[:, [0, 2]], axis=0).max())
    print(f'feet: each ankle moves at most {slide * 100:.1f} cm over the window (the pair stays centred); source hips-over-feet sway was x {np.ptp(hp[:, 0]) * 100:.1f} z {np.ptp(hp[:, 2]) * 100:.1f} cm')
    print(f'leg scale {k:.4f}, hips height {T[:, 1].min():.3f}..{T[:, 1].max():.3f} (rest {ht[1]:.3f}), sway x {np.ptp(T[:, 0]) * 100:.1f} cm z {np.ptp(T[:, 2]) * 100:.1f} cm')

    # the seam: the first B frames slerp from the frames just past the end into the start, so key N equals key 0
    out = {}
    for b in bones:
        q = L[b].copy()
        for i in range(1, len(q)):   # one hemisphere along the track
            if np.dot(q[i], q[i - 1]) < 0: q[i] = -q[i]
        head = q[:N + 1].copy()
        for i in range(B):
            w = (i / B) ** 2 * (3 - 2 * i / B)
            head[i] = qslerp(q[N + i][None], q[i][None], w)[0]
        head[N] = head[0]
        out[b] = head
    Tt = T[:N + 1].copy()
    for i in range(B):
        w = (i / B) ** 2 * (3 - 2 * i / B); Tt[i] = T[N + i] * (1 - w) + T[i] * w
    Tt[N] = Tt[0]
    seam = max(np.degrees(qangle(out[b][N - 1], out[b][N])).max() for b in bones)
    print(f'loop {N} frames + 1 ({N / FPS:.2f} s), blend {B} frames; largest step at the seam {seam:.2f} deg')

    # ---------- the action, appended ----------
    js['animations'] = [an for an in js['animations'] if an['name'] != 'Idle']
    times = add_accessor(js, bin_, np.arange(N + 1) / FPS, 'SCALAR', minmax=True)
    samplers, channels = [], []
    for b in bones:
        samplers.append({'input': times, 'output': add_accessor(js, bin_, out[b], 'VEC4'), 'interpolation': 'LINEAR'})
        channels.append({'sampler': len(samplers) - 1, 'target': {'node': nid[b], 'path': 'rotation'}})
    samplers.append({'input': times, 'output': add_accessor(js, bin_, Tt, 'VEC3'), 'interpolation': 'LINEAR'})
    channels.append({'sampler': len(samplers) - 1, 'target': {'node': nid['hips'], 'path': 'translation'}})
    js['animations'].append({'name': 'Idle', 'samplers': samplers, 'channels': channels,
                             'extras': {'source': 'CMU mocap ' + bvh.split('/')[-1] + ' (mocap.cs.cmu.edu)', 'window_frames': [int(s0 * step), int((s0 + N) * step)], 'fps': FPS}})
    write_glb(glb_out, js, bin_)
    print('wrote', glb_out, 'animations', [an['name'] for an in js['animations']])

def spos_end(joints, names, srot, spos, n):
    if n.endswith(':end'):
        j = names.index(n[:-4]); return spos[:, j] + qrot(srot[:, j], np.tile(joints[j]['end'], (srot.shape[0], 1)))
    return spos[:, names.index(n)]

if __name__ == '__main__':
    main()
