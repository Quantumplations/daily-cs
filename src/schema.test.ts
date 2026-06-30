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
