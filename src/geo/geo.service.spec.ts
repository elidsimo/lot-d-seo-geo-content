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

  describe('optimizeForAiEngines', () => {
    it('should parse a valid JSON response from the LLM', async () => {
      mockLlmService.generate.mockResolvedValue(
        JSON.stringify({
          score: 82,
          structuredContent: 'Contenu reformulé et clair.',
          faqSuggestions: [
            { question: 'Qu\'est-ce que le GEO ?', answer: 'Le GEO optimise le contenu pour les IA.' },
          ],
          entities: [
            { name: 'Claude', type: 'product', context: 'Assistant IA cité en exemple.' },
          ],
          recommendations: [
            { type: 'faq_missing', severity: 'medium', suggestion: 'Ajouter une FAQ.' },
          ],
        }),
      );

      const result = await service.optimizeForAiEngines('Contenu original.');

      expect(llmService.generate).toHaveBeenCalledTimes(1);
      expect(result.score).toBe(82);
      expect(result.faqSuggestions).toHaveLength(1);
      expect(result.entities[0].name).toBe('Claude');
    });

    it('should throw a clear error if the LLM returns invalid JSON', async () => {
      mockLlmService.generate.mockResolvedValue('Ceci n\'est pas du JSON.');

      await expect(
        service.optimizeForAiEngines('Contenu original.'),
      ).rejects.toThrow('n\'est pas un JSON valide');
    });

    it('should throw a clear error if the JSON does not match the schema', async () => {
      mockLlmService.generate.mockResolvedValue(
        JSON.stringify({ score: 'pas un nombre' }),
      );

      await expect(
        service.optimizeForAiEngines('Contenu original.'),
      ).rejects.toThrow('ne respecte pas le format attendu');
    });
  });

  describe('analyzeFaqQuality', () => {
    it('should parse a valid FAQ quality analysis', async () => {
      mockLlmService.generate.mockResolvedValue(
        JSON.stringify({
          existingFaqCount: 1,
          missingQuestions: ['Combien coûte le service ?'],
          clarityIssues: [],
          formatIssues: ['Réponse trop longue pour être citée.'],
        }),
      );

      const result = await service.analyzeFaqQuality('Contenu.', [
        { question: 'Qu\'est-ce que le SEO ?', answer: 'Le SEO optimise le référencement.' },
      ]);

      expect(result.existingFaqCount).toBe(1);
      expect(result.missingQuestions).toContain('Combien coûte le service ?');
    });
  });

  describe('enrichEntities', () => {
    it('should parse a valid list of entities', async () => {
      mockLlmService.generate.mockResolvedValue(
        JSON.stringify([
          { name: 'Nike', type: 'brand', context: 'Marque de chaussures citée.' },
        ]),
      );

      const result = await service.enrichEntities('Contenu sur les chaussures Nike.');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('brand');
    });
  });

  describe('optimizePage (compatibilité)', () => {
    it('should return only the structured content', async () => {
      mockLlmService.generate.mockResolvedValue(
        JSON.stringify({
          score: 70,
          structuredContent: 'Version optimisée et citable du contenu.',
          faqSuggestions: [],
          entities: [],
          recommendations: [],
        }),
      );

      const result = await service.optimizePage('Contenu original à optimiser.');

      expect(result.optimizedContent).toContain('optimisée');
    });
  });
});