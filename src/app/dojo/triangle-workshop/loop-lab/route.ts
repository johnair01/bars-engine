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
<button id="project" type="button" hidden>Bring the triangle to the floor</button>
<button id="restart" type="button" hidden>Try again</button>
<p id="status" role="status"></p>
<a href="/ontology-game/between">Return to the Nook</a>
</section></main><script type="module" src="/dojo/lab.js"></script></body></html>`

export function GET() {
  return new NextResponse(PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'same-origin' } })
}
