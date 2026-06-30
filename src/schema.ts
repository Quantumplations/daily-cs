import { z } from 'zod';

export const SourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

export const SectionSchema = z.object({
  category: z.string().min(1),
  headline: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1).max(5),
  source: SourceSchema,
  imageUrl: z.string().url().optional(),
});

export const StoryboardSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  language: z.enum(['en', 'zh']),
  title: z.string().min(1),
  sections: z.array(SectionSchema).min(1).max(8),
});

export type Source = z.infer<typeof SourceSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Storyboard = z.infer<typeof StoryboardSchema>;

export function parseStoryboard(data: unknown): Storyboard {
  return StoryboardSchema.parse(data);
}
