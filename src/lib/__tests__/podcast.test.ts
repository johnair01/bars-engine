import assert from 'node:assert/strict'
import { parsePodcastFeed, parseVtt } from '../podcast'

const feed = `<?xml version="1.0"?><rss><channel><item>
  <title><![CDATA[Episode 7: A real conversation]]></title>
  <description><![CDATA[<p>First sentence. Second sentence. Timestamps0:00 Start1:23 The workLinks:https://example.com</p>]]></description>
  <link>https://podcasters.spotify.com/pod/show/example/episodes/a-real-conversation-abc123</link>
  <pubDate>Wed, 30 Sep 2026 20:23:25 GMT</pubDate>
  <enclosure url="https://example.com/audio.m4a" type="audio/x-m4a" />
  <itunes:duration>01:02:32</itunes:duration>
  <itunes:episode>7</itunes:episode>
</item></channel></rss>`

const episodes = parsePodcastFeed(feed)
assert.equal(episodes.length, 1)
assert.equal(episodes[0].number, 7)
assert.equal(episodes[0].slug, 'episode-7')
assert.equal(episodes[0].excerpt, 'First sentence. Second sentence.')
assert.match(episodes[0].notes, /Timestamps\n0:00 Start\n1:23 The work/)
assert.equal(
  episodes[0].spotifyEmbedUrl,
  'https://podcasters.spotify.com/pod/show/example/embed/episodes/a-real-conversation-abc123',
)

const transcript = parseVtt(`WEBVTT

00:00:00.000 --> 00:00:02.000
<v Wendell>First thought.

00:00:02.000 --> 00:00:04.000
<v Wendell>Second thought.

00:00:04.000 --> 00:00:06.000
Ike: A reply.
`)

assert.deepEqual(transcript, [
  { speaker: 'Wendell', text: 'First thought. Second thought.' },
  { speaker: 'Ike', text: 'A reply.' },
])

console.log('✓ podcast feed and transcript parsing')
