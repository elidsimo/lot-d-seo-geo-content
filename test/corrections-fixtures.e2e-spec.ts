import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CorrectionsModule } from '../src/corrections/corrections.module';
import { HistoryClientService } from '../src/history-client/history-client.service';
import { GeoService } from '../src/geo/geo.service';
import { LlmService } from '../src/llm/llm.service';
import { PropositionSchema } from '../src/common/schemas/proposition.schema';
import { generateCrawlFixtures } from './fixtures/crawl-fixtures';

describe('POST /corrections/propose sur un echantillon de fixtures (e2e)', () => {
  let app: INestApplication;
  const sentPropositions: any[] = [];

  const mockHistoryClientService = {
    sendProposition: jest.fn((pageUrl: string, proposition: any) => {
      sentPropositions.push({ pageUrl, proposition });
      return Promise.resolve({ success: true });
    }),
  };

  const mockGeoService = {
    optimizeForAiEngines: jest.fn().mockResolvedValue({
      score: 60,
      structuredContent: 'Contenu reformule.',
      faqSuggestions: [],
      entities: [],
      recommendations: [],
    }),
  };

  const mockLlmService = { generate: jest.fn(), embed: jest.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CorrectionsModule],
    })
      .overrideProvider(HistoryClientService)
      .useValue(mockHistoryClientService)
      .overrideProvider(GeoService)
      .useValue(mockGeoService)
      .overrideProvider(LlmService)
      .useValue(mockLlmService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const sample = generateCrawlFixtures(400).slice(0, 10);

  sample.forEach((page, i) => {
    it(`fixture page ${i} (${page.url}) - propositions conformes et enregistrees`, async () => {
      const res = await request(app.getHttpServer())
        .post(`/corrections/propose/${encodeURIComponent(page.url)}`)
        .send({ findings: page })
        .expect(201);

      expect(res.body.pageUrl).toBe(page.url);
      expect(Array.isArray(res.body.propositions)).toBe(true);

      // Conformite Zod du format de chaque proposition (champ modifie,
      // valeurs avant/apres, justification, priorite)
      for (const proposition of res.body.propositions) {
        expect(() => PropositionSchema.parse(proposition)).not.toThrow();
      }

      expect(Array.isArray(res.body.sendResults)).toBe(true);
      expect(res.body.sendResults.every((r: any) => r.status === 'sent')).toBe(true);
    });
  });

  it('a bien transmis une proposition au Lot A (mocke) pour au moins une page traitee', () => {
    expect(sentPropositions.length).toBeGreaterThan(0);
    expect(mockHistoryClientService.sendProposition).toHaveBeenCalled();
  });
});