import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Content Agent (real API)', () => {
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

  it('POST /content/generate - route legacy retourne un article genere', async () => {
    const res = await request(app.getHttpServer())
      .post('/content/generate')
      .send({ type: 'article', sujet: 'Le SEO en 2026', ton: 'professionnel' })
      .expect(201);

    expect(res.body.type).toBe('article');
    expect(res.body.titre).toBe('Le SEO en 2026');
    expect(typeof res.body.contenu).toBe('string');
    expect(res.body.contenu.length).toBeGreaterThan(50);
  }, 30000);

  it('POST /content/article - genere un article via le template dedie', async () => {
    const res = await request(app.getHttpServer())
      .post('/content/article')
      .send({ sujet: 'Le SEO local pour les petites entreprises' })
      .expect(201);

    expect(res.body.type).toBe('article');
    expect(typeof res.body.contenu).toBe('string');
  }, 30000);

  it('POST /content/faq - genere une FAQ', async () => {
    const res = await request(app.getHttpServer())
      .post('/content/faq')
      .send({ sujet: 'Le SEO local pour les petites entreprises' })
      .expect(201);

    expect(res.body.type).toBe('faq');
    expect(res.body.contenu).toContain('Q:');
  }, 30000);

  it('POST /content/pillar-page - genere une page pilier', async () => {
    const res = await request(app.getHttpServer())
      .post('/content/pillar-page')
      .send({ sujet: 'Le SEO local pour les petites entreprises' })
      .expect(201);

    expect(res.body.type).toBe('pillar_page');
    expect(typeof res.body.contenu).toBe('string');
  }, 30000);
});