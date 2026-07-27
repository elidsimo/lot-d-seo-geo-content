import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { LlmService } from '../llm/llm.service';

describe('ContentService', () => {
  let service: ContentService;

  const mockLlmService = {
    generate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: LlmService, useValue: mockLlmService },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate an article and return type, titre and contenu', async () => {
    mockLlmService.generate.mockResolvedValue('Un article généré par IA.');

    const result = await service.generate('article', 'Le SEO en 2026', 'professionnel');

    expect(mockLlmService.generate).toHaveBeenCalledTimes(1);
    expect(result.type).toBe('article');
    expect(result.titre).toBe('Le SEO en 2026');
    expect(result.contenu).toBe('Un article généré par IA.');
  });

  it('should generate a faq content', async () => {
    mockLlmService.generate.mockResolvedValue('Questions et réponses générées.');

    const result = await service.generate('faq', 'GEO Automation', 'simple');

    expect(result.type).toBe('faq');
    expect(result.contenu).toBe('Questions et réponses générées.');
  });
});