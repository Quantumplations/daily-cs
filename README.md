# Daily CS — automated Counter-Strike news videos

Auto-fetches Counter-Strike news, summarizes the top stories into templated
bullet-point sections with Claude, and renders a finished MP4 with Remotion.
No talking-head avatar — clean animated bullet points, optionally with background music.

## Quickstart

```bash
# 1. install Node.js 22+  (https://nodejs.org)
git clone https://github.com/Quantumplations/daily-cs
cd daily-cs
npm install

# 2. see it work right now, no keys needed — renders a sample video into out/
npm run render
#    (or `npm run preview` to live-edit the templates in your browser)

# 3. to make videos from real news, add two API keys:
cp .env.example .env
#    then edit .env and paste:
#      ANTHROPIC_API_KEY  -> https://console.anthropic.com   (paid, ~cents per run)
#      FIRECRAWL_API_KEY  -> https://www.firecrawl.dev        (free tier available)

# 4. make today's video (add `--lang zh` for Chinese)
npm run daily
#    output lands in out/daily-cs-<date>.mp4
```

Notes:
- The model defaults to `claude-opus-4-8`. If your Anthropic account can't use it,
  change `model` in `config.json` to one you can.
- Tweak the news query, language, and story count in `config.json`; tweak the
  section colors/icons in `remotion/theme.ts`.

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
and `music` (path to a background track under `public/`, or `null` for silent).
Your Anthropic account must have access to the configured `model` (default: `claude-opus-4-8`);
if not, change `model` in `config.json` to one you can use.

## Background music

Music is off by default. To add it, drop an audio file in `public/music/` and
set `"music": "music/your-track.mp3"` in `config.json` (the path is relative
to `public/`, which is where Remotion's `staticFile()` resolves from). Use a
track you have the rights to — files in `public/music/` are git-ignored.

## Adding new section templates

Section styling is data-driven by `category`. Add or recolor categories in
`remotion/theme.ts`. The summarizer is told which categories it may use in
`src/summarize/prompt.ts`.

## What's not included yet

TTS voiceover, auto-upload, and scheduled runs are intentionally left out of
v1. Background music already plays via the audio track; a TTS voiceover could
ride the same track later.
