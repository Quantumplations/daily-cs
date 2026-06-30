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
