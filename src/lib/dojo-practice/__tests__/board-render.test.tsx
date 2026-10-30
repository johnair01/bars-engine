import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ThoughtStringBoard } from '@/app/dojo/triangle-workshop/thought-string-board'
import { learningPractice } from '@/lib/dojo-practice/tutorial'
import { emptyPractice, buildTriangle, addWord, setCharge } from '@/lib/dojo-practice/constellation'

const noop = () => {}
const learning = renderToStaticMarkup(createElement(ThoughtStringBoard, { state: learningPractice(), onChange: noop, live: false, hint: 'Start here' }))
assert.match(learning, /Start here/)
assert.match(learning, /Well-being/)
assert.doesNotMatch(learning, /8th-Ray|Bridge to/, 'the Learning constellation never offers the 8th-Ray move or bridges')

const blank = renderToStaticMarkup(createElement(ThoughtStringBoard, { state: emptyPractice(), onChange: noop, live: true }))
assert.match(blank, /The page is empty/)
assert.match(blank, /Draw the first triangle/)

let c = emptyPractice().constellation
const ids: string[] = []
for (const [w, ch] of [['Not ready', -2], ['Hider', -2], ['Embarrassed', -1]] as const) { const r = addWord(c, w, ch); c = r.constellation; ids.push(r.word.id) }
const t = buildTriangle(c, ids)
c = setCharge(t.constellation, ids[0], -3)
const live = renderToStaticMarkup(createElement(ThoughtStringBoard, { state: { constellation: c, projectedTriangleId: null }, onChange: noop, live: true }))
assert.match(live, /Triangle of Not ready, Hider, Embarrassed, charge -6/)
assert.match(live, /aria-label="Line Hider, charge -2"/, 'every line is its own tap target')
console.log('board render: ok')
