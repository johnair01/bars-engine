import assert from 'node:assert/strict'
import { BOOK_TOUR_HELP_HREF, BOOK_TOUR_HELP_KEYS, BOOK_TOUR_HELP_OPTIONS, BOOK_TOUR_HELP_SOURCE } from '../book-tour-help'
assert.equal(BOOK_TOUR_HELP_HREF, '/mastering-allyship/book-tour/help')
assert.equal(BOOK_TOUR_HELP_SOURCE, 'webinar-book-tour-help')
assert.equal(BOOK_TOUR_HELP_OPTIONS.every((option) => BOOK_TOUR_HELP_KEYS.has(option.key)), true)
console.log('✓ Book Tour help intake has a stable public route and valid help options')
