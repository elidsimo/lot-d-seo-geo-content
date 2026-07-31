import { Injectable } from '@nestjs/common';
import { CrawlFindings } from '../common/schemas/crawl-findings.schema';
import { TechnicalReport } from '../common/schemas/technical-report.schema';
import { Recommendation, AuditResult } from '../common/types/recommendation.type';

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