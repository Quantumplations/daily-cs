import { describe, it, expect } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('loads config.json with expected defaults', () => {
    const cfg = loadConfig();
    expect(['en', 'zh']).toContain(cfg.language);
    expect(cfg.model.length).toBeGreaterThan(0);
    expect(cfg.fetch.limit).toBeGreaterThan(0);
    expect(cfg.video.fps).toBe(30);
  });
});
