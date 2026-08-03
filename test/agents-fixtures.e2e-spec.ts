import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GeoModule } from '../src/geo/geo.module';
import { ContentModule } from '../src/content/content.module';
import { LlmService } from '../src/llm/llm.service';
import { BrandParametersClientService } from '../src/brand-parameters-client/brand-parameters-client.service';
import { generateCrawlFixtures } from './fixtures/crawl-fixtures';



describe('GEO + Content Agents sur un echantillon de fixtures (e2e)', () => {
  let geoApp: INestApplication;
  let contentApp: INestApplication;

  const mockLlmService = {
    generate: jest.fn().mockResolvedValue(
      JSON.stringify({
        score: 70,
        structuredContent: 'Contenu reformule.',
        faqSuggestions: [],
        entities: [],
        recommendations: [],
      }),
    ),
    embed: jest.fn(),
  };

  const mockBrandParametersClientService = {
    fetchBrandParameters: jest.fn().mockResolvedValue({
      ton: 'professionnel',
      style: 'clair',
      contraintes: [],
    }),
  };

  beforeAll(async () => {
    const geoModule: TestingModule = await Test.createTestingModule({
      imports: [GeoModule],
    })
      .overrideProvider(LlmService)
      .useValue(mockLlmService)
      .compile();
    geoApp = geoModule.createNestApplication();
    await geoApp.init();

    const contentModule: TestingModule = await Test.createTestingModule({
      imports: [ContentModule],
    })
      .overrideProvider(LlmService)
      .useValue(mockLlmService)
      .overrideProvider(BrandParametersClientService)
      .useValue(mockBrandParametersClientService)
      .compile();
    contentApp = contentModule.createNestApplication();
    await contentApp.init();
  });

  afterAll(async () => {
    await geoApp.close();
    await contentApp.close();
  });

  const sample = generateCrawlFixtures(400).slice(0, 5);

  sample.forEach((page, i) => {
    it(`GEO - fixture page ${i} (${page.url}) produit un resultat structure valide`, async () => {
      const content =
        `${page.title ?? 'Sans titre'}. ${page.metaDescription ?? ''}`.trim() ||
        'Contenu de page generique.';

      const res = await request(geoApp.getHttpServer())
        .post('/geo/optimize/page-fixture')
        .send({ content })
        .expect(201);

      expect(typeof res.body.score).toBe('number');
      expect(typeof res.body.structuredContent).toBe('string');
    });

    it(`Content - fixture page ${i} genere un article structure valide`, async () => {
      const res = await request(contentApp.getHttpServer())
        .post('/content/article')
        .send({ sujet: page.title ?? `Sujet page ${page.url}` })
        .expect(201);

      expect(res.body.type).toBe('article');
      expect(typeof res.body.contenu).toBe('string');
    });
  });
});