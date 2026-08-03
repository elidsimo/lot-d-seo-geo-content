import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RagModule } from '../src/rag/rag.module';
import { RagService } from '../src/rag/rag.service';
import { LlmService } from '../src/llm/llm.service';
import { ClientConfigClientService } from '../src/client-config-client/client-config-client.service';

describe('RagController (e2e)', () => {
  let app: INestApplication;

  const mockRagService = {
    indexDocument: jest.fn().mockResolvedValue({ indexed: true }),
    search: jest.fn().mockResolvedValue([{ texte: 'resultat' }]),
    retrieveSeoKnowledge: jest.fn().mockResolvedValue('[Extrait 1]\ncontexte'),
  };

  const mockLlmService = {
    generate: jest.fn(),
    embed: jest.fn(),
  };

  const mockClientConfigClientService = {
    fetchClientConfig: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RagModule],
    })
      .overrideProvider(RagService)
      .useValue(mockRagService)
      .overrideProvider(LlmService)
      .useValue(mockLlmService)
      .overrideProvider(ClientConfigClientService)
      .useValue(mockClientConfigClientService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
  afterEach(() => {
    jest.clearAllMocks();
  })

  afterAll(async () => {
    await app.close();
  });

  it('POST /rag/index - autorise si le RAG est active pour le client', () => {
    mockClientConfigClientService.fetchClientConfig.mockResolvedValue({
      plan: 'pro',
      ragEnabled: true,
    });

    return request(app.getHttpServer())
      .post('/rag/index')
      .send({ clientId: 'client-1', texte: 'Un texte SEO.' })
      .expect(201)
      .expect((res) => {
        expect(res.body.indexed).toBe(true);
      });
  });

  it("POST /rag/index - rejette si le RAG n'est pas active pour le client (403)", () => {
    mockClientConfigClientService.fetchClientConfig.mockResolvedValue({
      plan: 'free',
      ragEnabled: false,
    });

    return request(app.getHttpServer())
      .post('/rag/index')
      .send({ clientId: 'client-2', texte: 'Un texte SEO.' })
      .expect(403);
  });

  it("POST /rag/search - rejette si le RAG n'est pas active pour le client (403)", () => {
    mockClientConfigClientService.fetchClientConfig.mockResolvedValue({
      plan: 'free',
      ragEnabled: false,
    });

    return request(app.getHttpServer())
      .post('/rag/search')
      .send({ clientId: 'client-2', requete: 'question' })
      .expect(403);
  });

  it('POST /rag/retrieve - accessible sans verification de plan (base generique)', () => {
    return request(app.getHttpServer())
      .post('/rag/retrieve')
      .send({ query: 'question generique' })
      .expect(201)
      .expect((res) => {
        expect(res.body.context).toContain('[Extrait 1]');
        expect(mockClientConfigClientService.fetchClientConfig).not.toHaveBeenCalled();
      });
  });
});