import { describe, it, expect } from 'vitest';
import { parseArgs } from './args';

describe('parseArgs', () => {
  it('defaults command to "all" when argv is empty', () => {
    const result = parseArgs([], 'en');
    expect(result.command).toBe('all');
  });

  it('sets date from --date flag', () => {
    const result = parseArgs(['render', '--date', '2026-01-02'], 'en');
    expect(result.date).toBe('2026-01-02');
  });

  it('sets language from --lang zh', () => {
    const result = parseArgs(['all', '--lang', 'zh'], 'en');
    expect(result.language).toBe('zh');
  });

  it('throws on invalid --lang value', () => {
    expect(() => parseArgs(['all', '--lang', 'fr'], 'en')).toThrow(/--lang must be en or zh/);
  });

  it('throws when --lang has no following value', () => {
    expect(() => parseArgs(['all', '--lang'], 'en')).toThrow('--lang requires a value (en|zh)');
  });

  it('throws when --date has no following value', () => {
    expect(() => parseArgs(['all', '--date'], 'en')).toThrow('--date requires a value');
  });

  it('uses defaultLanguage when --lang is not provided', () => {
    const result = parseArgs(['render'], 'zh');
    expect(result.language).toBe('zh');
  });
});
