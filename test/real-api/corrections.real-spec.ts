import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Corrections (real API)', () => {
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

  it('POST /corrections/propose/:pageUrl - SEO seul (sans pageContent)', async () => {
    const res = await request(app.getHttpServer())
      .post('/corrections/propose/site-real-test')
      .send({
        findings: {
          url: 'https://example.com',
          title: '',
          metaDescription: '',
          h1: [],
          h2: [],
          internalLinks: [],
        },
      })
      .expect(201);

    expect(res.body.geoScore).toBeUndefined();
    expect(res.body.propositions.length).toBeGreaterThan(0);
    expect(res.body.sendResults.every((r: any) => r.status === 'sent')).toBe(true);
  }, 30000);

  it('POST /corrections/propose/:pageUrl - SEO + GEO combines, tries par priorite', async () => {
    const res = await request(app.getHttpServer())
      .post('/corrections/propose/site-real-test')
      .send({
        findings: {
          url: 'https://example.com',
          title: 'Un titre correct',
          metaDescription: '',
          h1: ['ok'],
          h2: [],
          internalLinks: [],
        },
        pageContent:
          "Notre agence propose des services d'optimisation SEO pour les petites entreprises locales.",
      })
      .expect(201);

    expect(typeof res.body.geoScore).toBe('number');
    expect(res.body.propositions.length).toBeGreaterThan(0);

    // Verifie le tri par priorite decroissante (high avant medium avant low)
    const order = { high: 3, medium: 2, low: 1 };
    const priorities = res.body.propositions.map((p: any) => order[p.priorite]);
    const sorted = [...priorities].sort((a, b) => b - a);
    expect(priorities).toEqual(sorted);
  }, 30000);
});