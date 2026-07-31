import { z } from 'zod';

// Un problème détecté par le GEO Agent (comme Recommendation côté SEO)
export const GeoRecommendationSchema = z.object({
  type: z.enum([
    'faq_missing',
    'faq_unclear',
    'entity_missing',
    'structure_unclear',
    'style_not_conversational',
  ]),
  severity: z.enum(['low', 'medium', 'high']),
  suggestion: z.string(),
});
export type GeoRecommendation = z.infer<typeof GeoRecommendationSchema>;

// Une question/réponse suggérée pour la FAQ
export const FaqSuggestionSchema = z.object({
  question: z.string(),
  answer: z.string(),
});
export type FaqSuggestion = z.infer<typeof FaqSuggestionSchema>;

// Une entité nommée identifiée dans le contenu
export const EntityMentionSchema = z.object({
  name: z.string(),
  type: z.enum(['brand', 'place', 'person', 'concept', 'product', 'other']),
  context: z.string(),
});
export type EntityMention = z.infer<typeof EntityMentionSchema>;

// Résultat complet de optimizeForAiEngines()
export const GeoOptimizeResultSchema = z.object({
  score: z.number().min(0).max(100),
  structuredContent: z.string(),
  faqSuggestions: z.array(FaqSuggestionSchema),
  entities: z.array(EntityMentionSchema),
  recommendations: z.array(GeoRecommendationSchema),
});
export type GeoOptimizeResult = z.infer<typeof GeoOptimizeResultSchema>;

// Résultat de analyzeFaqQuality()
export const FaqQualityAnalysisSchema = z.object({
  existingFaqCount: z.number(),
  missingQuestions: z.array(z.string()),
  clarityIssues: z.array(z.string()),
  formatIssues: z.array(z.string()),
});
export type FaqQualityAnalysis = z.infer<typeof FaqQualityAnalysisSchema>;