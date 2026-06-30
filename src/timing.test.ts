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
