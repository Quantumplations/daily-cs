import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const ConfigSchema = z.object({
  language: z.enum(['en', 'zh']),
  model: z.string().min(1),
  fetch: z.object({ query: z.string().min(1), limit: z.number().int().positive() }),
  summary: z.object({
    maxStories: z.number().int().positive(),
    maxBulletsPerSection: z.number().int().positive(),
  }),
  video: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fps: z.number().int().positive(),
  }),
  music: z.string().nullable(),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(file = path.join(process.cwd(), 'config.json')): AppConfig {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  return ConfigSchema.parse(raw);
}
