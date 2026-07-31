import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CorrectionsModule } from '../src/corrections/corrections.module';
import { HistoryClientService } from '../src/history-client/history-client.service';
import { GeoService } from '../src/geo/geo.service';
import { LlmService } from '../src/llm/llm.service';

describe('CorrectionsController (e2e)', () => {
  let app: INestApplication;

  const mockHistoryClientService = {
    sendProposition: jest.fn().mockResolvedValue({ success: true }),
  };
  const mockLlmService = { generate: jest.fn(), embed: jest.fn() };

  const mockGeoService = {
    optimizeForAiEngines: jest.fn().mockResolvedValue({
      score: 65,
      structuredContent: 'Contenu reformulé.',
      faqSuggestions: [],
      entities: [],
      recommendations: [
        { type: 'structure_unclear', severity: 'medium', suggestion: 'Clarifier la structure.' },
      ],
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CorrectionsModule],
    })
      .overrideProvider(HistoryClientService)
      .useValue(mockHistoryClientService)
      .overrideProvider(GeoService)
      .useValue(mockGeoService)
      .overrideProvider(LlmService).useValue(mockLlmService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /corrections/propose/:pageUrl - SEO seul (sans pageContent)', () => {
    const pageUrl = encodeURIComponent('https://example.com');

    return request(app.getHttpServer())
      .post(`/corrections/propose/${pageUrl}`)
      .send({
        findings: {
          url: 'https://example.com',
          title: '',
          metaDescription: 'ok',
          h1: ['ok'],
          h2: [],
          internalLinks: [],
        },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.propositions.length).toBeGreaterThan(0);
        expect(res.body.geoScore).toBeUndefined();
        expect(mockGeoService.optimizeForAiEngines).not.toHaveBeenCalled();
      });
  });

  it('POST /corrections/propose/:pageUrl - SEO + GEO combinés (avec pageContent)', () => {
    const pageUrl = encodeURIComponent('https://example.com/page2');

    return request(app.getHttpServer())
      .post(`/corrections/propose/${pageUrl}`)
      .send({
        findings: {
          url: 'https://example.com/page2',
          title: 'Un titre correct',
          metaDescription: '',
          h1: ['ok'],
          h2: [],
          internalLinks: [],
        },
        pageContent: 'Contenu de la page suffisamment long pour l\'analyse GEO.',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.geoScore).toBe(65);
        expect(mockGeoService.optimizeForAiEngines).toHaveBeenCalled();
        expect(
          res.body.propositions.some((p: any) => p.champ === 'reecriture'),
        ).toBe(true);
      });
  });

  it('POST /corrections/propose/:pageUrl - rejette un findings invalide (validation Zod)', () => {
    const pageUrl = encodeURIComponent('https://example.com');

    return request(app.getHttpServer())
      .post(`/corrections/propose/${pageUrl}`)
      .send({ findings: { url: 'https://example.com' } }) // champs obligatoires manquants
      .expect(400);
  });
});