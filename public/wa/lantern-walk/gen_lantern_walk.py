"""Generate the Lantern Walk map and its notice pages for the WorkAdventure world.
usage: python3 gen_lantern_walk.py   (writes tiles.png, lantern-walk.tmj, notice-N.html, arrive-N.html here)
One 40x24 orthogonal map, 32 px tiles: the office door at the left, three notice posts beside it, and three
places to walk to. Each notice post and each place is a rectangle area carrying an openWebsite property."""
import json, os, html, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); T = 32; W, H = 40, 24
sys.path.insert(0, os.path.dirname(HERE))          # public/wa: the rules every map here must keep
from wa_export import apply as wa_apply, check as wa_check, check_exits as wa_exits  # noqa: E402
cols = [(70,120,60),(150,120,80),(40,90,160),(90,80,90),(100,70,40),(30,110,40),(200,80,120),(130,130,130),(240,200,40),
        (255,190,70),(120,85,50),(60,45,40)]
N=27; import random; random.seed(7)
img = Image.new('RGBA',(T*N,T),(0,0,0,0)); d = ImageDraw.Draw(img)
for i,c in enumerate(cols):
    x=i*T
    if i==5: d.ellipse((x+1,1,x+T-2,T-2),fill=c+(235,))
    elif i==4: d.rectangle((x+11,0,x+20,T),fill=c+(255,))
    elif i==9:   # lantern post on grass
        d.rectangle((x,0,x+T-1,T-1),fill=cols[0]+(255,)); d.rectangle((x+14,12,x+17,30),fill=(60,45,40,255))
        d.ellipse((x+8,2,x+23,17),fill=(255,190,70,255)); d.ellipse((x+12,6,x+19,13),fill=(255,236,170,255))
    elif i==10:  # notice board
        d.rectangle((x,0,x+T-1,T-1),fill=cols[0]+(255,)); d.rectangle((x+4,4,x+27,22),fill=c+(255,),outline=(60,45,40,255))
        for k in (8,12,16): d.line((x+8,k,x+23,k),fill=(235,225,200,255))
        d.rectangle((x+14,22,x+17,31),fill=(60,45,40,255))
    elif i==11:  # door
        d.rectangle((x,0,x+T-1,T-1),fill=cols[3]+(255,)); d.rectangle((x+6,4,x+25,T-1),fill=c+(255,)); d.ellipse((x+20,16,x+23,19),fill=(255,190,70,255))
    else:
        d.rectangle((x,0,x+T-1,T-1),fill=c+(255,))
# extra tiles: 12,13 grass variants; 14-16 notice sign frames (VFD glow, animated); 17,18 halo frames (animated)
for i in (12,13):
    x=i*T; d.rectangle((x,0,x+T-1,T-1),fill=cols[0]+(255,))
    for _ in range(14):
        px,py=x+random.randrange(T),random.randrange(T); d.point((px,py),fill=(95,150,80,255) if i==12 else (55,100,48,255))
for f,(a,b) in enumerate(((200,120),(255,170),(230,90))):
    x=(14+f)*T; d.rectangle((x,0,x+T-1,T-1),fill=cols[0]+(255,)); d.rectangle((x+14,22,x+17,31),fill=(60,45,40,255))
    d.rectangle((x+2,2,x+29,22),fill=(10,24,26,255),outline=(100,255,220,255))
    for k,(yy) in enumerate((7,12,17)): d.line((x+6,yy,x+6+(14 if k!=2 else 9),yy),fill=(100,255,220,a),width=2)
    for yy in range(4,21,3): d.line((x+3,yy,x+28,yy),fill=(0,0,0,b//4))
# 17-20: unread sparkle halo frames (cyan, four-point stars in changing spots); 21: same frames in another order (animated);
# 25: read sign, steady soft white; 26: read halo, steady soft white (no sparkle)
def star(x,y,c,r=3):
    d.line((x-r,y,x+r,y),fill=c); d.line((x,y-r,x,y+r),fill=c); d.point((x,y),fill=(255,255,255,255))
SPOTS=[[(5,6),(26,10),(15,27)],[(24,5),(6,20),(20,25)],[(8,26),(27,22),(14,5)],[(28,14),(4,12),(22,28)]]
for f in range(4):
    x=(17+f)*T; d.rectangle((x,0,x+T-1,T-1),fill=(100,255,220,26))
    for (sx,sy) in SPOTS[f]: star(x+sx,sy,(200,255,245,255),2 if (sx+f)%2 else 3)
x=21*T; img.paste(img.crop((19*T,0,20*T,T)),(x,0))
x=25*T; d.rectangle((x,0,x+T-1,T-1),fill=cols[0]+(255,)); d.rectangle((x+14,22,x+17,31),fill=(60,45,40,255))
d.rectangle((x+2,2,x+29,22),fill=(238,232,220,255),outline=(255,252,244,255))
for k,yy in enumerate((7,12,17)): d.line((x+6,yy,x+6+(14 if k!=2 else 9),yy),fill=(150,140,125,255),width=2)
x=26*T; d.rectangle((x,0,x+T-1,T-1),fill=(255,248,235,30))
img.save(f'{HERE}/tiles.png')
idx = lambda x,y: y*W+x
ground=[13 if (x*7+y*13)%5 else (14 if (x+y)%3==0 else 1) for y in range(H) for x in range(W)]; detail=[0]*(W*H); coll=[0]*(W*H); floor=[0]*(W*H); o1=[0]*(W*H); o2=[0]*(W*H); start=[0]*(W*H)
for k in range(W):
    for i in (idx(k,0), idx(k,H-1)): ground[i]=4; coll[i]=4
for k in range(H):
    for i in (idx(0,k), idx(W-1,k)): ground[i]=4; coll[i]=4
# office: wall block with a door
for y in range(6,10):
    for x in range(1,8): ground[idx(x,y)]=4; coll[idx(x,y)]=4
ground[idx(4,9)]=12; coll[idx(4,9)]=0
# paths: door square, then three lanes fan out to the places
def path(x0,y0,x1,y1):
    for x in range(min(x0,x1),max(x0,x1)+1): ground[idx(x,y0)]=2
    for y in range(min(y0,y1),max(y0,y1)+1): ground[idx(x1,y)]=2
for y in range(10,15):
    for x in range(2,8): floor[idx(x,y)]=8
path(8,12,22,12); path(22,12,30,12); path(22,12,22,5); path(22,5,30,5); path(22,12,22,19); path(22,19,30,19)
start[idx(4,12)]=9
# notice posts: glowing VFD signs flanking the lane, off every path (sign tile collides, the lane stays open)
posts=[(10,10),(13,14),(16,10)]   # beside the lane (row 12), never on it
for (x,y) in posts:
    coll[idx(x,y)]=15   # the sign itself lives on the state layers below; this tile only blocks
# per-sign state layers (visible toggled by lantern-walk.js): unread = sparkling cyan, read = settled soft white
st={}
for n,(x,y) in enumerate(posts,1):
    u=[0]*(W*H); ug=[0]*(W*H); r=[0]*(W*H); rg=[0]*(W*H)
    u[idx(x,y)]=15
    r[idx(x,y)]=26
    for dx in (-1,0,1):
        for dy in (-1,0,1):
            if dx or dy:
                ug[idx(x+dx,y+dy)]=18 if (dx+dy)%2 else 22; rg[idx(x+dx,y+dy)]=27
    st[n]=(u,ug,r,rg)
# places: lantern post at the end of each lane
places=[(31,5),(31,12),(31,19)]
for (x,y) in places: detail[idx(x,y)]=10; coll[idx(x,y)]=10
# a few trees and flowers for the walk
for (x,y) in [(14,3),(17,3),(15,7),(26,8),(27,16),(15,17),(18,21),(34,8),(35,16),(36,3),(36,21)]:
    detail[idx(x,y)]=5; coll[idx(x,y)]=5; o1[idx(x,y-1)]=6
for (x,y) in [(24,10),(25,14),(24,3),(26,20),(33,10),(33,14),(20,8),(20,16)]:
    detail[idx(x,y)]=7
NOTICES=[
 ("Someone who writes","A friend has three lines that will not sit together and needs a second pair of eyes. They are waiting at the Reading Bench.",
  "Reading Bench","Read the three lines aloud, one at a time. Say which line you would keep. Then say who else here you would ask for help."),
 ("Someone who builds","A friend has half a table and no one to hold the other end. They are waiting at the Workbench.",
  "Workbench","Hold the other end of the table. Say what you would build next and who here would enjoy building it with you."),
 ("Someone who listens","A friend has a decision they keep circling and wants to say it out loud to one person. They are waiting at the Listening Stone.",
  "Listening Stone","Sit beside them and listen without fixing. When they stop, say back the one thing you heard."),
]
PAGE="""<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><style>
body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#1c1612;color:#f2e6cf;font:18px/1.55 Georgia,serif}}
main{{max-width:30rem;padding:2rem 1.5rem}}h1{{font-size:1.5rem;margin:0 0 1rem;color:#ffbe46}}p{{margin:0 0 1rem}}small{{color:#b9a98c}}
</style><main><h1>{title}</h1><p>{body}</p><small>{foot}</small></main></html>"""
objs=[]; oid=1
def area(name,x,y,w,h,url):
    global oid
    objs.append({"id":oid,"name":name,"type":"area","x":x*T,"y":y*T,"width":w*T,"height":h*T,"rotation":0,"visible":True,
      "properties":[{"name":"openWebsite","type":"string","value":url},{"name":"openWebsiteWidth","type":"int","value":40},
                    {"name":"openWebsiteTrigger","type":"string","value":"onaction"},{"name":"openWebsiteTriggerMessage","type":"string","value":"Press SPACE to read"}]})
    oid+=1
def exit_area(name,x,y,w,h,url,role):
    """A door: WorkAdventure loads the target the moment the room opens, so it has to exist, and it must not
    sit under the start tile or the room would throw the player out on arrival."""
    global oid
    objs.append({"id":oid,"name":name,"type":"area","x":x*T,"y":y*T,"width":w*T,"height":h*T,"rotation":0,"visible":True,
      "properties":[{"name":"exitUrl","type":"string","value":url},{"name":"role","type":"string","value":role}]})
    oid+=1
# the office door at (4,9) is a doorway you can stand in; standing in it walks you through to the dojo
exit_area("Office door",4,9,1,1,"../calrunian-dojo/calrunian-dojo.tmj","to-dojo")
for n,((t,b,place,arr),(x,y),(px,py)) in enumerate(zip(NOTICES,posts,places),1):
    open(f'{HERE}/notice-{n}.html','w').write(PAGE.format(title=html.escape(t),body=html.escape(b),foot="Notice "+str(n)+" of 3. Agree with the friends at the door on one, then walk there together."))
    open(f'{HERE}/arrive-{n}.html','w').write(PAGE.format(title=html.escape(place),body=html.escape(arr),foot="Next time you visit, tell the table how it went."))
    area(f"notice-{n}",x-1,(y+1 if y<12 else y-1),3,1,f"notice-{n}.html")
    area(place,px-1,py-1,3,3,f"arrive-{n}.html")
def tl(i,name,data,props=None):
    l={"id":i,"name":name,"type":"tilelayer","x":0,"y":0,"width":W,"height":H,"opacity":1,"visible":True,"data":data}
    if props: l["properties"]=props
    return l
layers=[tl(1,"ground",ground),tl(2,"detail",detail),tl(3,"collisions",coll,[{"name":"collides","type":"bool","value":True}]),
        tl(4,"floorLayer",floor),tl(5,"over1",o1),tl(6,"over2",o2),dict(tl(7,"start",start),visible=False),
        *[tl(20+10*n+k,nm.format(n),dat,None) if k in (0,2) else tl(20+10*n+k,nm.format(n),dat,None)
          for n,(u,ug,r,rg) in st.items() for k,(nm,dat) in enumerate((("unread-{}",u),("unread-{}-glow",ug),("read-{}",r),("read-{}-glow",rg)))],
        {"id":8,"name":"objects","type":"objectgroup","x":0,"y":0,"opacity":1,"visible":True,"draworder":"topdown","objects":objs}]
for l in layers:
    if l['name'].startswith('read-'): l['visible']=False
m={"compressionlevel":-1,"height":H,"width":W,"infinite":False,"orientation":"orthogonal","renderorder":"right-down","tiledversion":"1.10.2",
   "tileheight":T,"tilewidth":T,"type":"map","version":"1.10","nextobjectid":oid,"layers":layers,
   "nextlayerid":60,"tilesets":[{"firstgid":1,"name":"tiles","image":"tiles.png","imagewidth":T*N,"imageheight":T,"tilewidth":T,"tileheight":T,"tilecount":N,"columns":N,"margin":0,"spacing":0,"tiles":[{"id":14,"animation":[{"tileid":14,"duration":400},{"tileid":15,"duration":400},{"tileid":16,"duration":200},{"tileid":15,"duration":400}]},{"id":17,"animation":[{"tileid":17,"duration":300},{"tileid":18,"duration":300},{"tileid":19,"duration":300},{"tileid":20,"duration":300}]},{"id":21,"animation":[{"tileid":19,"duration":300},{"tileid":20,"duration":300},{"tileid":17,"duration":300},{"tileid":18,"duration":300}]}]}],
   "properties":[{"name":"mapName","type":"string","value":"The Lantern Walk"},{"name":"script","type":"string","value":"lantern-walk.js"}]}
# WorkAdventure reads this map differently from how Tiled draws it: floorLayer must be an Object Layer,
# collision is a tile property rather than a layer, and a collided start tile would spawn a player in a wall.
wa_apply(m)
_wa = wa_check(m) + wa_exits(m, HERE)
if _wa:
    print('WORKADVENTURE RULES FAILED:'); [print(' -', e) for e in _wa]; sys.exit(1)

json.dump(m,open(f'{HERE}/lantern-walk.tmj','w'),separators=(',',':'))
print(sorted(os.listdir(HERE)))
