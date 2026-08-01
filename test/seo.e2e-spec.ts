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
        metaDescription: 'Une description correcte et suffisamment longue pour être utile ici.',
        h1: ['Titre principal'],
        h2: [],
        internalLinks: [],
      })
      .expect(201)
      .expect((res) => {
        expect(
          res.body.recommendations.some((r: any) => r.type === 'title_missing'),
        ).toBe(true);
      });
  });

  it('POST /seo/audit/:siteId - rejette un body invalide avec 400', () => {
    return request(app.getHttpServer())
      .post('/seo/audit/site-test-2')
      .send({ url: 'https://example.com' }) // title, metaDescription, h1 manquants
      .expect(400);
  });
  it('POST /seo/internal-linking/:siteId - detecte une page orpheline', () => {
    return request(app.getHttpServer())
      .post('/seo/internal-linking/site-test-1')
      .send({
        pages: [
          {
            url: 'https://example.com/a',
            title: 'Page A',
            metaDescription: 'ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok',
            h1: ['A'],
            h2: [],
            internalLinks: [],
          },
          {
            url: 'https://example.com/b',
            title: 'Page B',
            metaDescription: 'ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok',
            h1: ['B'],
            h2: [],
            internalLinks: [],
          },
        ],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.recommendations.some((r: any) => r.type === 'orphan_page')).toBe(true);
      });
  });

  it('POST /seo/internal-linking/:siteId - rejette un body sans pages (validation Zod)', () => {
    return request(app.getHttpServer())
      .post('/seo/internal-linking/site-test-1')
      .send({ pages: [] })
      .expect(400);
  });
});