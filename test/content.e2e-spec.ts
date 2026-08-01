import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ContentModule } from '../src/content/content.module';
import { LlmService } from '../src/llm/llm.service';
import { BrandParametersClientService } from '../src/brand-parameters-client/brand-parameters-client.service';

describe('ContentController (e2e)', () => {
  let app: INestApplication;

  const mockLlmService = {
    generate: jest.fn().mockResolvedValue('Un article généré par IA.'),
  };

  const mockBrandParametersClientService = {
    fetchBrandParameters: jest.fn().mockResolvedValue({
      ton: 'professionnel',
      style: 'clair et concis',
      contraintes: [],
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ContentModule],
    })
      .overrideProvider(LlmService)
      .useValue(mockLlmService)
      .overrideProvider(BrandParametersClientService)
      .useValue(mockBrandParametersClientService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /content/generate - génère un article (route legacy inchangée)', () => {
    return request(app.getHttpServer())
      .post('/content/generate')
      .send({ type: 'article', sujet: 'Le SEO en 2026', ton: 'professionnel' })
      .expect(201)
      .expect((res) => {
        expect(res.body.type).toBe('article');
        expect(res.body.titre).toBe('Le SEO en 2026');
        expect(res.body.contenu).toBe('Un article généré par IA.');
      });
  });

  it('POST /content/article - génère un article via le nouveau template', () => {
    return request(app.getHttpServer())
      .post('/content/article')
      .send({ sujet: 'Le SEO local', clientId: 'client-42' })
      .expect(201)
      .expect((res) => {
        expect(res.body.type).toBe('article');
        expect(mockBrandParametersClientService.fetchBrandParameters).toHaveBeenCalledWith('client-42');
      });
  });

  it('POST /content/faq - génère une FAQ', () => {
    return request(app.getHttpServer())
      .post('/content/faq')
      .send({ sujet: 'Le SEO local' })
      .expect(201)
      .expect((res) => {
        expect(res.body.type).toBe('faq');
      });
  });

  it('POST /content/pillar-page - génère une page pilier', () => {
    return request(app.getHttpServer())
      .post('/content/pillar-page')
      .send({ sujet: 'Le SEO local' })
      .expect(201)
      .expect((res) => {
        expect(res.body.type).toBe('pillar_page');
      });
  });

  it('POST /content/article - rejette un sujet trop court (validation Zod)', () => {
    return request(app.getHttpServer())
      .post('/content/article')
      .send({ sujet: 'ok' })
      .expect(400);
  });
});