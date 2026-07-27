import { Injectable } from '@nestjs/common';
import { SeoService } from '../seo/seo.service';
import { HistoryClientService } from '../history-client/history-client.service';
import { PropositionSchema } from '../common/schemas/proposition.schema';

@Injectable()
export class CorrectionsService {
  constructor(
    private seoService: SeoService,
    private historyClient: HistoryClientService,
  ) {}

  async propose(pageUrl: string, findings: any) {
    const auditSeo = this.seoService.auditPage(findings);

    const propositions = auditSeo.problemes.map((probleme: string) => {
      return PropositionSchema.parse({
        champ: 'meta_title', // simplifié pour l'instant, à affiner plus tard selon le problème détecté
        valeurAvant: findings.title,
        valeurApres: 'Nouveau titre proposé', // à générer via le LLM dans une future amélioration
        justification: probleme,
      });
    });

    for (const proposition of propositions) {
      await this.historyClient.sendProposition(pageUrl, proposition);
    }

    return { pageUrl, propositions };
  }
}
