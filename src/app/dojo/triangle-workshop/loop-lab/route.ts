/**
 * @route GET /dojo/triangle-workshop/loop-lab
 * @entity ROOM
 * @description A non-persistent first slice of the Dojo Loop Lab
 * @permissions public; authored example only, no player data or writes
 * @agentDiscoverable false
 */
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#102322"><title>Dojo Loop Lab</title>
<link rel="stylesheet" href="/dojo/lab.css">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"}}</script>
</head><body>
<main><div id="scene" aria-hidden="true"></div>
<section class="panel" aria-labelledby="title">
<p class="eyebrow">DOJO LOOP LAB · FIRST PRACTICE</p><h1 id="title">A thought can become a next step.</h1>
<p>Explore a sample thought on the wall, then bring one triangle into the room. This is a demonstration; nothing you do here is saved.</p>
<div class="sample"><span>THE SAMPLE THOUGHT</span><p>“I feel excitement and want to get this dojo idea in front of people.”</p></div>
<p id="instruction" aria-live="polite">Enter the room, then tap the floor to walk. Tap the triangle to approach it.</p>
<button id="enter" type="button">Enter the dojo</button>
<button id="approach" type="button" hidden>Walk to the triangle</button>
<button id="project" type="button" hidden>Open the constellation wall</button>
<button id="resume" type="button" hidden>Continue exploring</button>
<button id="next-station" type="button" hidden>Go to the anchor table</button>
<button id="use-station" type="button" hidden>Use this station</button>
<button id="restart" type="button" hidden>Try again</button>
<p id="status" role="status"></p>
<a href="/ontology-game/between">Return to the Nook</a>
</section></main>
<section id="wall-view" class="wall-view" aria-label="Constellation wall" aria-hidden="true" hidden>
  <div class="wall-header"><div><p class="eyebrow">CONSTELLATION WALL · SAMPLE</p><h2>Your thought, in triangles</h2></div><button id="close-wall" class="wall-close" type="button" aria-label="Close constellation wall">Close ✕</button></div>
  <p class="wall-help">Choose a triangle to bring into the room. The shared word <strong>hope</strong> connects them.</p>
  <div class="wall-art" aria-hidden="true"><svg viewBox="0 0 360 300" role="presentation"><polygon id="triangle-one" points="180,24 45,235 315,235"/><polygon id="triangle-two" points="45,235 315,235 180,285"/><path d="M180 24 L45 235 L315 235 Z" class="line-one"/><path d="M45 235 L315 235 L180 285 Z" class="line-two"/><text x="78" y="116" transform="rotate(-57 78 116)">excitement</text><text x="260" y="116" transform="rotate(57 260 116)">possibility</text><text x="180" y="225" text-anchor="middle">hope</text><text x="86" y="275" transform="rotate(20 86 275)">wonder</text><text x="257" y="284" transform="rotate(-20 257 284)">poignance</text></svg></div>
  <div class="wall-choices" role="group" aria-label="Choose an example triangle"><button id="choose-one" type="button" aria-pressed="true">Excitement · possibility · hope</button><button id="choose-two" type="button" aria-pressed="false">Wonder · poignance · hope</button></div>
  <button id="wall-project" class="wall-project" type="button">Bring this triangle to the floor</button>
  <p class="wall-note">These are examples. Nothing is saved.</p>
</section>
<section id="station-view" class="wall-view station-view" aria-label="Practice station" aria-hidden="true" hidden>
<div class="wall-header"><div><p id="station-eyebrow" class="eyebrow">ANCHOR TABLE</p><h2 id="station-title">Try the connections</h2></div><button id="station-close" class="wall-close" type="button">Close ✕</button></div>
<div id="anchors-panel">
<p>The sample proposes three Emotional Alchemy connections. Choose what fits for this demonstration; these are not readings of you. <strong>Hope stays your word.</strong> Joy is an additional example word for the teaching triangle.</p>
<details class="reads"><summary>Optional: describe how these words feel</summary><p>Activation and orientation are your sample reads. They never decide an EA anchor.</p><div id="word-reads"></div></details><div id="anchor-list"></div><p id="anchor-result" class="result" role="status"></p>
<button id="to-loom" type="button" hidden>Continue to the action loom</button><button id="revise-wall" class="secondary" type="button">Return to the room</button>
</div>
<div id="loom-panel" hidden><p>Choose which kind of work to practice with a small dojo gathering. The example uses Career as its life lens and Activate Hope as its EA move.</p><label for="phase">Current work and personal move</label><select id="phase"></select><div id="form-detail" class="result"></div><label for="next-step">Your next-step sentence</label><textarea id="next-step" rows="3"></textarea><button id="preview" type="button">Preview the BAR</button><button id="back-to-anchors" class="secondary" type="button">Revisit anchor choices</button></div>
<div id="preview-panel" hidden><p>This is a preview, not a saved BAR. You can change it or leave without taking anything with you.</p><div id="bar-detail" class="result"></div><button id="another-phase" type="button">Try another phase</button><button id="finish" class="secondary" type="button">Return to the room</button><a class="live-link" href="/dojo/triangle-workshop">Take this idea to live practice</a></div>
</section><script type="module" src="/dojo/lab.js"></script></body></html>`

export function GET() {
  return new NextResponse(PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'same-origin' } })
}
