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
