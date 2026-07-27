import { Test, TestingModule } from '@nestjs/testing';
import { GeoService } from './geo.service';
import { LlmService } from '../llm/llm.service';

describe('GeoService', () => {
  let service: GeoService;
  let llmService: LlmService;

  const mockLlmService = {
    generate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoService,
        { provide: LlmService, useValue: mockLlmService },
      ],
    }).compile();

    service = module.get<GeoService>(GeoService);
    llmService = module.get<LlmService>(LlmService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call LlmService.generate and return the optimized content', async () => {
    mockLlmService.generate.mockResolvedValue(
      'Version optimisée et citable du contenu.',
    );

    const result = await service.optimizePage('Contenu original à optimiser.');

    expect(llmService.generate).toHaveBeenCalledTimes(1);
    expect(result.optimizedContent).toContain('optimisée');
  });
});