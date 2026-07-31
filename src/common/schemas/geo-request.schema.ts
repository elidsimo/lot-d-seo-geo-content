import { z } from 'zod';

export const GeoOptimizeRequestSchema = z.object({
  content: z
    .string()
    .min(20, 'Le contenu doit contenir au moins 20 caractères'),
  existingFaq: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .optional()
    .default([]),
});
export type GeoOptimizeRequest = z.infer<typeof GeoOptimizeRequestSchema>;