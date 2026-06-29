# Daily CS News Video Generator — Design

**Date:** 2026-06-29
**Status:** Approved (pending spec review)

## Problem

A Counter-Strike fan wants daily CS news delivered as a short, templated,
bullet-point **video** (better retention than reading) — like the Bilibili
"每日CS" channel, but **without an AI talking-head avatar**. On-screen bullet
points only. The tool should auto-gather the news and produce a finished MP4.

## Goals

- Auto-fetch recent CS news from the web.
- Summarize the top stories into templated, sectioned bullet points.
- Render a finished **MP4** with reusable per-section templates, animated
  bullets, intro/outro, and background music.
- Support **English and Chinese** output (configurable).
- Run **end-to-end from a committed fixture with no API keys**, so the
  recipient can try it before adding their own keys.

## Non-Goals (v1)

TTS voiceover, auto-upload to Bilibili/YouTube, scheduled daily cron,
human-in-the-loop approval, thumbnail generation, web UI. All deferred behind
flags or follow-ups. The architecture must not preclude them (notably the
audio track is structured so TTS can be added later).

## Architecture

A single Node/TypeScript project. Three pipeline stages hand off **JSON files
on disk**. The on-disk artifacts are central: each stage runs and re-runs
independently, so templates can be iterated without re-fetching news or
re-calling Claude.

```
config + sources
      │
  [1] fetch ───────▶ data/raw-YYYY-MM-DD.json        (articles)
      │
  [2] summarize ───▶ data/storyboard-YYYY-MM-DD.json  (the contract)
      │
  [3] render ──────▶ out/daily-cs-YYYY-MM-DD.mp4
```

### Components

- **`fetch`** — Firecrawl search + scrape over CS news sources (HLTV, news
  sites). Output: raw articles `{title, url, publishedAt, content, source,
  imageUrl?}`. A failing source is skipped, not fatal; fails only if zero
  stories are gathered. raw.json is cached so later stages re-run freely.

- **`summarize`** — Claude (`claude-opus-4-8`) ranks/selects the top N stories,
  groups them into sections, and writes the templated bullets in the target
  language. Output is validated against the storyboard zod schema; one retry on
  invalid JSON; section and bullet counts are capped.

- **`render`** — Remotion turns the storyboard into MP4 via headless
  Chrome + ffmpeg. One reusable React component per section template, plus
  intro/outro and a background music track. Remotion validates `inputProps`
  against the schema and errors clearly if the storyboard is missing/malformed.

- **CLI orchestrator** — `daily-cs fetch | summarize | render | all | preview`,
  with flags `--lang en|zh`, `--date`, `--count`. `preview` opens Remotion
  Studio on the latest (or fixture) storyboard for live template editing.

## The Storyboard Schema (contract between summarize ⇄ render)

The clean interface: `render` knows only this; `summarize` produces only this.
Defined once in `src/schema.ts` (zod) and shared by both stages.

```jsonc
{
  "date": "2026-06-29",
  "language": "en",                       // "en" | "zh"
  "title": "Daily CS — June 29",
  "sections": [
    {
      "category": "Roster Move",          // drives badge color + icon via theme
      "headline": "NAVI shuffles roster",
      "bullets": ["b1t benched...", "...", "..."],   // 2–4 bullets
      "source": { "name": "HLTV", "url": "https://..." },
      "imageUrl": "https://..."           // optional
    }
  ]
}
```

Section duration is computed from bullet count (`base + perBullet * n`), so the
video length adapts to the volume of news.

## Project Structure

The repository root is the project (it will be pushed as its own public repo).

```
.
  src/
    fetch/          # Firecrawl client + source config
    summarize/      # Claude client + prompt + schema usage
    schema.ts       # shared storyboard schema (single source of truth)
    cli.ts          # orchestrator: fetch | summarize | render | all | preview
  remotion/
    Root.tsx        # registers compositions
    DailyCS.tsx     # intro → sections → outro + music
    components/     # Section.tsx, Intro.tsx, Outro.tsx, Bullet.tsx
    theme.ts        # category → color/icon mapping; fonts (CJK for zh)
  data/             # raw-*.json, storyboard-*.json   (gitignored)
  out/              # rendered mp4s                    (gitignored)
  fixtures/
    storyboard.sample.json   # render a full video with NO API keys
    raw.sample.json          # summarize without a live fetch
  assets/music/     # royalty-free background track
  config.json       # sources, query terms, defaults, music path
  .env.example      # ANTHROPIC_API_KEY=, FIRECRAWL_API_KEY=  (blank)
  README.md         # setup + usage, written for the recipient
```

## Configuration & Keys

- Secrets live in `.env` (gitignored). The repo ships `.env.example` with both
  keys **blank** for the recipient to fill in.
- Non-secret settings (`config.json`): news sources/query, default language,
  story/section/bullet counts, model id, music path.
- **No-key path:** `daily-cs render` and `daily-cs preview` work off
  `fixtures/storyboard.sample.json` with no keys at all. Only `fetch`
  (Firecrawl) and `summarize` (Anthropic) require keys.

## Error Handling

- **fetch**: skip failing sources; fail only on zero results; cache raw.json.
- **summarize**: validate Claude output against zod; one retry on invalid JSON;
  cap section/bullet counts.
- **render**: validate inputProps against schema; clear error if storyboard
  missing/malformed.
- Every stage is idempotent and re-runnable from its input artifact.

## Testing

- Unit tests: schema validation, summarize output parsing (fixture raw.json +
  mocked Claude), section-timing calculation, theme/category mapping.
- Committed `fixtures/storyboard.sample.json` renders a full video with **no API
  keys** — fast template iteration and CI-friendly.
- Render smoke test: render a short clip from the fixture in CI.

## Delivery

- Initialize as a git repo and push to a **new public GitHub repo** (account:
  Quantumplations) so it can be shared.
- README written for the recipient: prerequisites (Node, ffmpeg via Remotion),
  `npm install`, copy `.env.example` → `.env`, fill keys, `npm run daily`.

## Open Questions

None blocking. Background music asset and exact news source list will be
finalized during implementation (royalty-free track; HLTV + general CS news
search as the default sources).
