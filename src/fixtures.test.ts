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
