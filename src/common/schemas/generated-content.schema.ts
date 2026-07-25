import { z } from 'zod';

export const GeneratedContentSchema = z.object({
  type: z.enum(['article', 'faq', 'pillar_page']),
  titre: z.string(),
  contenu: z.string(),
});

export type GeneratedContent = z.infer<typeof GeneratedContentSchema>;