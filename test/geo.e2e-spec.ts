import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GeoModule } from '../src/geo/geo.module';
import { LlmService } from '../src/llm/llm.service';

describe('GeoController (e2e)', () => {
  let app: INestApplication;

  const mockLlmService = {
    generate: jest.fn().mockResolvedValue(
      JSON.stringify({
        score: 85,
        structuredContent: 'Version optimisée et citable du contenu.',
        faqSuggestions: [
          { question: 'Qu\'est-ce que le GEO ?', answer: 'Optimisation pour les IA génératives.' },
        ],
        entities: [],
        recommendations: [],
      }),
    ),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GeoModule],
    })
      .overrideProvider(LlmService)
      .useValue(mockLlmService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /geo/optimize/:pageId - renvoie le contenu optimisé structuré', () => {
    return request(app.getHttpServer())
      .post('/geo/optimize/page-test-1')
      .send({ content: 'Contenu original à optimiser, assez long pour passer la validation.' })
      .expect(201)
      .expect((res) => {
        expect(res.body.pageId).toBe('page-test-1');
        expect(res.body.structuredContent).toContain('optimisée');
        expect(res.body.faqSuggestions).toHaveLength(1);
      });
  });

  it('POST /geo/optimize/:pageId - rejette un contenu trop court (validation Zod)', () => {
    return request(app.getHttpServer())
      .post('/geo/optimize/page-test-1')
      .send({ content: 'Trop court' })
      .expect(400);
  });

  it('POST /geo/entities/:pageId - renvoie les entités (endpoint séparé)', () => {
    const mockEntities = { generate: jest.fn().mockResolvedValue(JSON.stringify([
      { name: 'Nike', type: 'brand', context: 'Marque citée en exemple.' },
    ])) };
    Object.assign(mockLlmService, mockEntities);

    return request(app.getHttpServer())
      .post('/geo/entities/page-test-1')
      .send({ content: 'Un contenu suffisamment long mentionnant Nike.' })
      .expect(201)
      .expect((res) => {
        expect(res.body.pageId).toBe('page-test-1');
        expect(Array.isArray(res.body.entities)).toBe(true);
      });
  });
});