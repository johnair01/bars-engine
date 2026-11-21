"""Generate the Lantern Walk map and its notice pages for the WorkAdventure world.
usage: python3 gen_lantern_walk.py   (writes tiles.png, lantern-walk.tmj, notice-N.html, arrive-N.html here)
One 40x24 orthogonal map, 32 px tiles: the office door at the left, three notice posts beside it, and three
places to walk to. Each notice post and each place is a rectangle area carrying an openWebsite property."""
import json, os, html
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); T = 32; W, H = 40, 24
cols = [(70,120,60),(150,120,80),(40,90,160),(90,80,90),(100,70,40),(30,110,40),(200,80,120),(130,130,130),(240,200,40),
        (255,190,70),(120,85,50),(60,45,40)]
img = Image.new('RGBA',(T*len(cols),T),(0,0,0,0)); d = ImageDraw.Draw(img)
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
img.save(f'{HERE}/tiles.png')
idx = lambda x,y: y*W+x
ground=[1]*(W*H); detail=[0]*(W*H); coll=[0]*(W*H); floor=[0]*(W*H); o1=[0]*(W*H); o2=[0]*(W*H); start=[0]*(W*H)
for k in range(W):
    for i in (idx(k,0), idx(k,H-1)): ground[i]=4; coll[i]=4
for k in range(H):
    for i in (idx(0,k), idx(W-1,k)): ground[i]=4; coll[i]=4
# office: wall block with a door
for y in range(6,10):
    for x in range(1,8): ground[idx(x,y)]=4; coll[idx(x,y)]=4
ground[idx(4,9)]=11; coll[idx(4,9)]=0
# paths: door square, then three lanes fan out to the places
def path(x0,y0,x1,y1):
    for x in range(min(x0,x1),max(x0,x1)+1): ground[idx(x,y0)]=2
    for y in range(min(y0,y1),max(y0,y1)+1): ground[idx(x1,y)]=2
for y in range(10,15):
    for x in range(2,8): floor[idx(x,y)]=8
path(8,12,22,12); path(22,12,30,12); path(22,12,22,5); path(22,5,30,5); path(22,12,22,19); path(22,19,30,19)
start[idx(4,12)]=9
# notice posts beside the door: three posts at x=10, y=9,12,15 (board tile on detail, collides)
posts=[(10,9),(10,12),(10,15)]
for (x,y) in posts: detail[idx(x,y)]=10; coll[idx(x,y)]=10
# places: lantern post at the end of each lane
places=[(31,5),(31,12),(31,19)]
for (x,y) in places: detail[idx(x,y)]=9; coll[idx(x,y)]=9
# a few trees and flowers for the walk
for (x,y) in [(14,3),(17,3),(15,7),(26,8),(27,16),(15,17),(18,21),(34,8),(35,16),(36,3),(36,21)]:
    detail[idx(x,y)]=5; coll[idx(x,y)]=5; o1[idx(x,y-1)]=6
for (x,y) in [(12,10),(13,14),(24,10),(25,14),(24,3),(26,20),(33,10),(33,14),(20,8),(20,16)]:
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
for n,((t,b,place,arr),(x,y),(px,py)) in enumerate(zip(NOTICES,posts,places),1):
    open(f'{HERE}/notice-{n}.html','w').write(PAGE.format(title=html.escape(t),body=html.escape(b),foot="Notice "+str(n)+" of 3. Agree with the friends at the door on one, then walk there together."))
    open(f'{HERE}/arrive-{n}.html','w').write(PAGE.format(title=html.escape(place),body=html.escape(arr),foot="Next time you visit, tell the table how it went."))
    area(f"notice-{n}",x-1,y-1,3,3,f"notice-{n}.html")
    area(place,px-1,py-1,3,3,f"arrive-{n}.html")
def tl(i,name,data,props=None):
    l={"id":i,"name":name,"type":"tilelayer","x":0,"y":0,"width":W,"height":H,"opacity":1,"visible":True,"data":data}
    if props: l["properties"]=props
    return l
layers=[tl(1,"ground",ground),tl(2,"detail",detail),tl(3,"collisions",coll,[{"name":"collides","type":"bool","value":True}]),
        tl(4,"floorLayer",floor),tl(5,"over1",o1),tl(6,"over2",o2),tl(7,"start",start),
        {"id":8,"name":"objects","type":"objectgroup","x":0,"y":0,"opacity":1,"visible":True,"draworder":"topdown","objects":objs}]
m={"compressionlevel":-1,"height":H,"width":W,"infinite":False,"orientation":"orthogonal","renderorder":"right-down","tiledversion":"1.10.2",
   "tileheight":T,"tilewidth":T,"type":"map","version":"1.10","nextlayerid":9,"nextobjectid":oid,"layers":layers,
   "tilesets":[{"firstgid":1,"name":"tiles","image":"tiles.png","imagewidth":T*len(cols),"imageheight":T,"tilewidth":T,"tileheight":T,"tilecount":len(cols),"columns":len(cols),"margin":0,"spacing":0}],
   "properties":[{"name":"mapName","type":"string","value":"The Lantern Walk"}]}
json.dump(m,open(f'{HERE}/lantern-walk.tmj','w'),separators=(',',':'))
print(sorted(os.listdir(HERE)))
