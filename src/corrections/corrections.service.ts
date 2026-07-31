import { Injectable } from '@nestjs/common';
import { SeoService } from '../seo/seo.service';
import { HistoryClientService } from '../history-client/history-client.service';
import { PropositionSchema } from '../common/schemas/proposition.schema';

// Fait correspondre chaque type de recommandation SEO à la catégorie
// attendue par PropositionSchema.champ (enum limité)
const CHAMP_MAPPING: Record<string, string> = {
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

@Injectable()
export class CorrectionsService {
  constructor(
    private seoService: SeoService,
    private historyClient: HistoryClientService,
  ) {}

  async propose(pageUrl: string, findings: any) {
    const auditSeo = this.seoService.auditOnPage(findings);

    const propositions = auditSeo.recommendations.map((recommendation) => {
      return PropositionSchema.parse({
        champ: CHAMP_MAPPING[recommendation.type] ?? 'reecriture',
        valeurAvant: findings.title ?? '',
        valeurApres: recommendation.suggestion,
        justification: recommendation.message,
      });
    });

    for (const proposition of propositions) {
      await this.historyClient.sendProposition(pageUrl, proposition);
    }

    return { pageUrl, score: auditSeo.score, propositions };
  }
}