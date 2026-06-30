import path from 'node:path';

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, 'data');
export const OUT_DIR = path.join(ROOT, 'out');
export const FIXTURE_STORYBOARD = path.join(ROOT, 'fixtures', 'storyboard.sample.json');
export const FIXTURE_RAW = path.join(ROOT, 'fixtures', 'raw.sample.json');

export function rawPath(date: string): string {
  return path.join(DATA_DIR, `raw-${date}.json`);
}

export function storyboardPath(date: string): string {
  return path.join(DATA_DIR, `storyboard-${date}.json`);
}

export function outPath(date: string): string {
  return path.join(OUT_DIR, `daily-cs-${date}.mp4`);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
