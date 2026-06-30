import type { Storyboard } from './schema';

export const FPS = 30;
export const INTRO_FRAMES = 90; // 3s
export const OUTRO_FRAMES = 60; // 2s
export const SECTION_BASE_FRAMES = 90; // 3s base
export const PER_BULLET_FRAMES = 36; // 1.2s per bullet

export function sectionDurationFrames(bulletCount: number): number {
  return SECTION_BASE_FRAMES + PER_BULLET_FRAMES * bulletCount;
}

export function totalDurationFrames(sb: Storyboard): number {
  const sections = sb.sections.reduce(
    (sum, s) => sum + sectionDurationFrames(s.bullets.length),
    0,
  );
  return INTRO_FRAMES + sections + OUTRO_FRAMES;
}
