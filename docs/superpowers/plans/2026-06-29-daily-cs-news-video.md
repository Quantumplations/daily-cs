# Daily CS News Video Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Node/TypeScript tool that auto-fetches Counter-Strike news, summarizes it into templated bullet-point sections with Claude, and renders a finished MP4 with Remotion — runnable end-to-end from a committed fixture with no API keys.

**Architecture:** Three pipeline stages (`fetch` → `summarize` → `render`) that hand off JSON files on disk. A shared zod `Storyboard` schema is the contract between `summarize` and `render`. The renderer is a Remotion React project with one reusable component per section template. A CLI orchestrates the stages.

**Tech Stack:** TypeScript, Remotion 4 (`@remotion/bundler`, `@remotion/renderer`, `@remotion/cli`, `@remotion/google-fonts`), React 18, `@anthropic-ai/sdk`, `@mendable/firecrawl-js`, `zod`, `dotenv`, `vitest`, `tsx`.

## Global Constraints

- Node 22+ (the firecrawl SDK requires Node ≥22). TypeScript strict mode. ES modules (`"type": "module"`).
- Video: 1920×1080, 30 fps.
- Languages supported: `en` and `zh` only.
- Model id for summarize: `claude-opus-4-8` (configurable in `config.json`).
- `render` and `preview` MUST work with zero API keys, off `fixtures/storyboard.sample.json`.
- Secrets only in `.env` (gitignored); repo ships `.env.example` with blank keys.
- `data/` and `out/` are gitignored. Frequent commits, one per task.
- Final delivery: push to a new **public** GitHub repo (account: Quantumplations).

## Shared Types & Interfaces (defined across tasks — names are fixed)

- `src/schema.ts`: `Storyboard`, `Section`, `Source` types; `StoryboardSchema` (zod); `parseStoryboard(data: unknown): Storyboard`.
- `src/paths.ts`: `DATA_DIR`, `OUT_DIR`, `FIXTURE_STORYBOARD`, `FIXTURE_RAW`; `rawPath(date)`, `storyboardPath(date)`, `outPath(date)`, `today()`.
- `src/timing.ts`: `FPS`, `INTRO_FRAMES`, `OUTRO_FRAMES`, `sectionDurationFrames(bulletCount: number): number`, `totalDurationFrames(sb: Storyboard): number`.
- `src/config.ts`: `AppConfig` type; `loadConfig(): AppConfig`.
- `src/fetch/types.ts`: `RawArticle`.
- `src/fetch/fetcher.ts`: `transformSearchResults(results: unknown[]): RawArticle[]`, `searchNews(apiKey, query, limit): Promise<RawArticle[]>`.
- `src/fetch/index.ts`: `runFetch(opts: { date: string }): Promise<string>`.
- `src/summarize/prompt.ts`: `buildPrompt(articles: RawArticle[], opts): { system: string; user: string }`, `extractJson(text: string): string`, `parseSummaryResponse(text, meta): Storyboard`.
- `src/summarize/index.ts`: `runSummarize(opts: { date: string; language: 'en'|'zh' }): Promise<string>`.
- `src/render/index.ts`: `runRender(opts: { date: string }): Promise<string>`.
- `remotion/theme.ts`: `CategoryStyle`, `categoryStyle(category: string): CategoryStyle`.

---

### Task 1: Project scaffold & toolchain

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `remotion.config.ts`, `.gitignore`, `.env.example`, `config.json`
- Create dir placeholders: `data/.gitkeep`, `out/.gitkeep`, `assets/music/.gitkeep`

**Interfaces:**
- Produces: a working toolchain — `npm test` and `npm run typecheck` run cleanly.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "daily-cs",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "fetch": "tsx src/cli.ts fetch",
    "summarize": "tsx src/cli.ts summarize",
    "render": "tsx src/cli.ts render",
    "daily": "tsx src/cli.ts all",
    "preview": "remotion studio remotion/index.ts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.1",
    "@mendable/firecrawl-js": "^1.19.0",
    "@remotion/bundler": "4.0.290",
    "@remotion/cli": "4.0.290",
    "@remotion/google-fonts": "4.0.290",
    "@remotion/renderer": "4.0.290",
    "dotenv": "^16.4.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "remotion": "4.0.290",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "tsx": "^4.19.0",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": false,
    "noEmit": true,
    "lib": ["ES2022", "DOM"],
    "types": ["node"]
  },
  "include": ["src", "remotion", "*.ts"]
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'remotion/**/*.test.ts'],
    passWithNoTests: true,
  },
});
```

- [ ] **Step 4: Create `remotion.config.ts`**

```ts
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setConcurrency(2);
```

- [ ] **Step 5: Create `.gitignore`**

```gitignore
node_modules/
data/*
!data/.gitkeep
out/*
!out/.gitkeep
.env
*.log
```

- [ ] **Step 6: Create `.env.example`**

```dotenv
# Fill these in, then copy this file to .env
# Anthropic API key — used by the summarize stage. https://console.anthropic.com/
ANTHROPIC_API_KEY=
# Firecrawl API key — used by the fetch stage. https://www.firecrawl.dev/
FIRECRAWL_API_KEY=
```

- [ ] **Step 7: Create `config.json`**

```json
{
  "language": "en",
  "model": "claude-opus-4-8",
  "fetch": {
    "query": "Counter-Strike CS2 news",
    "limit": 10
  },
  "summary": {
    "maxStories": 5,
    "maxBulletsPerSection": 4
  },
  "video": {
    "width": 1920,
    "height": 1080,
    "fps": 30
  },
  "music": null
}
```

- [ ] **Step 8: Create dir placeholders**

```bash
mkdir -p data out assets/music
touch data/.gitkeep out/.gitkeep assets/music/.gitkeep
```

- [ ] **Step 9: Install dependencies**

Run: `npm install`
Expected: completes, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 10: Verify toolchain**

Run: `npm test`
Expected: vitest runs, "no test files found" but PASSES (passWithNoTests).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: project scaffold and toolchain"
```

---

### Task 2: Storyboard schema

**Files:**
- Create: `src/schema.ts`
- Test: `src/schema.test.ts`

**Interfaces:**
- Produces: `StoryboardSchema`, `parseStoryboard(data: unknown): Storyboard`; types `Storyboard`, `Section`, `Source`.

- [ ] **Step 1: Write the failing test** — `src/schema.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { parseStoryboard } from './schema';

const valid = {
  date: '2026-06-29',
  language: 'en',
  title: 'Daily CS — June 29',
  sections: [
    {
      category: 'Roster Move',
      headline: 'NAVI shuffles roster',
      bullets: ['b1t benched', 'iM moves to bench'],
      source: { name: 'HLTV', url: 'https://www.hltv.org/news/1' },
    },
  ],
};

describe('parseStoryboard', () => {
  it('accepts a valid storyboard', () => {
    expect(parseStoryboard(valid).sections).toHaveLength(1);
  });

  it('rejects empty sections', () => {
    expect(() => parseStoryboard({ ...valid, sections: [] })).toThrow();
  });

  it('rejects an unsupported language', () => {
    expect(() => parseStoryboard({ ...valid, language: 'fr' })).toThrow();
  });

  it('rejects a malformed date', () => {
    expect(() => parseStoryboard({ ...valid, date: '6/29/2026' })).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- schema`
Expected: FAIL — cannot resolve `./schema`.

- [ ] **Step 3: Write `src/schema.ts`**

```ts
import { z } from 'zod';

export const SourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

export const SectionSchema = z.object({
  category: z.string().min(1),
  headline: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1).max(5),
  source: SourceSchema,
  imageUrl: z.string().url().optional(),
});

export const StoryboardSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  language: z.enum(['en', 'zh']),
  title: z.string().min(1),
  sections: z.array(SectionSchema).min(1).max(8),
});

export type Source = z.infer<typeof SourceSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Storyboard = z.infer<typeof StoryboardSchema>;

export function parseStoryboard(data: unknown): Storyboard {
  return StoryboardSchema.parse(data);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- schema`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/schema.ts src/schema.test.ts
git commit -m "feat: storyboard zod schema and parser"
```

---

### Task 3: Path helpers

**Files:**
- Create: `src/paths.ts`
- Test: `src/paths.test.ts`

**Interfaces:**
- Produces: `DATA_DIR`, `OUT_DIR`, `FIXTURE_STORYBOARD`, `FIXTURE_RAW`, `rawPath(date)`, `storyboardPath(date)`, `outPath(date)`, `today()`.

- [ ] **Step 1: Write the failing test** — `src/paths.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { rawPath, storyboardPath, outPath, today } from './paths';

describe('paths', () => {
  it('builds the raw artifact path', () => {
    expect(rawPath('2026-06-29').endsWith('data/raw-2026-06-29.json')).toBe(true);
  });
  it('builds the storyboard path', () => {
    expect(storyboardPath('2026-06-29').endsWith('data/storyboard-2026-06-29.json')).toBe(true);
  });
  it('builds the output path', () => {
    expect(outPath('2026-06-29').endsWith('out/daily-cs-2026-06-29.mp4')).toBe(true);
  });
  it('today() returns a YYYY-MM-DD string', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- paths`
Expected: FAIL — cannot resolve `./paths`.

- [ ] **Step 3: Write `src/paths.ts`**

```ts
import path from 'node:path';

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, 'data');
export const OUT_DIR = path.join(ROOT, 'out');
export const FIXTURE_STORYBOARD = path.join(ROOT, 'fixtures', 'storyboard.sample.json');
export const FIXTURE_RAW = path.join(ROOT, 'fixtures', 'raw.sample.json');

export function rawPath(date: string): string {
  return path.join(DATA_DIR, `raw-${date}.json`);
}

export function storyboardPath(date: string): string {
  return path.join(DATA_DIR, `storyboard-${date}.json`);
}

export function outPath(date: string): string {
  return path.join(OUT_DIR, `daily-cs-${date}.mp4`);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- paths`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/paths.ts src/paths.test.ts
git commit -m "feat: filesystem path helpers"
```

---

### Task 4: Timing module

**Files:**
- Create: `src/timing.ts`
- Test: `src/timing.test.ts`

**Interfaces:**
- Consumes: `Storyboard` from `src/schema.ts`.
- Produces: `FPS`, `INTRO_FRAMES`, `OUTRO_FRAMES`, `sectionDurationFrames(bulletCount)`, `totalDurationFrames(sb)`.

- [ ] **Step 1: Write the failing test** — `src/timing.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import {
  FPS, INTRO_FRAMES, OUTRO_FRAMES, sectionDurationFrames, totalDurationFrames,
} from './timing';
import type { Storyboard } from './schema';

describe('timing', () => {
  it('section duration grows with bullet count', () => {
    expect(sectionDurationFrames(4)).toBeGreaterThan(sectionDurationFrames(1));
  });

  it('total duration includes intro, sections, and outro', () => {
    const sb = {
      date: '2026-06-29', language: 'en', title: 'T',
      sections: [
        { category: 'A', headline: 'h', bullets: ['1', '2'], source: { name: 's', url: 'https://x.com' } },
        { category: 'B', headline: 'h', bullets: ['1'], source: { name: 's', url: 'https://x.com' } },
      ],
    } as Storyboard;
    const expected = INTRO_FRAMES + sectionDurationFrames(2) + sectionDurationFrames(1) + OUTRO_FRAMES;
    expect(totalDurationFrames(sb)).toBe(expected);
  });

  it('uses 30 fps', () => {
    expect(FPS).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- timing`
Expected: FAIL — cannot resolve `./timing`.

- [ ] **Step 3: Write `src/timing.ts`**

```ts
import type { Storyboard } from './schema';

export const FPS = 30;
export const INTRO_FRAMES = 90; // 3s
export const OUTRO_FRAMES = 60; // 2s
export const SECTION_BASE_FRAMES = 90; // 3s base
export const PER_BULLET_FRAMES = 36; // 1.2s per bullet

export function sectionDurationFrames(bulletCount: number): number {
  return SECTION_BASE_FRAMES + PER_BULLET_FRAMES * bulletCount;
}

export function totalDurationFrames(sb: Storyboard): number {
  const sections = sb.sections.reduce(
    (sum, s) => sum + sectionDurationFrames(s.bullets.length),
    0,
  );
  return INTRO_FRAMES + sections + OUTRO_FRAMES;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- timing`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/timing.ts src/timing.test.ts
git commit -m "feat: section timing calculation"
```

---

### Task 5: Config loader

**Files:**
- Create: `src/config.ts`
- Test: `src/config.test.ts`

**Interfaces:**
- Produces: `AppConfig` type; `loadConfig(file?: string): AppConfig`.

- [ ] **Step 1: Write the failing test** — `src/config.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('loads config.json with expected defaults', () => {
    const cfg = loadConfig();
    expect(['en', 'zh']).toContain(cfg.language);
    expect(cfg.model.length).toBeGreaterThan(0);
    expect(cfg.fetch.limit).toBeGreaterThan(0);
    expect(cfg.video.fps).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- config`
Expected: FAIL — cannot resolve `./config`.

- [ ] **Step 3: Write `src/config.ts`**

```ts
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const ConfigSchema = z.object({
  language: z.enum(['en', 'zh']),
  model: z.string().min(1),
  fetch: z.object({ query: z.string().min(1), limit: z.number().int().positive() }),
  summary: z.object({
    maxStories: z.number().int().positive(),
    maxBulletsPerSection: z.number().int().positive(),
  }),
  video: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fps: z.number().int().positive(),
  }),
  music: z.string().nullable(),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(file = path.join(process.cwd(), 'config.json')): AppConfig {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  return ConfigSchema.parse(raw);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- config`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/config.ts src/config.test.ts
git commit -m "feat: validated config loader"
```

---

### Task 6: Fixtures

**Files:**
- Create: `fixtures/storyboard.sample.json`, `fixtures/raw.sample.json`
- Test: `src/fixtures.test.ts`

**Interfaces:**
- Consumes: `parseStoryboard` from schema.
- Produces: committed fixtures that drive keyless render and summarize tests.

- [ ] **Step 1: Write the failing test** — `src/fixtures.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { parseStoryboard } from './schema';
import { FIXTURE_STORYBOARD, FIXTURE_RAW } from './paths';

describe('fixtures', () => {
  it('storyboard.sample.json is a valid storyboard', () => {
    const data = JSON.parse(fs.readFileSync(FIXTURE_STORYBOARD, 'utf8'));
    expect(parseStoryboard(data).sections.length).toBeGreaterThanOrEqual(3);
  });

  it('raw.sample.json is a non-empty array of articles', () => {
    const data = JSON.parse(fs.readFileSync(FIXTURE_RAW, 'utf8'));
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('title');
    expect(data[0]).toHaveProperty('url');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- fixtures`
Expected: FAIL — fixture files do not exist.

- [ ] **Step 3: Create `fixtures/storyboard.sample.json`**

```json
{
  "date": "2026-06-29",
  "language": "en",
  "title": "Daily CS — June 29",
  "sections": [
    {
      "category": "Roster Move",
      "headline": "NAVI shake up their roster",
      "bullets": [
        "b1t moves to the bench after a six-month slump",
        "Academy AWPer promoted to the main lineup",
        "Coach hints the change is 'permanent for now'"
      ],
      "source": { "name": "HLTV", "url": "https://www.hltv.org/news/sample-navi" }
    },
    {
      "category": "Match Result",
      "headline": "Vitality edge FaZe 2-1 in the BLAST final",
      "bullets": [
        "ZywOo drops 28 in the decider on Ancient",
        "FaZe force overtime on Mirage but fall short",
        "Vitality take their third trophy of the season"
      ],
      "source": { "name": "HLTV", "url": "https://www.hltv.org/news/sample-vitality" }
    },
    {
      "category": "Patch",
      "headline": "CS2 patch reworks smoke interactions",
      "bullets": [
        "HE grenades now clear a larger smoke radius",
        "Sub-tick movement bug on stairs fixed",
        "New de_train competitive layout enters the pool"
      ],
      "source": { "name": "Steam", "url": "https://store.steampowered.com/news/sample-patch" }
    },
    {
      "category": "Event",
      "headline": "Major qualifier brackets are locked",
      "bullets": [
        "16 teams confirmed for the Shanghai qualifier",
        "Two spots remain in the open-qualifier gauntlet",
        "Group draw scheduled for next Friday"
      ],
      "source": { "name": "Liquipedia", "url": "https://liquipedia.net/counterstrike/sample" }
    }
  ]
}
```

- [ ] **Step 4: Create `fixtures/raw.sample.json`**

```json
[
  {
    "title": "NAVI bench b1t, promote academy AWPer",
    "url": "https://www.hltv.org/news/sample-navi",
    "content": "NAVI have announced a roster change, moving b1t to the bench after a six-month slump and promoting their academy AWPer to the main lineup. The coach said the change is permanent for now.",
    "source": "hltv.org",
    "publishedAt": "2026-06-29T08:00:00Z"
  },
  {
    "title": "Vitality beat FaZe 2-1 to win BLAST final",
    "url": "https://www.hltv.org/news/sample-vitality",
    "content": "Vitality edged FaZe 2-1 in the BLAST final. ZywOo dropped 28 in the decider on Ancient. FaZe forced overtime on Mirage but fell short. It is Vitality's third trophy of the season.",
    "source": "hltv.org",
    "publishedAt": "2026-06-29T06:30:00Z"
  },
  {
    "title": "CS2 patch notes: smoke and movement changes",
    "url": "https://store.steampowered.com/news/sample-patch",
    "content": "The latest CS2 patch reworks smoke interactions: HE grenades clear a larger radius, a sub-tick movement bug on stairs is fixed, and de_train enters the competitive pool.",
    "source": "steampowered.com",
    "publishedAt": "2026-06-29T05:00:00Z"
  },
  {
    "title": "Shanghai Major qualifier brackets locked",
    "url": "https://liquipedia.net/counterstrike/sample",
    "content": "16 teams are confirmed for the Shanghai qualifier with two spots left in the open-qualifier gauntlet. The group draw is scheduled for next Friday.",
    "source": "liquipedia.net",
    "publishedAt": "2026-06-29T04:00:00Z"
  }
]
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- fixtures`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add fixtures src/fixtures.test.ts
git commit -m "test: committed storyboard and raw fixtures"
```

---

### Task 7: Theme

**Files:**
- Create: `remotion/theme.ts`
- Test: `remotion/theme.test.ts`

**Interfaces:**
- Produces: `CategoryStyle` type; `categoryStyle(category: string): CategoryStyle`.

- [ ] **Step 1: Write the failing test** — `remotion/theme.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { categoryStyle } from './theme';

describe('categoryStyle', () => {
  it('returns a distinct style for a known category', () => {
    const s = categoryStyle('Roster Move');
    expect(s.color).toMatch(/^#/);
    expect(s.icon.length).toBeGreaterThan(0);
  });

  it('falls back to a default style for an unknown category', () => {
    const s = categoryStyle('Totally Unknown Category');
    expect(s.color).toMatch(/^#/);
    expect(s.icon.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- theme`
Expected: FAIL — cannot resolve `./theme`.

- [ ] **Step 3: Write `remotion/theme.ts`**

```ts
export type CategoryStyle = { color: string; icon: string };

const STYLES: Record<string, CategoryStyle> = {
  'Roster Move': { color: '#f59e0b', icon: '🔁' },
  'Match Result': { color: '#22c55e', icon: '🏆' },
  Patch: { color: '#3b82f6', icon: '🛠️' },
  Event: { color: '#a855f7', icon: '📅' },
  Drama: { color: '#ef4444', icon: '🔥' },
  Transfer: { color: '#06b6d4', icon: '✈️' },
};

const DEFAULT_STYLE: CategoryStyle = { color: '#64748b', icon: '📰' };

export function categoryStyle(category: string): CategoryStyle {
  return STYLES[category] ?? DEFAULT_STYLE;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- theme`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add remotion/theme.ts remotion/theme.test.ts
git commit -m "feat: category theme mapping"
```

---

### Task 8: Remotion video (fonts, components, composition)

This task is visual; it is verified by a Remotion render smoke test, not unit tests. Build all files, then render a still and a short clip from the fixture.

**Files:**
- Create: `remotion/fonts.ts`, `remotion/components/Bullet.tsx`, `remotion/components/Section.tsx`, `remotion/components/Intro.tsx`, `remotion/components/Outro.tsx`, `remotion/DailyCS.tsx`, `remotion/Root.tsx`, `remotion/index.ts`

**Interfaces:**
- Consumes: `Storyboard`, `Section` (schema), `categoryStyle` (theme), timing constants.
- Produces: a registered Remotion composition with id `DailyCS` whose `inputProps` are a `Storyboard` plus optional `music: string | null`.

- [ ] **Step 1: Create `remotion/fonts.ts`**

```ts
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadNotoSansSC } from '@remotion/google-fonts/NotoSansSC';

const inter = loadInter();
const noto = loadNotoSansSC();

export function fontFamily(language: 'en' | 'zh'): string {
  return language === 'zh' ? noto.fontFamily : inter.fontFamily;
}
```

- [ ] **Step 2: Create `remotion/components/Bullet.tsx`**

```tsx
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Bullet: React.FC<{ text: string; index: number; color: string }> = ({
  text, index, color,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 12 + index * 12;
  const enter = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const x = interpolate(enter, [0, 1], [-40, 0]);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20,
      opacity, transform: `translateX(${x}px)`, marginBottom: 28,
    }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 46, color: 'white', lineHeight: 1.25 }}>{text}</span>
    </div>
  );
};
```

- [ ] **Step 3: Create `remotion/components/Section.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import type { Section as SectionData } from '../../src/schema';
import { categoryStyle } from '../theme';
import { Bullet } from './Bullet';

export const Section: React.FC<{ section: SectionData }> = ({ section }) => {
  const { color, icon } = categoryStyle(section.category);
  const frame = useCurrentFrame();
  const headerY = interpolate(frame, [0, 15], [30, 0], { extrapolateRight: 'clamp' });
  const headerO = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg,#0f172a,#1e293b)',
      padding: 110, justifyContent: 'center',
    }}>
      <div style={{ transform: `translateY(${headerY}px)`, opacity: headerO, marginBottom: 56 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 16, background: color,
          padding: '12px 30px', borderRadius: 999, fontSize: 34, color: 'white', fontWeight: 700,
        }}>
          <span>{icon}</span><span>{section.category}</span>
        </div>
        <h1 style={{ fontSize: 68, color: 'white', margin: '26px 0 0', fontWeight: 800 }}>
          {section.headline}
        </h1>
      </div>
      <div>
        {section.bullets.map((b, i) => (
          <Bullet key={i} text={b} index={i} color={color} />
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 64, left: 110, fontSize: 30, color: '#94a3b8' }}>
        {section.source.name}
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: Create `remotion/components/Intro.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Intro: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200 } });
  const scale = interpolate(s, [0, 1], [0.8, 1]);
  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(circle at center,#1e293b,#020617)',
      justifyContent: 'center', alignItems: 'center',
    }}>
      <div style={{ transform: `scale(${scale})`, opacity: s, textAlign: 'center' }}>
        <div style={{ fontSize: 42, letterSpacing: 14, color: '#f59e0b', fontWeight: 700 }}>
          DAILY CS
        </div>
        <h1 style={{ fontSize: 84, color: 'white', margin: '22px 0 0', fontWeight: 900 }}>
          {title}
        </h1>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 5: Create `remotion/components/Outro.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{
      background: '#020617', justifyContent: 'center', alignItems: 'center', opacity,
    }}>
      <h1 style={{ fontSize: 66, color: 'white', fontWeight: 800 }}>GG — see you tomorrow</h1>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 6: Create `remotion/DailyCS.tsx`**

```tsx
import React from 'react';
import { AbsoluteFill, Audio, Series, staticFile } from 'remotion';
import type { Storyboard } from '../src/schema';
import { INTRO_FRAMES, OUTRO_FRAMES, sectionDurationFrames } from '../src/timing';
import { Intro } from './components/Intro';
import { Section } from './components/Section';
import { Outro } from './components/Outro';
import { fontFamily } from './fonts';

export type DailyCSProps = Storyboard & { music?: string | null };

export const DailyCS: React.FC<DailyCSProps> = ({ title, language, sections, music }) => {
  return (
    <AbsoluteFill style={{ fontFamily: fontFamily(language) }}>
      {music ? <Audio src={staticFile(music)} volume={0.3} /> : null}
      <Series>
        <Series.Sequence durationInFrames={INTRO_FRAMES}>
          <Intro title={title} />
        </Series.Sequence>
        {sections.map((s, i) => (
          <Series.Sequence key={i} durationInFrames={sectionDurationFrames(s.bullets.length)}>
            <Section section={s} />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={OUTRO_FRAMES}>
          <Outro />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 7: Create `remotion/Root.tsx`**

```tsx
import React from 'react';
import { Composition } from 'remotion';
import { DailyCS } from './DailyCS';
import { StoryboardSchema } from '../src/schema';
import { FPS, totalDurationFrames } from '../src/timing';
import sample from '../fixtures/storyboard.sample.json';

const sampleStoryboard = StoryboardSchema.parse(sample);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DailyCS"
      component={DailyCS}
      durationInFrames={totalDurationFrames(sampleStoryboard)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ ...sampleStoryboard, music: null }}
      calculateMetadata={({ props }) => {
        const sb = StoryboardSchema.parse(props);
        return { durationInFrames: totalDurationFrames(sb) };
      }}
    />
  );
};
```

- [ ] **Step 8: Create `remotion/index.ts`**

```ts
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
```

- [ ] **Step 9: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 10: Render a still to verify composition loads**

Run: `npx remotion still remotion/index.ts DailyCS out/frame.png --frame=120`
Expected: writes `out/frame.png` (a Section frame). Open it to confirm a section renders with badge, headline, bullets.

- [ ] **Step 11: Render a short clip smoke test**

Run: `npx remotion render remotion/index.ts DailyCS out/smoke.mp4 --frames=0-90`
Expected: writes `out/smoke.mp4` (the intro). No errors.

- [ ] **Step 12: Commit**

```bash
git add remotion/fonts.ts remotion/components remotion/DailyCS.tsx remotion/Root.tsx remotion/index.ts
git commit -m "feat: remotion composition and section templates"
```

---

### Task 9: Render runner

**Files:**
- Create: `src/render/index.ts`

**Interfaces:**
- Consumes: `parseStoryboard` (schema); `storyboardPath`, `outPath`, `OUT_DIR`, `FIXTURE_STORYBOARD` (paths).
- Produces: `runRender(opts: { date: string }): Promise<string>` — returns the output mp4 path. Falls back to the fixture when no dated storyboard exists.

- [ ] **Step 1: Write `src/render/index.ts`**

```ts
import fs from 'node:fs';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { parseStoryboard } from '../schema';
import { storyboardPath, outPath, OUT_DIR, FIXTURE_STORYBOARD } from '../paths';

export async function runRender(opts: { date: string }): Promise<string> {
  const dated = storyboardPath(opts.date);
  const sbFile = fs.existsSync(dated) ? dated : FIXTURE_STORYBOARD;
  const storyboard = parseStoryboard(JSON.parse(fs.readFileSync(sbFile, 'utf8')));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const serveUrl = await bundle({ entryPoint: path.resolve('remotion/index.ts') });
  const inputProps = { ...storyboard, music: null };
  const composition = await selectComposition({ serveUrl, id: 'DailyCS', inputProps });

  const output = outPath(opts.date);
  await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: output, inputProps });
  console.log(`Rendered ${output} (from ${path.basename(sbFile)})`);
  return output;
}
```

- [ ] **Step 2: Verify it renders from the fixture (keyless)**

Run: `npx tsx -e "import('./src/render/index.ts').then(m => m.runRender({ date: '2099-01-01' }))"`
Expected: no dated storyboard for 2099-01-01, so it falls back to the fixture and writes `out/daily-cs-2099-01-01.mp4`. Confirm the file exists and is > 0 bytes:
Run: `ls -la out/daily-cs-2099-01-01.mp4`

- [ ] **Step 3: Commit**

```bash
git add src/render/index.ts
git commit -m "feat: programmatic remotion render runner"
```

---

### Task 10: Fetch stage

**Files:**
- Create: `src/fetch/types.ts`, `src/fetch/fetcher.ts`, `src/fetch/index.ts`
- Test: `src/fetch/fetcher.test.ts`

**Interfaces:**
- Consumes: `loadConfig` (config); `rawPath`, `DATA_DIR` (paths).
- Produces: `RawArticle`; `transformSearchResults(results: unknown[]): RawArticle[]`; `searchNews(apiKey, query, limit): Promise<RawArticle[]>`; `runFetch(opts: { date: string }): Promise<string>`.

- [ ] **Step 1: Write `src/fetch/types.ts`**

```ts
export type RawArticle = {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  imageUrl?: string;
};
```

- [ ] **Step 2: Write the failing test** — `src/fetch/fetcher.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { transformSearchResults } from './fetcher';

describe('transformSearchResults', () => {
  it('maps firecrawl results to RawArticle and derives source host', () => {
    const out = transformSearchResults([
      { url: 'https://www.hltv.org/news/1', title: 'A', markdown: 'body', metadata: { ogImage: 'https://img/1.png' } },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe('hltv.org');
    expect(out[0].content).toBe('body');
    expect(out[0].imageUrl).toBe('https://img/1.png');
  });

  it('drops entries without a url', () => {
    const out = transformSearchResults([{ title: 'no url' }, null, { url: 'https://x.com/a', title: 'ok' }]);
    expect(out).toHaveLength(1);
    expect(out[0].url).toBe('https://x.com/a');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- fetcher`
Expected: FAIL — cannot resolve `./fetcher`.

- [ ] **Step 4: Write `src/fetch/fetcher.ts`**

```ts
import Firecrawl from '@mendable/firecrawl-js';
import type { RawArticle } from './types';

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

export function transformSearchResults(results: unknown[]): RawArticle[] {
  return (results ?? [])
    .filter((r): r is Record<string, any> => !!r && typeof r === 'object' && typeof (r as any).url === 'string')
    .map((r) => ({
      title: r.title ?? r.metadata?.title ?? 'Untitled',
      url: r.url,
      content: r.markdown ?? r.description ?? '',
      source: hostnameOf(r.url),
      publishedAt: r.metadata?.publishedTime,
      imageUrl: r.metadata?.ogImage,
    }));
}

export async function searchNews(apiKey: string, query: string, limit: number): Promise<RawArticle[]> {
  const app = new Firecrawl({ apiKey });
  const res: any = await app.search(query, {
    limit,
    scrapeOptions: { formats: ['markdown'] },
  });
  const data = res?.data ?? res?.web ?? res;
  return transformSearchResults(Array.isArray(data) ? data : []);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- fetcher`
Expected: PASS (2 tests).

- [ ] **Step 6: Write `src/fetch/index.ts`**

```ts
import 'dotenv/config';
import fs from 'node:fs';
import { loadConfig } from '../config';
import { rawPath, DATA_DIR } from '../paths';
import { searchNews } from './fetcher';

export async function runFetch(opts: { date: string }): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY is not set. Copy .env.example to .env and fill it in.');

  const cfg = loadConfig();
  const articles = await searchNews(apiKey, cfg.fetch.query, cfg.fetch.limit);
  if (articles.length === 0) throw new Error('Fetch returned zero articles.');

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const out = rawPath(opts.date);
  fs.writeFileSync(out, JSON.stringify(articles, null, 2));
  console.log(`Fetched ${articles.length} articles -> ${out}`);
  return out;
}
```

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/fetch
git commit -m "feat: firecrawl fetch stage"
```

---

### Task 11: Summarize stage

**Files:**
- Create: `src/summarize/prompt.ts`, `src/summarize/index.ts`
- Test: `src/summarize/prompt.test.ts`

**Interfaces:**
- Consumes: `RawArticle` (fetch types); `parseStoryboard`, types (schema); `loadConfig` (config); `rawPath`, `storyboardPath`, `DATA_DIR`, `FIXTURE_RAW` (paths).
- Produces: `buildPrompt(articles, opts): { system: string; user: string }`; `extractJson(text): string`; `parseSummaryResponse(text, meta): Storyboard`; `runSummarize(opts: { date: string; language: 'en'|'zh' }): Promise<string>`.

- [ ] **Step 1: Write the failing test** — `src/summarize/prompt.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { extractJson, parseSummaryResponse, buildPrompt } from './prompt';

const modelSections = {
  title: 'Daily CS — June 29',
  sections: [
    { category: 'Roster Move', headline: 'NAVI shuffle', bullets: ['a', 'b'], source: { name: 'HLTV', url: 'https://www.hltv.org/news/1' } },
  ],
};

describe('extractJson', () => {
  it('pulls JSON out of a ```json fenced block', () => {
    const text = 'Here you go:\n```json\n{"a":1}\n```\nthanks';
    expect(JSON.parse(extractJson(text))).toEqual({ a: 1 });
  });
  it('pulls a bare JSON object out of surrounding prose', () => {
    expect(JSON.parse(extractJson('prefix {"a":2} suffix'))).toEqual({ a: 2 });
  });
  it('throws when there is no JSON object', () => {
    expect(() => extractJson('no json here')).toThrow();
  });
});

describe('parseSummaryResponse', () => {
  it('injects date and language and validates against the schema', () => {
    const text = '```json\n' + JSON.stringify(modelSections) + '\n```';
    const sb = parseSummaryResponse(text, { date: '2026-06-29', language: 'en' });
    expect(sb.date).toBe('2026-06-29');
    expect(sb.language).toBe('en');
    expect(sb.sections).toHaveLength(1);
  });
});

describe('buildPrompt', () => {
  it('includes the language and the article titles in the user prompt', () => {
    const { system, user } = buildPrompt(
      [{ title: 'NAVI bench b1t', url: 'https://x.com/a', content: 'body', source: 'x.com' }],
      { language: 'zh', maxStories: 5, maxBulletsPerSection: 4, date: '2026-06-29' },
    );
    expect(system.length).toBeGreaterThan(0);
    expect(user).toContain('NAVI bench b1t');
    expect(user).toContain('zh');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- prompt`
Expected: FAIL — cannot resolve `./prompt`.

- [ ] **Step 3: Write `src/summarize/prompt.ts`**

```ts
import type { RawArticle } from '../fetch/types';
import { parseStoryboard, type Storyboard } from '../schema';

export type SummaryOpts = {
  language: 'en' | 'zh';
  maxStories: number;
  maxBulletsPerSection: number;
  date: string;
};

export function buildPrompt(articles: RawArticle[], opts: SummaryOpts): { system: string; user: string } {
  const system = [
    'You are an editor for a daily Counter-Strike esports news recap video.',
    'You select the most important stories and turn each into a titled section with short, punchy bullet points.',
    'Categories you may use: "Roster Move", "Match Result", "Patch", "Event", "Drama", "Transfer".',
    'Bullets must be concise (max ~12 words), factual, and readable on screen.',
    'Respond with ONLY a JSON object. No prose, no markdown fences.',
  ].join(' ');

  const schemaHint = {
    title: 'string (short, e.g. "Daily CS — June 29")',
    sections: [
      {
        category: 'one of the allowed categories',
        headline: 'string',
        bullets: [`up to ${opts.maxBulletsPerSection} short strings`],
        source: { name: 'string', url: 'string (one of the article urls)' },
      },
    ],
  };

  const articleList = articles
    .map((a, i) => `[${i + 1}] (${a.source}) ${a.title}\n${a.url}\n${a.content.slice(0, 800)}`)
    .join('\n\n');

  const user = [
    `Language for all on-screen text: ${opts.language} (write headlines and bullets in this language).`,
    `Pick at most ${opts.maxStories} stories. At most ${opts.maxBulletsPerSection} bullets per section.`,
    `Output JSON matching this shape (do not include "date" or "language" keys):`,
    JSON.stringify(schemaHint, null, 2),
    `Here are today's candidate articles:`,
    articleList,
  ].join('\n\n');

  return { system, user };
}

export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in model response');
  }
  return body.slice(start, end + 1);
}

export function parseSummaryResponse(
  text: string,
  meta: { date: string; language: 'en' | 'zh' },
): Storyboard {
  const raw = JSON.parse(extractJson(text));
  const merged = { date: meta.date, language: meta.language, ...raw };
  return parseStoryboard(merged);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- prompt`
Expected: PASS (5 tests).

- [ ] **Step 5: Write `src/summarize/index.ts`**

```ts
import 'dotenv/config';
import fs from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { loadConfig } from '../config';
import { rawPath, storyboardPath, DATA_DIR, FIXTURE_RAW } from '../paths';
import type { RawArticle } from '../fetch/types';
import type { Storyboard } from '../schema';
import { buildPrompt, parseSummaryResponse } from './prompt';

function loadArticles(date: string): RawArticle[] {
  const dated = rawPath(date);
  const file = fs.existsSync(dated) ? dated : FIXTURE_RAW;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export async function runSummarize(opts: { date: string; language: 'en' | 'zh' }): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set. Copy .env.example to .env and fill it in.');

  const cfg = loadConfig();
  const articles = loadArticles(opts.date);
  const { system, user } = buildPrompt(articles, {
    language: opts.language,
    maxStories: cfg.summary.maxStories,
    maxBulletsPerSection: cfg.summary.maxBulletsPerSection,
    date: opts.date,
  });

  const client = new Anthropic({ apiKey });

  const call = async (): Promise<string> => {
    const msg = await client.messages.create({
      model: cfg.model,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const block = msg.content.find((b) => b.type === 'text');
    return block && block.type === 'text' ? block.text : '';
  };

  let storyboard: Storyboard;
  try {
    storyboard = parseSummaryResponse(await call(), { date: opts.date, language: opts.language });
  } catch {
    // One retry on invalid/unparseable output.
    storyboard = parseSummaryResponse(await call(), { date: opts.date, language: opts.language });
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const out = storyboardPath(opts.date);
  fs.writeFileSync(out, JSON.stringify(storyboard, null, 2));
  console.log(`Summarized ${storyboard.sections.length} sections -> ${out}`);
  return out;
}
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/summarize
git commit -m "feat: claude summarize stage"
```

---

### Task 12: CLI orchestrator

**Files:**
- Create: `src/cli.ts`

**Interfaces:**
- Consumes: `runFetch`, `runSummarize`, `runRender`, `loadConfig`, `today`.
- Produces: command-line entry: `fetch | summarize | render | all`, flags `--date`, `--lang`.

- [ ] **Step 1: Write `src/cli.ts`**

```ts
import { loadConfig } from './config';
import { today } from './paths';
import { runFetch } from './fetch/index';
import { runSummarize } from './summarize/index';
import { runRender } from './render/index';

type Args = { command: string; date: string; language: 'en' | 'zh' };

function parseArgs(argv: string[]): Args {
  const command = argv[0] ?? 'all';
  const cfg = loadConfig();
  let date = today();
  let language: 'en' | 'zh' = cfg.language;
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--date') date = argv[++i];
    else if (argv[i] === '--lang') {
      const v = argv[++i];
      if (v !== 'en' && v !== 'zh') throw new Error(`--lang must be en or zh, got ${v}`);
      language = v;
    }
  }
  return { command, date, language };
}

async function main(): Promise<void> {
  const { command, date, language } = parseArgs(process.argv.slice(2));
  switch (command) {
    case 'fetch':
      await runFetch({ date });
      break;
    case 'summarize':
      await runSummarize({ date, language });
      break;
    case 'render':
      await runRender({ date });
      break;
    case 'all':
      await runFetch({ date });
      await runSummarize({ date, language });
      await runRender({ date });
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: daily-cs <fetch|summarize|render|all> [--date YYYY-MM-DD] [--lang en|zh]');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify the render command works keyless**

Run: `npm run render -- --date 2099-02-02`
Expected: falls back to fixture storyboard, writes `out/daily-cs-2099-02-02.mp4`.

- [ ] **Step 3: Verify unknown command errors cleanly**

Run: `npx tsx src/cli.ts bogus`
Expected: prints usage, exits non-zero.

- [ ] **Step 4: Commit**

```bash
git add src/cli.ts
git commit -m "feat: cli orchestrator"
```

---

### Task 13: README, env polish & end-to-end fixture verification

**Files:**
- Create: `README.md`
- Verify: full keyless path

**Interfaces:**
- Produces: recipient-facing docs and a verified keyless render.

- [ ] **Step 1: Write `README.md`**

````markdown
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
````

- [ ] **Step 2: Run the full keyless verification**

Run:
```bash
rm -rf out/*.mp4 && npm run render -- --date 2026-06-29 && ls -la out/daily-cs-2026-06-29.mp4
```
Expected: writes `out/daily-cs-2026-06-29.mp4` from the fixture, file > 0 bytes.

- [ ] **Step 3: Run the full test suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests PASS, no type errors.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: recipient-facing README"
```

---

### Task 14: Push to a new public GitHub repo

**Files:** none (delivery)

**Interfaces:**
- Produces: a public GitHub repo containing the full project.

- [ ] **Step 1: Confirm working tree is clean**

Run: `git status --porcelain`
Expected: empty output.

- [ ] **Step 2: Create the public repo and push**

Run:
```bash
gh repo create daily-cs --public --source=. --remote=origin --push --description "Automated Counter-Strike daily news recap videos (Firecrawl + Claude + Remotion)"
```
Expected: repo created under the Quantumplations account and the default branch pushed.

- [ ] **Step 3: Verify**

Run: `gh repo view --web` (or `gh repo view`)
Expected: repo exists, public, with README rendered. Share the URL with the recipient.

---

## Self-Review

**Spec coverage:**
- Auto-fetch (Firecrawl) → Task 10. ✓
- Summarize with Claude into templated sections → Task 11. ✓
- Storyboard schema contract → Task 2. ✓
- Render MP4 with Remotion, per-section templates, intro/outro, music → Tasks 7–9. ✓
- Configurable en/zh → schema enum (T2), config (T5), fonts (T8), CLI `--lang` (T12). ✓
- Runs keyless from fixture → Tasks 6, 9, 12, 13. ✓
- `.env.example` blank keys, secrets gitignored → Tasks 1. ✓
- Error handling (skip/zero-check fetch, retry summarize, validate render) → Tasks 10, 11, 9. ✓
- Tests + fixture-driven CI-friendly render → Tasks 2–7, 10, 11, 13. ✓
- Push to public repo → Task 14. ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code; every test has real assertions.

**Type consistency:** `Storyboard`/`Section`/`Source`, `parseStoryboard`, `RawArticle`, `transformSearchResults`, `searchNews`, `runFetch`, `buildPrompt`/`extractJson`/`parseSummaryResponse`, `runSummarize`, `runRender`, `categoryStyle`, timing constants, and path helpers are named consistently across producing and consuming tasks. The Remotion composition id `DailyCS` and its `inputProps` (`Storyboard & { music }`) match between `Root.tsx` (T8) and `render/index.ts` (T9).
