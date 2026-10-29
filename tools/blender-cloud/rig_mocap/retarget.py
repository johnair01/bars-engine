"""Retarget a BVH walk onto a Rigify game skeleton whose rest pose differs (A-pose vs T-pose).
Per bone: R_T(t) = R_S(t) @ R_S_rest^-1 @ Q^-1 @ R_T_rest, Q = minimal rotation taking the source rest bone
direction to the target's. One gait cycle is found by pose matching, resampled to 24 fps, made to loop in place
(hips forward travel removed by a linear detrend; sway and bob kept), and keyed as action 'MocapWalk'.
Options after the three paths: --action NAME (default MocapWalk; MocapRun for a run) and --period LO,HI, the cycle's
length range in source frames at 120 fps (default 90,200, a walk; a run's cycle is about 0.6 s, so 55,110).
The cycle's travel per loop in the figure's metres is stored on the action as 'travel_m', for the game's foot speed."""
import bpy,sys,math
from mathutils import Matrix,Quaternion,Vector
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[-3:]
opt={argv[i]:argv[i+1] for i in range(len(argv)-1) if argv[i].startswith('--')}
blend,bvh,out=[a for i,a in enumerate(argv) if not a.startswith('--') and not (i and argv[i-1].startswith('--'))]
ACT=opt.get('--action','MocapWalk')
PLO,PHI=map(int,opt.get('--period','90,200').split(','))
bpy.ops.wm.open_mainfile(filepath=blend)
sc=bpy.context.scene; sc.render.fps=24
T=bpy.data.objects['GAME_RIG_Figure']
for pb in T.pose.bones:
    for c in pb.constraints: c.mute=True
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.import_anim.bvh(filepath=bvh, global_scale=1.0, rotate_mode='NATIVE', update_scene_fps=False, update_scene_duration=False)
S=bpy.context.object
MAP={'Hips':'spine','LowerBack':'spine.001','Spine':'spine.002','Spine1':'spine.003','Neck':'spine.004','Neck1':'spine.005','Head':'spine.006'}
for sd,td in (('Left','L'),('Right','R')):
    MAP.update({sd+'Shoulder':'shoulder.'+td, sd+'Arm':'upper_arm.'+td, sd+'ForeArm':'forearm.'+td, sd+'Hand':'hand.'+td,
                sd+'UpLeg':'thigh.'+td, sd+'Leg':'shin.'+td, sd+'Foot':'foot.'+td, sd+'ToeBase':'toe.'+td})
INV={v:k for k,v in MAP.items()}
Srw=S.matrix_world
def srest(n): return (Srw@S.data.bones[n].matrix_local).to_3x3()
Trest={b.name:b.matrix_local.copy() for b in T.data.bones}
# alignment Q per source bone (dummy/zero-length bones inherit the parent's Q)
Q={}
def qfor(n):
    if n in Q: return Q[n]
    b=S.data.bones[n]
    if n=='Hips': q=Quaternion()
    elif b.length<0.2 or n not in MAP: q=qfor(b.parent.name) if b.parent else Quaternion()
    else:
        ds=(srest(n)@Vector((0,1,0))).normalized(); dt=(Trest[MAP[n]].to_3x3()@Vector((0,1,0))).normalized()
        q=ds.rotation_difference(dt)
    Q[n]=q; return q
for n in MAP: qfor(n)
# --- find one gait cycle (120 fps source) by pose matching
legs=['LeftUpLeg','LeftLeg','RightUpLeg','RightLeg']
f0,f1=int(S.animation_data.action.frame_range[0]),int(S.animation_data.action.frame_range[1])
feat={}
for f in range(f0,f1+1):
    sc.frame_set(f); feat[f]=[S.pose.bones[n].matrix_basis.to_quaternion() for n in legs]
def dist(a,b): return sum(1-abs(x.dot(y)) for x,y in zip(feat[a],feat[b]))
best=None
for start in range(f0+min(20,PLO//4),f0+min(80,max(25,f1-f0-PHI))):
    for P in range(PLO,PHI):
        if start+P>f1-5: break
        d=dist(start,start+P)
        if best is None or d<best[0]: best=(d,start,P)
d,start,P=best
N=round(P/5.0)  # output frames at 24 fps
print('cycle start',start,'P',P,'(%.3fs)'%(P/120),'N',N,'match',round(d,5))
def src_world(fr):
    sc.frame_set(int(fr), subframe=fr-int(fr))
    return {n:(Srw@S.pose.bones[n].matrix) for n in MAP}
leg_s=S.data.bones['LeftUpLeg'].length+S.data.bones['LeftLeg'].length
leg_t=sum(T.data.bones[n].length for n in ('thigh.L','thigh.L.001','shin.L','shin.L.001'))
ratio=leg_t/leg_s
order=[b.name for b in T.data.bones]  # parents come before children
def build(corr):
    out=[]
    for k in range(N):
        W=src_world(start+k*P/N)
        M={}
        for name in order:
            b=T.data.bones[name]
            rest_rel=(b.parent.matrix_local.inverted()@b.matrix_local) if b.parent else b.matrix_local.copy()
            base=(M[b.parent.name]@rest_rel) if b.parent else rest_rel
            if name in INV:
                sn=INV[name]
                R=W[sn].to_3x3().normalized()@srest(sn).inverted()@Q[sn].to_matrix().inverted()@Trest[name].to_3x3()
                if name in corr: R=corr[name]@R
                m=R.to_4x4(); m.translation=base.translation
                if name=='spine': m.translation=Vector(W['Hips'].translation)
                M[name]=m
            else: M[name]=base
        out.append((M,W))
    return out
# Level the figure: the CMU subject carries its own posture (head pitched down ~15 deg, torso and head turned a few
# degrees off the walking direction). Measure each spine-chain bone's mean world rotation over the cycle, then take
# out the mean yaw of every bone and the mean pitch of the head and the neck above it. Sway, bob and the cycle's
# own swing stay, because only the cycle mean goes.
LEVEL_YAW=('spine','spine.001','spine.002','spine.003','spine.004','spine.005','spine.006')
LEVEL_PITCH=('spine.005','spine.006')
# The shoulders (clavicles) are levelled whole: the CMU subjects carry them raised 15-20 degrees above our figure's rest
# on average, which read as a shrug in the game (Wendell, 2026-10-18: "The rigging's shoulders are a little too high").
# Their mean turn over the cycle goes, so they sit at the figure's rest and keep only the clip's swing about it.
LEVEL_FULL=('shoulder.L','shoulder.R')
def mean_delta(frames):
    acc={n:[0.0,0.0,0.0] for n in LEVEL_YAW}
    for M,_ in frames:
        for n in LEVEL_YAW:
            e=(M[n].to_3x3()@Trest[n].to_3x3().inverted()).to_euler('XYZ')
            for i in range(3): acc[n][i]+=e[i]/N
    return acc
def mean_turn(frames,n):
    qs=[(M[n].to_3x3()@Trest[n].to_3x3().inverted()).to_quaternion() for M,_ in frames]
    a=Quaternion((0,0,0,0))
    for q in qs:
        if q.dot(qs[0])<0: q.negate()
        a=Quaternion([x+y for x,y in zip(a,q)])
    return a.normalized()
raw=build({})
mean=mean_delta(raw)
corr={}
for n in LEVEL_YAW:
    pitch=mean[n][0] if n in LEVEL_PITCH else 0.0
    corr[n]=Matrix.Rotation(-mean[n][2],3,'Z')@Matrix.Rotation(-pitch,3,'X')
    print('level',n,'yaw',round(math.degrees(mean[n][2]),1),'pitch',round(math.degrees(mean[n][0]),1))
for n in LEVEL_FULL:
    q=mean_turn(raw,n); corr[n]=q.inverted().to_matrix()
    print('level',n,'mean turn',round(math.degrees(q.angle),1))
frames=[M for M,_ in build(corr)]
W=raw[-1][1]
# hips translation: scale, detrend forward travel, put the lowest ankle at the rest ankle height
hp=[fr['spine'].translation.copy() for fr in frames]
# leg-length scale about the cycle mean
mean=sum(hp,Vector())/N
v=(hp[-1]-hp[0])/(N-1)*N/N  # per-frame travel ~ (end-start)/(N-1); use exact cycle travel
travel=(Vector(W['Hips'].translation) if False else None)
sc.frame_set(start); a=(Srw@S.pose.bones['Hips'].matrix).translation.copy()
sc.frame_set(start+P); b=(Srw@S.pose.bones['Hips'].matrix).translation.copy()
step=(b-a)/N; step.z=0
dt=[hp[k]-step*k for k in range(N)]; mean=sum(dt,Vector())/N
travel_m=(b-a).xy.length*ratio
print('source travel per cycle',[round(x,2) for x in (b-a)],'-> speed m/s(target scale)',round(travel_m/(P/120),3),'travel_m',round(travel_m,3))
def recompute(shift):
    for k,fr in enumerate(frames):
        p=(hp[k]-step*k-mean)*ratio+shift
        delta=p-fr['spine'].translation
        for name in order:
            if name=='root': continue
            fr[name].translation=fr[name].translation  # placeholder
        fr['_hips']=p
recompute(Vector((0,0,0.96)))
# rebuild translations down the chain with the new hips position
def rebuild():
    for fr in frames:
        for name in order:
            b=T.data.bones[name]
            if name=='spine': fr[name].translation=fr['_hips']; continue
            if b.parent:
                rest_rel=b.parent.matrix_local.inverted()@b.matrix_local
                fr[name].translation=(fr[b.parent.name]@rest_rel).translation
rebuild()
amin=min(min(fr['foot.L'].translation.z,fr['foot.R'].translation.z) for fr in frames)
dz=Trest['foot.L'].translation.z-amin
for fr in frames: fr['_hips'].z+=dz
rebuild()
print('hips z shift',round(dz,3),'ratio',round(ratio,4))
# key it
act=bpy.data.actions.new(ACT); act['travel_m']=round(travel_m,4); act.use_fake_user=True  # a second clip keeps the first
T.animation_data_create(); T.animation_data.action=act
for pb in T.pose.bones: pb.rotation_mode='QUATERNION'
prevq={}
for k in range(N+1):
    fr=frames[k%N]
    for name in order:
        pb=T.pose.bones[name]; b=pb.bone
        if b.parent:
            rest_rel=b.parent.matrix_local.inverted()@b.matrix_local
            basis=rest_rel.inverted()@fr[b.parent.name].inverted()@fr[name]
        else: basis=b.matrix_local.inverted()@fr[name]
        loc,rot,_=basis.decompose()
        if name in prevq and prevq[name].dot(rot)<0: rot.negate()
        prevq[name]=rot
        pb.rotation_quaternion=rot; pb.location=loc if name in ('spine','root') else Vector()
        pb.keyframe_insert('rotation_quaternion',frame=k+1)
        if name in ('spine',): pb.keyframe_insert('location',frame=k+1)
# feet check: ankle path over the cycle
ys=[(round(fr['foot.L'].translation.y,3),round(fr['foot.L'].translation.z,3)) for fr in frames]
print('ankle L y/z per frame',ys[::2])
bpy.data.objects.remove(S)
sc.frame_start=1; sc.frame_end=N+1
bpy.ops.wm.save_as_mainfile(filepath=out)
print('saved',out,'keys',N+1)
