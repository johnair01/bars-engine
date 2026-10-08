# Podcast publishing

Episodes are read from the Spotify for Creators RSS feed and refresh on the site once an hour.

Publishing an episode only requires two optional additions here:

1. Save the cleaned Zoom transcript as `transcripts/episode-N.vtt`.
2. Add the YouTube video ID and transcript path to `episodes.json`, keyed by episode number.

```json
{
  "1": {
    "youtubeId": "VIDEO_ID",
    "transcript": "content/podcast/transcripts/episode-1.vtt"
  }
}
```

Either value may be omitted. An episode with no entry still appears with its Spotify player and show notes.
