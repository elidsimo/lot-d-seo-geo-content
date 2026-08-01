import { Injectable } from '@nestjs/common';
import { CrawlFindings } from '../common/schemas/crawl-findings.schema';
import { TechnicalReport } from '../common/schemas/technical-report.schema';
import { Recommendation, AuditResult } from '../common/types/recommendation.type';
import { InternalLink } from '../common/schemas/crawl-findings.schema';
import { SiteCrawl } from '../common/schemas/internal-linking.schema';
import { InternalLinkingRecommendation, InternalLinkingAuditResult } from '../common/types/internal-linking-recommendation.type';

const GENERIC_ANCHOR_PHRASES = [
  'cliquez ici',
  'ici',
  'en savoir plus',
  'lire la suite',
  'voir plus',
  "plus d'infos",
  "plus d'informations",
  'ce lien',
  'cette page',
];
@Injectable()
export class SeoService {
  auditOnPage(findings: CrawlFindings): AuditResult {
    const recommendations: Recommendation[] = [
      ...this.analyzeTitleTag(findings.title),
      ...this.analyzeMetaDescription(findings.metaDescription),
      ...this.analyzeHeadingStructure(findings.h1),
    ];

    return {
      url: findings.url,
      score: this.computeScore(recommendations),
      recommendations,
    };
  }

  auditTechnique(report: TechnicalReport): AuditResult {
    const recommendations: Recommendation[] = [
      ...this.analyzeCoreWebVitals(report.coreWebVitals),
      ...this.analyzeErreursTechniques(report.erreursTechniques),
    ];

    return {
      url: report.url,
      score: this.computeScore(recommendations),
      recommendations,
    };
  }

  auditInternalLinking(siteCrawl: SiteCrawl): InternalLinkingAuditResult {
    const pages = siteCrawl.pages;
    const knownUrls = new Set(pages.map((p) => p.url));
    const recommendations: InternalLinkingRecommendation[] = [];

    // parser la cartographie (graphe de liens) 
    const incomingCount = new Map<string, number>();
    const anchorsByTarget = new Map<string, string[]>();
    pages.forEach((p) => incomingCount.set(p.url, 0));

    for (const page of pages) {
      for (const link of page.internalLinks) {
        // --- Sous-tâche 2 : analyse de chaque ancre textuelle ---
        recommendations.push(...this.analyzeAnchorText(page.url, link, pages));

        if (knownUrls.has(link.url)) {
          incomingCount.set(link.url, (incomingCount.get(link.url) ?? 0) + 1);
          const list = anchorsByTarget.get(link.url) ?? [];
          list.push(link.anchorText.trim().toLowerCase());
          anchorsByTarget.set(link.url, list);
        }
      }
    }

    // diversite des ancres vers une même cible 
    for (const [targetUrl, anchors] of anchorsByTarget.entries()) {
      const uniqueAnchors = new Set(anchors);
      if (anchors.length >= 2 && uniqueAnchors.size === 1) {
        recommendations.push({
          type: 'anchor_low_diversity',
          severity: 'medium',
          message: `Toutes les ${anchors.length} ancres pointant vers cette page utilisent exactement le même texte ("${anchors[0]}").`,
          suggestion:
            "Varier les textes d'ancrage entre les différentes pages sources pour un maillage plus naturel.",
          page: targetUrl,
        });
      }
    }

    // opportunites/anomalies pages orphelines
    for (const page of pages) {
      if ((incomingCount.get(page.url) ?? 0) === 0) {
        recommendations.push({
          type: 'orphan_page',
          severity: 'high',
          message: 'Cette page ne reçoit aucun lien interne depuis les autres pages du site.',
          suggestion:
            'Ajouter au moins un lien interne pertinent pointant vers cette page depuis une page connexe.',
          page: page.url,
        });
      }
    }

    return {
      score: this.computeScore(recommendations),
      recommendations,
    };
  }

  private analyzeAnchorText(
    sourceUrl: string,
    link: InternalLink,
    pages: CrawlFindings[],
  ): InternalLinkingRecommendation[] {
    const recommendations: InternalLinkingRecommendation[] = [];
    const anchor = link.anchorText.trim();

    if (anchor.length === 0) {
      recommendations.push({
        type: 'empty_anchor',
        severity: 'high',
        message: `Lien vers ${link.url} sans texte d'ancrage.`,
        suggestion: "Ajouter un texte d'ancrage descriptif plutôt qu'un lien vide.",
        page: sourceUrl,
      });
      return recommendations;
    }

    if (GENERIC_ANCHOR_PHRASES.includes(anchor.toLowerCase())) {
      recommendations.push({
        type: 'generic_anchor_text',
        severity: 'medium',
        message: `Texte d'ancrage générique ("${anchor}") vers ${link.url}.`,
        suggestion:
          'Remplacer par un texte descriptif reprenant le sujet de la page cible (ex: le titre de la page ciblée).',
        page: sourceUrl,
      });
    }

    const targetPage = pages.find((p) => p.url === link.url);
    if (targetPage?.title) {
      const anchorWords = this.significantWords(anchor);
      const titleWords = this.significantWords(targetPage.title);
      const overlap = anchorWords.filter((w) => titleWords.includes(w));

      if (anchorWords.length > 0 && overlap.length === 0) {
        recommendations.push({
          type: 'anchor_not_relevant',
          severity: 'low',
          message: `Le texte d'ancrage ("${anchor}") ne partage aucun mot-clé avec le titre de la page cible ("${targetPage.title}").`,
          suggestion: "Rapprocher le texte d'ancrage du sujet réel de la page cible.",
          page: sourceUrl,
        });
      }
    }

    return recommendations;
  }

  private significantWords(text: string): string[] {
    const stopWords = new Set([
      'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'a',
      'au', 'aux', 'pour', 'sur', 'dans', 'par', 'ce', 'cette', 'ces',
    ]);
    return text
      .toLowerCase()
      .split(/[^a-zàâäéèêëïîôöùûüç0-9]+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
  }


  private analyzeTitleTag(title: string | null): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (!title || title.trim().length === 0) {
      recommendations.push({
        type: 'title_missing',
        severity: 'high',
        message: 'Le title est manquant.',
        suggestion: 'Ajouter un title unique décrivant le contenu de la page (30-60 caractères).',
      });
      return recommendations;
    }

    if (title.length < 30) {
      recommendations.push({
        type: 'title_too_short',
        severity: 'medium',
        message: `Le title est trop court (${title.length} caractères).`,
        suggestion: 'Allonger le title à 30-60 caractères pour maximiser sa visibilité en SERP.',
      });
    }

    if (title.length > 60) {
      recommendations.push({
        type: 'title_too_long',
        severity: 'medium',
        message: `Le title est trop long (${title.length} caractères, risque de troncature).`,
        suggestion: 'Réduire le title à 60 caractères maximum.',
      });
    }

    if (/[<>{}[\]\\]/.test(title)) {
      recommendations.push({
        type: 'title_special_characters',
        severity: 'low',
        message: 'Le title contient des caractères spéciaux non recommandés.',
        suggestion: 'Retirer les caractères de code (<, >, {, }, [, ]) du title.',
      });
    }

    return recommendations;
  }

  private analyzeMetaDescription(metaDescription: string | null): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (!metaDescription || metaDescription.trim().length === 0) {
      recommendations.push({
        type: 'meta_description_missing',
        severity: 'high',
        message: 'La meta description est manquante.',
        suggestion:
          'Ajouter une meta description unique et engageante (120-160 caractères).',
      });
      return recommendations;
    }

    if (metaDescription.length < 120) {
      recommendations.push({
        type: 'meta_description_too_short',
        severity: 'low',
        message: `La meta description est courte (${metaDescription.length} caractères).`,
        suggestion: 'Enrichir la meta description jusqu\'à 120-160 caractères.',
      });
    }

    if (metaDescription.length > 160) {
      recommendations.push({
        type: 'meta_description_too_long',
        severity: 'medium',
        message: `La meta description est trop longue (${metaDescription.length} caractères, risque de troncature).`,
        suggestion: 'Réduire la meta description à 160 caractères maximum.',
      });
    }

    return recommendations;
  }

  private analyzeHeadingStructure(h1: string[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (!h1 || h1.length === 0) {
      recommendations.push({
        type: 'h1_missing',
        severity: 'high',
        message: 'Aucun H1 détecté sur la page.',
        suggestion: 'Ajouter un H1 unique reprenant le sujet principal de la page.',
      });
    } else if (h1.length > 1) {
      recommendations.push({
        type: 'h1_multiple',
        severity: 'medium',
        message: `${h1.length} balises H1 détectées, une seule est recommandée.`,
        suggestion: 'Conserver un seul H1 par page et utiliser des H2/H3 pour la structure secondaire.',
      });
    }

    return recommendations;
  }

  private analyzeCoreWebVitals(
    coreWebVitals: TechnicalReport['coreWebVitals'],
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { lcp, cls, inp } = coreWebVitals;

    // Seuils officiels Google (LCP et INP en millisecondes, CLS sans unité)
    if (lcp > 4000) {
      recommendations.push({
        type: 'lcp_poor',
        severity: 'high',
        message: `LCP élevé (${lcp}ms) — expérience jugée mauvaise par Google.`,
        suggestion: 'Optimiser le chargement du plus grand élément visible (images, polices, temps de réponse serveur).',
      });
    } else if (lcp > 2500) {
      recommendations.push({
        type: 'lcp_needs_improvement',
        severity: 'medium',
        message: `LCP à améliorer (${lcp}ms).`,
        suggestion: 'Réduire le LCP sous 2500ms pour une bonne expérience utilisateur.',
      });
    }

    if (cls > 0.25) {
      recommendations.push({
        type: 'cls_poor',
        severity: 'high',
        message: `CLS élevé (${cls}) — mise en page instable.`,
        suggestion: "Réserver l'espace des images/publicités pour éviter les décalages visuels.",
      });
    } else if (cls > 0.1) {
      recommendations.push({
        type: 'cls_needs_improvement',
        severity: 'medium',
        message: `CLS à améliorer (${cls}).`,
        suggestion: 'Réduire le CLS sous 0.1.',
      });
    }

    if (inp > 500) {
      recommendations.push({
        type: 'inp_poor',
        severity: 'high',
        message: `INP élevé (${inp}ms) — interactions lentes.`,
        suggestion: 'Réduire le temps de réponse aux interactions (alléger le JavaScript, éviter les tâches longues).',
      });
    } else if (inp > 200) {
      recommendations.push({
        type: 'inp_needs_improvement',
        severity: 'medium',
        message: `INP à améliorer (${inp}ms).`,
        suggestion: "Réduire l'INP sous 200ms.",
      });
    }

    return recommendations;
  }

  private analyzeErreursTechniques(erreurs: string[]): Recommendation[] {
    return erreurs.map((erreur) => ({
      type: 'technical_error',
      severity: 'high',
      message: erreur,
      suggestion: 'Corriger cette erreur technique remontée par le Crawl Agent.',
    }));
  }

  private computeScore(recommendations: Recommendation[]): number {
    const penalties = { high: 30, medium: 15, low: 5 };
    const totalPenalty = recommendations.reduce(
      (sum, rec) => sum + penalties[rec.severity],
      0,
    );
    return Math.max(0, 100 - totalPenalty);
  }
}