/* The Between's look as data, copied from six-faces-council council/look/look.json (position bld-look-is-data).
   Wendell chose the scope on the board, bld-look-scope-2, carried as c: the ramp, the palette and the light budget.
   paint.js and hollow.js read these values instead of restating them, and a pull request touching this room cites
   LOOK_HASH. The council's `python3 council/tools/look.py --check` holds the dataset to the files it came from; this
   copy is refreshed in the round that moves either. */

export const LOOK_SOURCE = "six-faces-council council/look/look.json";
export const LOOK_HASH = "3d9fc55402a2";

export const LOOK = {
 "ramp": {
  "source": "council/callsheets/stills/2026-10-27-friendship-between-ad1/make/src/between/paint.js RAMP (line 21) and RAMP_STOPS (line 22)",
  "read_from": "the four concept views' luminance percentiles, 10, 40, 70 and 95, one ramp for all four",
  "colours": [
   "#1d1007",
   "#351e15",
   "#4d2e23",
   "#774f4f",
   "#e09a72"
  ],
  "stops": [
   0.0,
   0.2,
   0.42,
   0.66,
   1.0
  ]
 },
 "palette": {
  "source": "council/callsheets/stills/2026-10-27-friendship-between-ad1/make/src/between/paint.js lines 29 to 34 and 103 to 107, with the light colours from hollow.js",
  "bands": 5,
  "edge_half_width": 0.3,
  "mip_bias": 3.2,
  "shadow_fill": {
   "colour": "#4d2e23",
   "weight": 0.14,
   "where": "the ramp's mid brown, added in shadow, never multiplied"
  },
  "rim": {
   "colour": "#e09a72",
   "weight": 0.16,
   "where": "a thin warm paint-light on edges facing away from the camera"
  },
  "light_colours": {
   "lantern": "#ffb066",
   "hearth": "#ff8a3a",
   "crystals": "#5fe0d0"
  }
 },
 "budget": {
  "source": "council/callsheets/stills/2026-10-27-friendship-between-ad1/make/src/between/hollow.js line 6 and the PointLight calls at lines 434, 488, 623 and 703",
  "rule": "each point light costs every pixel, so a shell lights only what it names and keeps no spare",
  "shells": {
   "hollow": {
    "lights": [
     {
      "light": "the two paper lanterns",
      "colour": "#ffb066",
      "intensity": 7,
      "distance": 9,
      "decay": 1.6
     },
     {
      "light": "the stream's crystals",
      "colour": "#5fe0d0",
      "intensity": 6,
      "distance": 6,
      "decay": 1.6
     },
     {
      "light": "the hearth fire",
      "colour": "#ff8a3a",
      "intensity": 16,
      "distance": 10,
      "decay": 1.5
     }
    ]
   },
   "nook": {
    "lights": [
     {
      "light": "the hearth fire",
      "colour": "#ff8a3a",
      "intensity": 16,
      "distance": 10,
      "decay": 1.5
     }
    ]
   }
  },
  "per_hung_item": {
   "variants": [
    {
     "light": "a hang spot's own light, dark until something hangs",
     "colour": "#ffb066",
     "intensity": 0,
     "distance": 8,
     "decay": 1.6
    }
   ],
   "note": "the nook's hook is the only hang spot it starts with, so a lantern there is earned, not given"
  }
 }
};

// The four point lights the shells build, by the name the dataset gives each one.
const light = name => LOOK.budget.shells.hollow.lights.find(l => l.light === name);
export const LIGHT = {
  lantern: light("the two paper lanterns"),
  crystals: light("the stream's crystals"),
  hearth: light("the hearth fire"),
  hung: LOOK.budget.per_hung_item.variants[0],
};
