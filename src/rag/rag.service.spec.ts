import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RagService } from './rag.service';
import { LlmService } from '../llm/llm.service';

// On "mock" le module 'pg' entier pour éviter toute vraie connexion PostgreSQL
jest.mock('pg', () => {
  const mockQuery = jest.fn();
  return {
    Pool: jest.fn().mockImplementation(() => ({
      query: mockQuery,
    })),
  };
});

describe('RagService', () => {
  let service: RagService;

  const mockLlmService = {
    embed: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('postgresql://fake-url'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: LlmService, useValue: mockLlmService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should index a document by embedding it and inserting it', async () => {
    mockLlmService.embed.mockResolvedValue([0.1, 0.2, 0.3]);

    const result = await service.indexDocument('client-test-1', 'Un texte SEO.');

    expect(mockLlmService.embed).toHaveBeenCalledWith('Un texte SEO.');
    expect(result).toEqual({ indexed: true });
  });

  it('should search documents by embedding the query', async () => {
    mockLlmService.embed.mockResolvedValue([0.1, 0.2, 0.3]);

    // Accès au mock interne du pool créé dans le constructeur
    const poolInstance = (service as any).pool;
    poolInstance.query.mockResolvedValue({
      rows: [{ texte: 'Résultat trouvé' }],
    });

    const result = await service.search('client-test-1', 'question test');

    expect(mockLlmService.embed).toHaveBeenCalledWith('question test');
    expect(result).toEqual([{ texte: 'Résultat trouvé' }]);
  });
});