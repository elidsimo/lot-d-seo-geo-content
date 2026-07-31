import { Injectable, Logger } from '@nestjs/common';
import { SeoService } from '../seo/seo.service';
import { GeoService } from '../geo/geo.service';
import { HistoryClientService } from '../history-client/history-client.service';
import { PropositionSchema, Proposition } from '../common/schemas/proposition.schema';
import { CrawlFindings } from '../common/schemas/crawl-findings.schema';

// Fait correspondre chaque type de recommandation SEO à la catégorie
// attendue par PropositionSchema.champ (enum limité)
const SEO_CHAMP_MAPPING: Record<string, Proposition['champ']> = {
  title_missing: 'meta_title',
  title_too_short: 'meta_title',
  title_too_long: 'meta_title',
  title_special_characters: 'meta_title',
  meta_description_missing: 'meta_description',
  meta_description_too_short: 'meta_description',
  meta_description_too_long: 'meta_description',
  h1_missing: 'h1',
  h1_multiple: 'h1',
};
// Fait correspondre chaque type de recommandation GEO à la catégorie
// attendue par PropositionSchema.champ
const GEO_CHAMP_MAPPING: Record<string, Proposition['champ']> = {
  faq_missing: 'faq',
  faq_unclear: 'faq',
  entity_missing: 'schema_org',
  structure_unclear: 'reecriture',
  style_not_conversational: 'reecriture',
};

// Ordre de tri pour prioriser les propositions les plus importantes en premier
const PRIORITY_ORDER: Record<'low' | 'medium' | 'high', number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export interface SendResult {
  proposition: Proposition;
  status: 'sent' | 'failed';
  error?: string;
}

@Injectable()
export class CorrectionsService {
  private readonly logger = new Logger(CorrectionsService.name);

  constructor(
    private seoService: SeoService,
    private geoService: GeoService,
    private historyClient: HistoryClientService,
  ) {}
  private buildProposition(
    champ: Proposition['champ'],
    valeurAvant: string | null,
    valeurApres: string,
    justification: string,
    priorite: 'low' | 'medium' | 'high',
  ): Proposition {
    return PropositionSchema.parse({
      champ,
      valeurAvant,
      valeurApres,
      justification,
      priorite,
    });
  }

  async generateCorrectionsForPage(
    pageUrl: string,
    findings: CrawlFindings,
    pageContent?: string,
  ): Promise<{
    pageUrl: string;
    seoScore: number;
    geoScore?: number;
    propositions: Proposition[];
  }> {
    // analyse SEO ,toujours effectuée
    const auditSeo = this.seoService.auditOnPage(findings);

    const seoPropositions = auditSeo.recommendations.map((recommendation) =>
      this.buildProposition(
        SEO_CHAMP_MAPPING[recommendation.type] ?? 'reecriture',
        findings.title ?? '',
        recommendation.suggestion,
        recommendation.message,
        recommendation.severity,
      ),
    );

    // analyse GEO ,seulement si pageContent est fourni
    let geoPropositions: Proposition[] = [];
    let geoScore: number | undefined;

    if (pageContent) {
      const geoResult = await this.geoService.optimizeForAiEngines(pageContent);
      geoScore = geoResult.score;

      const geoIssuePropositions = geoResult.recommendations.map((recommendation) =>
        this.buildProposition(
          GEO_CHAMP_MAPPING[recommendation.type] ?? 'reecriture',
          pageContent,
          recommendation.suggestion,
          recommendation.suggestion,
          recommendation.severity,
        ),
      );

      // Chaque FAQ suggeree par le GEO Agent devient elle-meme une proposition
      const faqPropositions = geoResult.faqSuggestions.map((faq) =>
        this.buildProposition(
          'faq',
          null,
          `Q: ${faq.question}\nR: ${faq.answer}`,
          'FAQ suggérée pour améliorer la citabilité par les moteurs de réponse IA.',
          'medium',
        ),
      );

      geoPropositions = [...geoIssuePropositions, ...faqPropositions];
    }

    // fusion + priorisation ,trie les plus urgentes en premier 
    const propositions = [...seoPropositions, ...geoPropositions].sort(
      (a, b) => PRIORITY_ORDER[b.priorite] - PRIORITY_ORDER[a.priorite],
    );

    return { pageUrl, seoScore: auditSeo.score, geoScore, propositions };
  }

  async postProposalsToHistory(
    pageUrl: string,
    propositions: Proposition[],
  ): Promise<SendResult[]> {
    const results: SendResult[] = [];

    for (const proposition of propositions) {
      try {
        await this.historyClient.sendProposition(pageUrl, proposition);
        results.push({ proposition, status: 'sent' });
      } catch (error) {
        this.logger.error(
          `Échec de l'envoi d'une proposition pour ${pageUrl} : ${error.message}`,
        );
        results.push({ proposition, status: 'failed', error: error.message });
      }
    }

    return results;
  }
  async propose(pageUrl: string, findings: CrawlFindings, pageContent?: string) {
    const { propositions, seoScore, geoScore } = await this.generateCorrectionsForPage(
      pageUrl,
      findings,
      pageContent,
    );

    const sendResults = await this.postProposalsToHistory(pageUrl, propositions);

    return { pageUrl, seoScore, geoScore, propositions, sendResults };
  }
}