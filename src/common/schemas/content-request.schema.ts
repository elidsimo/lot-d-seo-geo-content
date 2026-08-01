import { z } from 'zod';

// Validation des nouvelles routes /content/article, /content/faq, /content/pillar-page
export const ContentGenerationRequestSchema = z.object({
  sujet: z.string().min(3, 'Le sujet doit contenir au moins 3 caractères'),
  clientId: z.string().optional(),
});

export type ContentGenerationRequest = z.infer<typeof ContentGenerationRequestSchema>;

// Validation de la route legacy POST /content/generate 
export const ContentGenerateLegacyRequestSchema = z.object({
  type: z.enum(['article', 'faq', 'pillar_page']),
  sujet: z.string().min(3, 'Le sujet doit contenir au moins 3 caractères'),
  ton: z.string().min(1, 'Le ton est requis'),
});

export type ContentGenerateLegacyRequest = z.infer<typeof ContentGenerateLegacyRequestSchema>;