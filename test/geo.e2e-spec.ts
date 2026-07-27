import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GeoModule } from '../src/geo/geo.module';
import { LlmService } from '../src/llm/llm.service';

describe('GeoController (e2e)', () => {
  let app: INestApplication;

  const mockLlmService = {
    generate: jest
      .fn()
      .mockResolvedValue('Version optimisée et citable du contenu.'),
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

  it('POST /geo/optimize/:pageId - renvoie le contenu optimisé', () => {
    return request(app.getHttpServer())
      .post('/geo/optimize/page-test-1')
      .send({ content: 'Contenu original à optimiser.' })
      .expect(201)
      .expect((res) => {
        expect(res.body.optimizedContent).toContain('optimisée');
      });
  });
});