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

  it('injected meta wins over model-returned date and language', () => {
    const modelWithWrongMeta = {
      title: 'Daily CS — June 29',
      date: '1999-01-01',
      language: 'zh',
      sections: [
        { category: 'Roster Move', headline: 'NAVI shuffle', bullets: ['a', 'b'], source: { name: 'HLTV', url: 'https://www.hltv.org/news/1' } },
      ],
    };
    const text = '```json\n' + JSON.stringify(modelWithWrongMeta) + '\n```';
    const sb = parseSummaryResponse(text, { date: '2026-06-29', language: 'en' });
    expect(sb.date).toBe('2026-06-29');
    expect(sb.language).toBe('en');
  });
});

describe('buildPrompt', () => {
  it('includes the language and the article titles in the user prompt', () => {
    const { system, user } = buildPrompt(
      [{ title: 'NAVI bench b1t', url: 'https://x.com/a', content: 'body', source: 'x.com' }],
      { language: 'zh', maxStories: 5, maxBulletsPerSection: 4, date: '2026-06-29' },
    );
    expect(system.length).toBeGreaterThan(0);
    expect(system).toContain('Roster Move');
    expect(user).toContain('NAVI bench b1t');
    expect(user).toContain('zh');
  });
});
