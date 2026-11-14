/**
 * The v6 reel's 19-step script and the intake it was seeded with (council artifacts/lantern-hall/v6, from his saved
 * intake answers of 2026-11-01). The script is the engine's fixture: tests replay it and compare with the reel.
 * Personal stories (the reel's `life` lines) and friends' names stay in the council's private source, not here.
 * His tags were never saved to the reel (intake/game is empty), so every reservation plays its placeholder loop.
 */
import type { Intake, Move } from './engine'

export const REEL_INTAKE: Intake = {
  "goal": "Send an immersive demo to the homies for the Patreon launch",
  "goalCtx": "",
  "want": [
    "fire",
    "wood",
    "metal"
  ],
  "now": {
    "fire": 2,
    "metal": 2,
    "earth": 2
  },
  "truth": {
    "fire": true,
    "metal": true,
    "earth": true
  },
  "truthCtx": {},
  "res": [
    true,
    true,
    true,
    true,
    true,
    true
  ],
  "cmd": 0,
  "tags": [
    {},
    {},
    {},
    {},
    {},
    {}
  ]
}

export const BELIEF_LINE: readonly string[] = [
  "I’m not good enough to ask for this kind of attention.",
  "I’m not worthy of bringing this into the world.",
  "I won’t belong among people who are allergic to AI slop.",
  "I’m not capable of making this.",
  "What I make isn’t significant.",
  "I’m not ready to show people what I’ve got."
]

export const SCRIPT: readonly Move[] = [
  {"w":1,"ph":"Tend","src":"real","who":"You","type":"intake","title":"The six unpacking questions","text":"You answer the six questions at the empty table. Question one sets the goal. Question six, your reservations, deals the six beliefs that become the keeps. Each starts at the default strength of 2 in its predominant channel. Not good enough is the commander."},
  {"w":1,"ph":"Tend","src":"real","who":"You","type":"fire","keep":3,"ch":"metal","kind":"Evidence","title":"Real action fires on Not capable","text":"The one-take reel exists."},
  {"w":1,"ph":"Tend","src":"real","who":"You","type":"story","keep":2,"ch":"water","kind":"Witness","withWitness":true,"title":"Story move on Don’t belong"},
  {"w":1,"ph":"Tend","src":"real","who":"You","type":"story","keep":4,"ch":"wood","kind":"Impact","withWitness":true,"title":"Story move on Not significant"},
  {"w":1,"ph":"Tend","src":"real","who":"You","type":"story","keep":1,"ch":"earth","kind":"Ground","withWitness":true,"title":"Story move on Not worthy"},
  {"w":1,"ph":"End","src":"real","who":"The hall","type":"tick","title":"The watch ends","text":"Your oil is spent. Nobody touched Not ready or Not good enough, so their shadow grows."},
  {"w":2,"ph":"Tend","src":"proj","who":"You","type":"ghost","keep":5,"ch":"water","kind":"Exposure","title":"Ghost stone on Not ready","text":"Real action: send the take to two friends, by tonight."},
  {"w":2,"ph":"Tend","src":"proj","who":"You","type":"story","keep":0,"ch":"fire","kind":"Ask","withWitness":false,"title":"Solo story on the commander"},
  {"w":2,"ph":"Tend","src":"proj","who":"You","type":"light","title":"Light the table","text":"The commander needs a witness. You put your table up for play."},
  {"w":2,"ph":"Tend","src":"proj","who":"You","type":"ghost","keep":0,"ch":"fire","kind":"Ask","title":"Ghost stone on Not good enough","text":"Real action: post the Patreon and name what you need, with the homies watching, by Saturday."},
  {"w":2,"ph":"Kibitz","src":"proj","who":"You","type":"kibitzOut","ch":"water","kind":"Witness","title":"Kibitz at a sample table","text":"You spend a Water vibeulon on someone’s Don’t belong keep."},
  {"w":2,"ph":"Kibitz","src":"proj","who":"You","type":"fire","keep":5,"ch":"water","kind":"Exposure","title":"Your ghost fires on Not ready","text":"Sent to two friends."},
  {"w":2,"ph":"End","src":"proj","who":"The hall","type":"tick","title":"The watch ends","text":"Both dark keeps were touched, so neither grows."},
  {"w":3,"ph":"Tend","src":"samp","who":"Sample kibitzer","type":"kibitzIn","keep":5,"ch":"wood","kind":"Exposure","withWitness":true,"title":"A BAR lands on Not ready"},
  {"w":3,"ph":"Tend","src":"proj","who":"You","type":"door","keep":5,"title":"Something stings","text":"The Wood loop that surfaced feels like craving. You tend it from inside."},
  {"w":3,"ph":"Tend","src":"samp","who":"Sample kibitzer","type":"kibitzIn","keep":0,"ch":"fire","kind":"Ask","withWitness":true,"title":"A BAR lands on the commander"},
  {"w":3,"ph":"Tend","src":"proj","who":"You","type":"read","title":"Read the shape of the block","text":"Both hits on the commander came from Ask stories in Fire. Its loop is down to one step."},
  {"w":3,"ph":"Tend","src":"proj","who":"You","type":"fire","keep":0,"ch":"fire","kind":"Ask","title":"Your ghost fires on Not good enough","text":"Posted, with witnesses."},
  {"w":3,"ph":"Tend","src":"proj","who":"The table","type":"open","title":"The work opens","text":"All six keeps are held. The goal is met."},
]
