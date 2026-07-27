import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ContentModule } from '../src/content/content.module';
import { LlmService } from '../src/llm/llm.service';

describe('ContentController (e2e)', () => {
  let app: INestApplication;

  const mockLlmService = {
    generate: jest.fn().mockResolvedValue('Un article généré par IA.'),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ContentModule],
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

  it('POST /content/generate - génère un article', () => {
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
});