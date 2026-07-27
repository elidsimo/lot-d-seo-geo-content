import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SeoModule } from '../src/seo/seo.module';

describe('SeoController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SeoModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /seo/audit/:siteId - détecte un title manquant', () => {
    return request(app.getHttpServer())
      .post('/seo/audit/site-test-1')
      .send({
        url: 'https://example.com',
        title: '',
        metaDescription: 'Une description correcte.',
        h1: ['Titre principal'],
      })
      .expect(201)
      .expect((res) => {
        expect(
          res.body.problemes.some((p: string) => p.includes('Title')),
        ).toBe(true);
      });
  });

  it('POST /seo/audit/:siteId - ne remonte aucun problème pour une page bien optimisée', () => {
    return request(app.getHttpServer())
      .post('/seo/audit/site-test-2')
      .send({
        url: 'https://example.com',
        title: 'Un titre bien optimisé pour le SEO',
        metaDescription:
          'Une meta description bien rédigée et suffisamment longue pour être utile.',
        h1: ['Titre principal unique'],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.problemes.length).toBe(0);
      });
  });
});