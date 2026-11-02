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
<button id="place-triangle" type="button" hidden>Place triangle here</button>
<button id="lift-floor" type="button" hidden>Pick up triangle</button>
<button id="return-triangle" type="button" hidden>Return triangle to wall</button>
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
  <div id="constellation-art" class="wall-art" aria-hidden="true"><svg viewBox="0 0 360 400" role="presentation"><polygon id="triangle-one" points="180,26.7949192431 80,200 280,200"/><polygon id="triangle-two" points="80,200 280,200 180,373.205080757"/><path d="M180 26.7949192431 L80 200 L280 200 Z" class="line-one"/><path d="M80 200 L280 200 L180 373.205080757 Z" class="line-two"/><text x="125" y="112" text-anchor="middle" transform="rotate(-60 125 112)">excitement</text><text x="235" y="112" text-anchor="middle" transform="rotate(60 235 112)">possibility</text><text x="180" y="191" text-anchor="middle">hope</text><text x="123" y="288" text-anchor="middle" transform="rotate(60 123 288)">wonder</text><text x="237" y="288" text-anchor="middle" transform="rotate(-60 237 288)">poignance</text></svg></div>
  <div id="teaching-art" class="wall-art" aria-hidden="true" hidden><svg viewBox="0 0 360 260"><polygon id="triangle-teaching" points="180,20 60,227.846096908 300,227.846096908"/><path d="M180 20 L60 227.846096908 L300 227.846096908 Z" class="line-one"/><text x="112" y="121" text-anchor="middle" transform="rotate(-60 112 121)">wonder</text><text x="248" y="121" text-anchor="middle" transform="rotate(60 248 121)">poignance</text><text x="180" y="218" text-anchor="middle">joy</text></svg></div>
  <div class="wall-choices" role="group" aria-label="Choose an example triangle"><button id="choose-one" type="button" aria-pressed="true">Excitement · possibility · hope</button><button id="choose-two" type="button" aria-pressed="false">Wonder · poignance · hope</button><button id="choose-teaching" type="button" aria-pressed="false">Wonder · poignance · joy (EA practice)</button></div>
  <button id="wall-project" class="wall-project" type="button">Lift this triangle</button>
  <p class="wall-note">These are examples. Nothing is saved.</p>
</section>
<section id="station-view" class="wall-view station-view" aria-label="Practice station" aria-hidden="true" hidden>
<div class="wall-header"><div><p id="station-eyebrow" class="eyebrow">ANCHOR TABLE</p><h2 id="station-title">Try the connections</h2></div><button id="station-close" class="wall-close" type="button">Close ✕</button></div>
<div id="anchors-panel">
<p>Pick up one energy, carry it to its named line, and choose whether to place it. These are sample connections, not readings of you. <strong>Hope stays your word.</strong></p>
<details class="reads"><summary>Optional: describe how these words feel</summary><p>Activation and orientation are your sample reads. They never decide an EA anchor.</p><div id="word-reads"></div></details><div id="anchor-list"></div><p id="anchor-result" class="result" role="status"></p>
<button id="pick-move" type="button" hidden>Pick up Deepen Value</button><button id="to-loom" type="button" hidden>Continue to the action loom</button><button id="revise-wall" class="secondary" type="button">Return to the room</button>
</div>
<div id="loom-panel" hidden><p>Choose which kind of work to practice with a small dojo gathering. The example uses Career as its life lens and Activate Hope as its EA move.</p><label for="phase">Current work and personal move</label><select id="phase"></select><div id="form-detail" class="result"></div><label for="next-step">Your next-step sentence</label><textarea id="next-step" rows="3"></textarea><button id="preview" type="button">Preview the BAR</button><button id="back-to-anchors" class="secondary" type="button">Revisit anchor choices</button></div>
<div id="preview-panel" hidden><p>This is a preview, not a saved BAR. You can change it or leave without taking anything with you.</p><div id="bar-detail" class="result"></div><button id="another-phase" type="button">Try another phase</button><button id="finish" class="secondary" type="button">Return to the room</button><a class="live-link" href="/dojo/triangle-workshop">Take this idea to live practice</a></div>
</section>
<section id="reflection-view" class="wall-view station-view" aria-label="Reflect on Deepen Value" aria-hidden="true" hidden><div class="wall-header"><div><p class="eyebrow">DEEPEN VALUE</p><h2>What did you notice?</h2></div></div><p>The movement is an invitation to explore what matters. The animation itself does not change your thought. You decide whether anything shifted.</p><label for="reflection-line">Which line would you like to review?</label><select id="reflection-line"><option value="wonder">Wonder</option><option value="poignance">Poignance</option></select><label for="reflection-choice">Orientation after the practice</label><select id="reflection-choice"><option value="unchanged">Leave it as it was</option><option value="supportive">Supportive</option><option value="constricting">Constricting</option><option value="mixed">Mixed</option><option value="unread">Leave unread</option></select><button id="reflection-save" type="button">Keep this choice</button><button id="reflection-cancel" class="secondary" type="button">Stop without changing it</button></section><script type="module" src="/dojo/lab.js"></script></body></html>`

export function GET() {
  return new NextResponse(PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'same-origin' } })
}
