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
