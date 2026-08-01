import { Test, TestingModule } from '@nestjs/testing';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeoService],
    }).compile();

    service = module.get<SeoService>(SeoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should detect a missing title with high severity', () => {
    const result = service.auditOnPage({
      url: 'https://example.com',
      title: '',
      metaDescription: 'Une description correcte et suffisamment longue pour être utile ici.',
      h1: ['Titre principal'],
    });

    const titleIssue = result.recommendations.find((r) => r.type === 'title_missing');
    expect(titleIssue).toBeDefined();
    expect(titleIssue?.severity).toBe('high');
  });

  it('should detect a title too long', () => {
    const result = service.auditOnPage({
      url: 'https://example.com',
      title: 'A'.repeat(70),
      metaDescription: 'Une description correcte et suffisamment longue pour être utile ici.',
      h1: ['Titre principal'],
    });

    expect(
      result.recommendations.some((r) => r.type === 'title_too_long'),
    ).toBe(true);
  });

  it('should detect multiple H1 tags', () => {
    const result = service.auditOnPage({
      url: 'https://example.com',
      title: 'Un titre correct et bien dimensionné pour le SEO moderne',
      metaDescription: 'Une description correcte et suffisamment longue pour être utile ici.',
      h1: ['Premier H1', 'Deuxième H1'],
    });

    expect(result.recommendations.some((r) => r.type === 'h1_multiple')).toBe(true);
  });

  it('should return a perfect score for a well-optimized page', () => {
    const result = service.auditOnPage({
      url: 'https://example.com',
      title: 'Un titre bien optimisé et dimensionné pour le SEO moderne',
      metaDescription:
        'Une meta description bien rédigée, suffisamment longue et complète pour être vraiment utile aux internautes qui la lisent sur les moteurs de recherche.',
      h1: ['Titre principal unique'],
    });

    expect(result.recommendations.length).toBe(0);
    expect(result.score).toBe(100);
  });

  it('should reduce the score proportionally to the number and severity of issues', () => {
    const result = service.auditOnPage({
      url: 'https://example.com',
      title: '',
      metaDescription: '',
      h1: [],
    });

    expect(result.score).toBeLessThan(100);
    expect(result.recommendations.length).toBe(3);
  });
  describe('auditInternalLinking', () => {
    it('should detect an orphan page (no incoming internal links)', () => {
      const result = service.auditInternalLinking({
        pages: [
          {
            url: 'https://example.com/a',
            title: 'Page A',
            metaDescription: 'ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok',
            h1: ['A'],
            h2: [],
            internalLinks: [],
          },
          {
            url: 'https://example.com/b',
            title: 'Page B',
            metaDescription: 'ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok',
            h1: ['B'],
            h2: [],
            internalLinks: [],
          },
        ],
      });

      expect(
        result.recommendations.some(
          (r) => r.type === 'orphan_page' && r.page === 'https://example.com/a',
        ),
      ).toBe(true);
      expect(
        result.recommendations.some(
          (r) => r.type === 'orphan_page' && r.page === 'https://example.com/b',
        ),
      ).toBe(true);
    });

    it('should detect a generic anchor text', () => {
      const result = service.auditInternalLinking({
        pages: [
          {
            url: 'https://example.com/a',
            title: 'Page A',
            metaDescription: 'ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok',
            h1: ['A'],
            h2: [],
            internalLinks: [{ url: 'https://example.com/b', anchorText: 'cliquez ici' }],
          },
          {
            url: 'https://example.com/b',
            title: 'Page B',
            metaDescription: 'ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok',
            h1: ['B'],
            h2: [],
            internalLinks: [],
          },
        ],
      });

      expect(result.recommendations.some((r) => r.type === 'generic_anchor_text')).toBe(true);
    });

    it('should detect low anchor diversity toward the same target', () => {
      const result = service.auditInternalLinking({
        pages: [
          {
            url: 'https://example.com/a',
            title: 'Page A',
            metaDescription: 'ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok',
            h1: ['A'],
            h2: [],
            internalLinks: [{ url: 'https://example.com/c', anchorText: 'guide SEO' }],
          },
          {
            url: 'https://example.com/b',
            title: 'Page B',
            metaDescription: 'ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok',
            h1: ['B'],
            h2: [],
            internalLinks: [{ url: 'https://example.com/c', anchorText: 'guide SEO' }],
          },
          {
            url: 'https://example.com/c',
            title: 'Guide SEO complet',
            metaDescription: 'ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok',
            h1: ['Guide SEO complet'],
            h2: [],
            internalLinks: [],
          },
        ],
      });

      expect(
        result.recommendations.some(
          (r) => r.type === 'anchor_low_diversity' && r.page === 'https://example.com/c',
        ),
      ).toBe(true);
    });

    it('should not flag an orphan page when links exist between all pages', () => {
      const result = service.auditInternalLinking({
        pages: [
          {
            url: 'https://example.com/a',
            title: 'Page A',
            metaDescription: 'ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok',
            h1: ['A'],
            h2: [],
            internalLinks: [{ url: 'https://example.com/b', anchorText: 'découvrir la page B' }],
          },
          {
            url: 'https://example.com/b',
            title: 'Page B détaillée',
            metaDescription: 'ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok',
            h1: ['B'],
            h2: [],
            internalLinks: [{ url: 'https://example.com/a', anchorText: 'retour vers page A' }],
          },
        ],
      });

      expect(result.recommendations.some((r) => r.type === 'orphan_page')).toBe(false);
    });
  });



});