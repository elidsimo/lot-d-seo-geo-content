import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';


describe('RAG SEO (real API)', () => {
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

  it('POST /rag/index puis /rag/search - retrouve le document indexe', async () => {
    await request(app.getHttpServer())
      .post('/rag/index')
      .send({
        clientId: 'client-real-test',
        texte: "Notre agence recommande toujours d'optimiser les balises title.",
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/rag/search')
      .send({ clientId: 'client-real-test', requete: 'Comment optimiser mes balises title ?' })
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].texte).toContain('title');
  }, 30000);

  it('POST /rag/retrieve - retourne un contexte formate depuis la base seedee', async () => {
    const res = await request(app.getHttpServer())
      .post('/rag/retrieve')
      .send({ query: 'Quelle est la longueur ideale pour une meta description ?' })
      .expect(201);

    expect(typeof res.body.context).toBe('string');
    expect(res.body.context).toContain('[Extrait 1]');
    expect(res.body.context.toLowerCase()).toContain('meta description');
  }, 30000);
});