import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { LlmService } from '../llm/llm.service';
import {
  GeoOptimizeResultSchema,
  GeoOptimizeResult,
  FaqQualityAnalysisSchema,
  FaqQualityAnalysis,
  EntityMentionSchema,
  EntityMention,
} from '../common/schemas/geo-result.schema';

type FaqPair = { question: string; answer: string };

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  constructor(private llm: LlmService) {}

  async optimizeForAiEngines(
    content: string,
    existingFaq: FaqPair[] = [],
  ): Promise<GeoOptimizeResult> {
    const prompt = `Tu es un expert en optimisation de contenu pour les moteurs de réponse IA (ChatGPT, Gemini, Claude, Perplexity).

Analyse le contenu ci-dessous et réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans balises markdown, au format EXACT suivant :

{
  "score": <nombre entre 0 et 100 évaluant la "citabilité" IA du contenu>,
  "structuredContent": "<version reformulée en phrases claires et autonomes>",
  "faqSuggestions": [{ "question": "...", "answer": "..." }],
  "entities": [{ "name": "...", "type": "brand|place|person|concept|product|other", "context": "..." }],
  "recommendations": [{ "type": "faq_missing|faq_unclear|entity_missing|structure_unclear|style_not_conversational", "severity": "low|medium|high", "suggestion": "..." }]
}

Contenu à analyser :
${content}

FAQ existante (peut être vide) :
${JSON.stringify(existingFaq)}`;

    return this.generateAndValidate(prompt, GeoOptimizeResultSchema, 'optimizeForAiEngines');
  }

  async analyzeFaqQuality(
    content: string,
    existingFaq: FaqPair[] = [],
  ): Promise<FaqQualityAnalysis> {
    const prompt = `Tu es un expert GEO (Generative Engine Optimization). Analyse la FAQ ci-dessous par rapport au contenu de la page, et réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, au format EXACT suivant :

{
  "existingFaqCount": <nombre de questions dans la FAQ existante>,
  "missingQuestions": ["question pertinente absente de la FAQ", ...],
  "clarityIssues": ["explication d'une réponse trop vague ou ambiguë", ...],
  "formatIssues": ["explication d'un problème de format (trop long, pas de réponse directe, etc.)", ...]
}

Contenu de la page :
${content}

FAQ existante :
${JSON.stringify(existingFaq)}`;

    return this.generateAndValidate(prompt, FaqQualityAnalysisSchema, 'analyzeFaqQuality');
  }

  async enrichEntities(content: string): Promise<EntityMention[]> {
    const prompt = `Identifie toutes les entités nommées importantes (marques, lieux, personnes, concepts, produits) dans ce contenu, utiles pour qu'une IA générative comprenne bien le contexte. Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après, au format EXACT suivant :

[{ "name": "...", "type": "brand|place|person|concept|product|other", "context": "phrase courte expliquant le rôle de cette entité dans le texte" }]

Contenu :
${content}`;

    return this.generateAndValidate(prompt, z.array(EntityMentionSchema), 'enrichEntities');
  }

  async optimizePage(pageContent: string): Promise<{ optimizedContent: string }> {
    const result = await this.optimizeForAiEngines(pageContent);
    return { optimizedContent: result.structuredContent };
  }

  private async generateAndValidate<T>(
    prompt: string,
    schema: z.ZodType<T>,
    methodName: string,
    attempt = 1,
  ): Promise<T> {
    const raw = await this.llm.generate(prompt);
    const cleaned = raw
      .trim()
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch {
      if (attempt < 2) {
        this.logger.warn(`[${methodName}] JSON invalide, nouvelle tentative (${attempt}/2)...`);
        return this.generateAndValidate(prompt, schema, methodName, attempt + 1);
      }
      this.logger.error(`[${methodName}] Réponse LLM non-JSON après ${attempt} tentatives: ${raw}`);
      throw new Error(`La réponse du LLM pour ${methodName} n'est pas un JSON valide`);
    }

    const result = schema.safeParse(parsedJson);
    if (!result.success) {
      if (attempt < 2) {
        this.logger.warn(`[${methodName}] JSON ne respecte pas le schéma, nouvelle tentative (${attempt}/2)...`);
        return this.generateAndValidate(prompt, schema, methodName, attempt + 1);
      }
      this.logger.error(
        `[${methodName}] JSON invalide selon le schéma après ${attempt} tentatives: ${JSON.stringify(result.error.issues)}`,
      );
      throw new Error(`La réponse du LLM pour ${methodName} ne respecte pas le format attendu`);
    }
    return result.data;
  }
}