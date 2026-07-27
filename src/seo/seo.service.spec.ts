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

  it('should detect a missing title', () => {
    const result = service.auditPage({
      url: 'https://example.com',
      title: '',
      metaDescription: 'Une description correcte de la page.',
      h1: ['Titre principal'],
    });

    expect(
      result.problemes.some((p) => p.includes('Title')),
    ).toBe(true);
  });

  it('should detect a title too long', () => {
    const result = service.auditPage({
      url: 'https://example.com',
      title: 'A'.repeat(70),
      metaDescription: 'Une description correcte de la page.',
      h1: ['Titre principal'],
    });

    expect(
      result.problemes.some((p) => p.includes('Title')),
    ).toBe(true);
  });

  it('should detect a missing meta description', () => {
    const result = service.auditPage({
      url: 'https://example.com',
      title: 'Un titre correct',
      metaDescription: '',
      h1: ['Titre principal'],
    });

    expect(
      result.problemes.some((p) => p.includes('Meta description')),
    ).toBe(true);
  });

  it('should detect a missing H1 (empty array)', () => {
    const result = service.auditPage({
      url: 'https://example.com',
      title: 'Un titre correct',
      metaDescription: 'Une description correcte de la page.',
      h1: [],
    });

    expect(
      result.problemes.some((p) => p.includes('H1')),
    ).toBe(true);
  });

  it('should detect multiple H1 tags', () => {
    const result = service.auditPage({
      url: 'https://example.com',
      title: 'Un titre correct',
      metaDescription: 'Une description correcte de la page.',
      h1: ['Premier H1', 'Deuxième H1'],
    });

    expect(
      result.problemes.some((p) => p.includes('H1')),
    ).toBe(true);
  });

  it('should return no issues for a well-optimized page', () => {
    const result = service.auditPage({
      url: 'https://example.com',
      title: 'Un titre bien optimisé pour le SEO',
      metaDescription:
        'Une meta description bien rédigée et suffisamment longue pour être utile.',
      h1: ['Titre principal unique'],
    });

    expect(result.problemes.length).toBe(0);
    expect(result.url).toBe('https://example.com');
  });
});