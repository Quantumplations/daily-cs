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
