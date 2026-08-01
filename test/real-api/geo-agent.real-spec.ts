import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';


describe('GEO Agent (real API)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('POST /geo/optimize/:pageId - retourne un resultat structure et valide', async () => {
    const res = await request(app.getHttpServer())
      .post('/geo/optimize/page-real-test')
      .send({
        content:
          "Notre agence propose des services d'optimisation SEO pour les petites entreprises locales.",
      })
      .expect(201);

    expect(typeof res.body.score).toBe('number');
    expect(res.body.score).toBeGreaterThanOrEqual(0);
    expect(res.body.score).toBeLessThanOrEqual(100);
    expect(typeof res.body.structuredContent).toBe('string');
    expect(Array.isArray(res.body.faqSuggestions)).toBe(true);
    expect(Array.isArray(res.body.entities)).toBe(true);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  }, 30000);

  it('POST /geo/faq-quality/:pageId - analyse une FAQ existante', async () => {
    const res = await request(app.getHttpServer())
      .post('/geo/faq-quality/page-real-test')
      .send({
        content: "Notre agence propose des services d'optimisation SEO.",
        existingFaq: [{ question: 'Proposez-vous du SEO local ?', answer: 'Oui.' }],
      })
      .expect(201);

    expect(typeof res.body.existingFaqCount).toBe('number');
    expect(Array.isArray(res.body.missingQuestions)).toBe(true);
  }, 30000);

  it('POST /geo/entities/:pageId - extrait des entites nommees', async () => {
    const res = await request(app.getHttpServer())
      .post('/geo/entities/page-real-test')
      .send({
        content: 'Notre agence utilise Google Search Console et travaille a Paris et Lyon.',
      })
      .expect(201);

    expect(Array.isArray(res.body.entities)).toBe(true);
    expect(res.body.entities.length).toBeGreaterThan(0);
  }, 30000);
});