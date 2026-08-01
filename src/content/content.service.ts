import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { BrandParametersClientService } from '../brand-parameters-client/brand-parameters-client.service';
import {
  GeneratedContentSchema,
  GeneratedContent,
} from '../common/schemas/generated-content.schema';
import { BrandParameters } from '../common/schemas/brand-parameters.schema';

@Injectable()
export class ContentService {
  constructor(
    private llm: LlmService,
    private brandParametersClient: BrandParametersClientService,
  ) {}

  //  exposée pour être appelée directement si besoin.

  async fetchBrandParameters(clientId: string): Promise<BrandParameters> {
    return this.brandParametersClient.fetchBrandParameters(clientId);
  }

  async generateArticle(sujet: string, clientId?: string): Promise<GeneratedContent> {
    const brand = await this.resolveBrand(clientId);
    const prompt = this.buildArticlePrompt(sujet, brand);
    const contenu = await this.llm.generate(prompt);
    return GeneratedContentSchema.parse({ type: 'article', titre: sujet, contenu });
  }

  async generateFaq(sujet: string, clientId?: string): Promise<GeneratedContent> {
    const brand = await this.resolveBrand(clientId);
    const prompt = this.buildFaqPrompt(sujet, brand);
    const contenu = await this.llm.generate(prompt);
    return GeneratedContentSchema.parse({ type: 'faq', titre: sujet, contenu });
  }

  async generatePillarPage(sujet: string, clientId?: string): Promise<GeneratedContent> {
    const brand = await this.resolveBrand(clientId);
    const prompt = this.buildPillarPagePrompt(sujet, brand);
    const contenu = await this.llm.generate(prompt);
    return GeneratedContentSchema.parse({ type: 'pillar_page', titre: sujet, contenu });
  }

  async generate(type: 'article' | 'faq' | 'pillar_page', sujet: string, ton: string) {
    const prompt = `Génère un contenu de type "${type}" sur le sujet "${sujet}", avec un ton "${ton}".`;
    const contenu = await this.llm.generate(prompt);
    return { type, titre: sujet, contenu };
  }

  //templates de prompt engineering

  private async resolveBrand(clientId?: string): Promise<BrandParameters> {
    if (!clientId) {
      return { ton: 'neutre', style: 'standard', contraintes: [] };
    }
    return this.fetchBrandParameters(clientId);
  }

  private buildArticlePrompt(sujet: string, brand: BrandParameters): string {
    return `Tu es un rédacteur SEO expert. Rédige un article de blog complet sur le sujet suivant : "${sujet}".

Contraintes de style :
- Ton : ${brand.ton}
- Style d'écriture : ${brand.style}
${brand.contraintes.length > 0 ? `- Règles à respecter : ${brand.contraintes.join('; ')}` : ''}

Structure attendue :
- Une introduction qui accroche le lecteur
- Plusieurs sections avec des sous-titres clairs (H2)
- Une conclusion qui résume les points clés
- Un vocabulaire adapté au sujet, sans jargon inutile`;
  }

  private buildFaqPrompt(sujet: string, brand: BrandParameters): string {
    return `Tu es un rédacteur SEO expert. Génère une FAQ (au moins 5 questions/réponses) sur le sujet suivant : "${sujet}".

Contraintes de style :
- Ton : ${brand.ton}
- Style d'écriture : ${brand.style}
${brand.contraintes.length > 0 ? `- Règles à respecter : ${brand.contraintes.join('; ')}` : ''}

Format attendu :
- Chaque question doit être une vraie question que se poserait un utilisateur
- Chaque réponse doit être claire, directe et autonome (compréhensible sans le reste du contexte)
- Format : "Q: ...\\nR: ..." pour chaque paire`;
  }

  private buildPillarPagePrompt(sujet: string, brand: BrandParameters): string {
    return `Tu es un rédacteur SEO expert. Rédige une page pilier (page de référence complète) sur le sujet suivant : "${sujet}".

Contraintes de style :
- Ton : ${brand.ton}
- Style d'écriture : ${brand.style}
${brand.contraintes.length > 0 ? `- Règles à respecter : ${brand.contraintes.join('; ')}` : ''}

Structure attendue :
- Une vue d'ensemble complète du sujet, destinée à servir de hub central
- Plusieurs sous-thèmes clairement identifiés (H2), chacun pouvant devenir un article séparé plus tard
- Des suggestions de liens internes vers ces sous-thèmes (indique juste le texte d'ancrage suggéré entre crochets, ex: [Voir aussi : ...])
- Un contenu long et exhaustif, plus détaillé qu'un article de blog classique`;
  }
}