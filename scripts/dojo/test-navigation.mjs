import assert from 'node:assert/strict'
import { planRoute, segmentIsClear, clampDestination } from '../../public/dojo/navigation.mjs'

// This start/target pair made the old local steering reverse 832 times.
const cases = [[{x:-3.7656561048,z:-.2422327019},{x:2.2954519656,z:-.0189869999}]]
for (let i=0;i<24;i++) for (let j=0;j<24;j++) {
  const a=i*Math.PI/12,b=j*Math.PI/12
  cases.push([{x:2.5*Math.cos(a),z:2.5*Math.sin(a)},{x:4*Math.cos(b),z:4*Math.sin(b)}])
}
// A player can be parked right against the furniture after keyboard movement.
for (let i=0;i<32;i++) for (let j=0;j<16;j++) {
  const a=i*Math.PI/16,b=j*Math.PI/8
  cases.push([{x:1.701*Math.cos(a),z:1.701*Math.sin(a)},{x:4.5*Math.cos(b),z:4.5*Math.sin(b)}])
}
for(const [start, end] of cases) {
  const route=planRoute(start,end)
  assert.ok(route?.length, `No path: ${JSON.stringify([start,end])}`)
  let at=start, distance=0
  for(const next of route) {
    assert.ok(segmentIsClear(at,next), `Path crosses the bowl: ${JSON.stringify([at,next])}`)
    distance+=Math.hypot(next.x-at.x,next.z-at.z);at=next
  }
  const goal=clampDestination(end)
  assert.ok(Math.hypot(at.x-goal.x,at.z-goal.z)<1e-7)
  assert.ok(distance<20, `Unnecessarily long route: ${distance}`)
}
assert.equal(planRoute({x:2,z:0},{x:0,z:0}),null)
console.log(`Dojo navigation: ${cases.length} routes avoid the furniture and reach their destinations.`)
