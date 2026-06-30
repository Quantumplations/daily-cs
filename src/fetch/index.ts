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
