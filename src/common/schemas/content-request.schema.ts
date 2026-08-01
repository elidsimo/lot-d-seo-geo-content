import { z } from 'zod';

export const ContentGenerationRequestSchema = z.object({
  sujet: z.string().min(3, 'Le sujet doit contenir au moins 3 caractères'),
  clientId: z.string().optional(),
});

export type ContentGenerationRequest = z.infer<typeof ContentGenerationRequestSchema>;