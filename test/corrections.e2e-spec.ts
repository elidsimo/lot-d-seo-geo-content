import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CorrectionsModule } from '../src/corrections/corrections.module';
import { HistoryClientService } from '../src/history-client/history-client.service';

describe('CorrectionsController (e2e)', () => {
  let app: INestApplication;

  const mockHistoryClientService = {
    sendProposition: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CorrectionsModule],
    })
      .overrideProvider(HistoryClientService)
      .useValue(mockHistoryClientService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /corrections/propose/:pageUrl - envoie une proposition par problème détecté', () => {
    const pageUrl = encodeURIComponent('https://example.com');

    return request(app.getHttpServer())
      .post(`/corrections/propose/${pageUrl}`)
      .send({
        findings: {
          url: 'https://example.com',
          title: '',
          metaDescription: 'ok',
          h1: ['ok'],
        },
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.propositions.length).toBeGreaterThan(0);
        expect(mockHistoryClientService.sendProposition).toHaveBeenCalled();
      });
  });
});