import { SeoService } from './seo.service';
import {
  generateCrawlFixtures,
  generateTechnicalReportFixtures,
} from '../../test/fixtures/crawl-fixtures';

describe('SeoService (fixtures à l\'échelle du site)', () => {
  const service = new SeoService();
  const PAGE_COUNT = 400;
  const pages = generateCrawlFixtures(PAGE_COUNT);
  const technicalReports = generateTechnicalReportFixtures(PAGE_COUNT);

  it('génère bien entre 300 et 500 pages de fixtures', () => {
    expect(pages.length).toBeGreaterThanOrEqual(300);
    expect(pages.length).toBeLessThanOrEqual(500);
  });

  it('auditOnPage produit une structure valide pour chaque page du site', () => {
    for (const page of pages) {
      const result = service.auditOnPage(page);

      expect(result.url).toBe(page.url);
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.recommendations)).toBe(true);

      for (const rec of result.recommendations) {
        expect(typeof rec.type).toBe('string');
        expect(['low', 'medium', 'high']).toContain(rec.severity);
        expect(typeof rec.message).toBe('string');
        expect(typeof rec.suggestion).toBe('string');
      }
    }
  });

  it('détecte une variété de problèmes représentative sur le site', () => {
    const allTypes = new Set<string>();
    for (const page of pages) {
      const result = service.auditOnPage(page);
      result.recommendations.forEach((r) => allTypes.add(r.type));
    }

    expect(allTypes.has('title_missing')).toBe(true);
    expect(allTypes.has('title_too_long')).toBe(true);
    expect(allTypes.has('title_too_short')).toBe(true);
    expect(allTypes.has('meta_description_missing')).toBe(true);
    expect(allTypes.has('h1_missing')).toBe(true);
    expect(allTypes.has('h1_multiple')).toBe(true);
  });

  it('auditTechnique produit une structure valide pour chaque rapport technique', () => {
    for (const report of technicalReports) {
      const result = service.auditTechnique(report);

      expect(result.url).toBe(report.url);
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.recommendations)).toBe(true);
    }
  });

  it('auditInternalLinking analyse le graphe complet et détecte les pages orphelines attendues', () => {
    const result = service.auditInternalLinking({ pages });

    expect(typeof result.score).toBe('number');
    expect(Array.isArray(result.recommendations)).toBe(true);

    const orphanPages = result.recommendations.filter((r) => r.type === 'orphan_page');
    // Une page sur 20 a été volontairement laissée orpheline dans le générateur
    const expectedOrphanCount = Math.ceil(PAGE_COUNT / 20);
    expect(orphanPages.length).toBeGreaterThanOrEqual(expectedOrphanCount - 1);

    const genericAnchors = result.recommendations.filter((r) => r.type === 'generic_anchor_text');
    expect(genericAnchors.length).toBeGreaterThan(0);
  });

  it('traite les 400 pages en un temps raisonnable (moins de 2 secondes)', () => {
    const start = Date.now();
    for (const page of pages) {
      service.auditOnPage(page);
    }
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });
});