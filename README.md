# Daily CS — automated Counter-Strike news videos

Auto-fetches Counter-Strike news, summarizes the top stories into templated
bullet-point sections with Claude, and renders a finished MP4 with Remotion.
No talking-head avatar — clean animated bullet points with background music.

## How it works

```
fetch (Firecrawl)  ->  data/raw-DATE.json
summarize (Claude) ->  data/storyboard-DATE.json
render (Remotion)  ->  out/daily-cs-DATE.mp4
```

## Prerequisites

- Node.js 22+
- ffmpeg is bundled by Remotion; no separate install needed.

## Setup

```bash
npm install
cp .env.example .env
# then edit .env and fill in:
#   ANTHROPIC_API_KEY  (https://console.anthropic.com/)
#   FIRECRAWL_API_KEY  (https://www.firecrawl.dev/)
```

## Try it with no API keys

The renderer ships with a sample storyboard, so you can see a finished video
immediately:

```bash
npm run render            # renders out/daily-cs-<today>.mp4 from the fixture
npm run preview           # opens Remotion Studio to tweak the templates live
```

## Daily use (needs both keys)

```bash
npm run daily             # fetch -> summarize -> render for today
# or step by step:
npm run fetch
npm run summarize
npm run render
```

Flags: `--date YYYY-MM-DD`, `--lang en|zh`. Example:

```bash
npm run daily -- --lang zh
```

## Configuration

Edit `config.json`: news query, story/bullet counts, model id, video size,
and `music` (path to a background track under `assets/`, or `null` for silent).

## Background music

Music is off by default. To add it, drop an audio file in `assets/music/` and
set `"music": "music/your-track.mp3"` in `config.json`. Use a track you have
the rights to.

## Adding new section templates

Section styling is data-driven by `category`. Add or recolor categories in
`remotion/theme.ts`. The summarizer is told which categories it may use in
`src/summarize/prompt.ts`.

## What's not included yet

TTS voiceover, auto-upload, and scheduled runs are intentionally left out of
v1. The audio track is wired so TTS can be added later.
