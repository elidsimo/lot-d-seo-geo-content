import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { LlmService } from '../llm/llm.service';
import { BrandParametersClientService } from '../brand-parameters-client/brand-parameters-client.service';

describe('ContentService', () => {
  let service: ContentService;

  const mockLlmService = {
    generate: jest.fn(),
  };

  const mockBrandParametersClientService = {
    fetchBrandParameters: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: LlmService, useValue: mockLlmService },
        { provide: BrandParametersClientService, useValue: mockBrandParametersClientService },
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

  // tests de l'ancienne methode generate() : comportement inchange

  it('should generate an article and return type, titre and contenu (legacy generate())', async () => {
    mockLlmService.generate.mockResolvedValue('Un article généré par IA.');

    const result = await service.generate('article', 'Le SEO en 2026', 'professionnel');

    expect(mockLlmService.generate).toHaveBeenCalledTimes(1);
    expect(mockBrandParametersClientService.fetchBrandParameters).not.toHaveBeenCalled();
    expect(result.type).toBe('article');
    expect(result.titre).toBe('Le SEO en 2026');
    expect(result.contenu).toBe('Un article généré par IA.');
  });

  it('should generate a faq content (legacy generate())', async () => {
    mockLlmService.generate.mockResolvedValue('Questions et réponses générées.');

    const result = await service.generate('faq', 'GEO Automation', 'simple');

    expect(result.type).toBe('faq');
    expect(result.contenu).toBe('Questions et réponses générées.');
  });

  // tests des nouvelles methodes dediees

  describe('generateArticle', () => {
    it('should use neutral brand values when no clientId is provided', async () => {
      mockLlmService.generate.mockResolvedValue('Article généré.');

      const result = await service.generateArticle('Le SEO local');

      expect(mockBrandParametersClientService.fetchBrandParameters).not.toHaveBeenCalled();
      expect(result.type).toBe('article');
      expect(result.titre).toBe('Le SEO local');
    });

    it('should fetch brand parameters when clientId is provided', async () => {
      mockBrandParametersClientService.fetchBrandParameters.mockResolvedValue({
        ton: 'décontracté',
        style: 'punchy',
        contraintes: ['Ne jamais citer de concurrents'],
      });
      mockLlmService.generate.mockResolvedValue('Article personnalisé.');

      const result = await service.generateArticle('Le SEO local', 'client-42');

      expect(mockBrandParametersClientService.fetchBrandParameters).toHaveBeenCalledWith('client-42');
      expect(result.contenu).toBe('Article personnalisé.');

      // Vérifie que le prompt envoye au LLM contient bien les parametres de marque
      const promptUtilise = mockLlmService.generate.mock.calls[0][0];
      expect(promptUtilise).toContain('décontracté');
      expect(promptUtilise).toContain('punchy');
      expect(promptUtilise).toContain('Ne jamais citer de concurrents');
    });
  });

  describe('generateFaq', () => {
    it('should return a faq type result', async () => {
      mockLlmService.generate.mockResolvedValue('Q: ... R: ...');

      const result = await service.generateFaq('Le SEO local');

      expect(result.type).toBe('faq');
      expect(result.contenu).toBe('Q: ... R: ...');
    });
  });

  describe('generatePillarPage', () => {
    it('should return a pillar_page type result', async () => {
      mockLlmService.generate.mockResolvedValue('Page pilier complète.');

      const result = await service.generatePillarPage('Le SEO local');

      expect(result.type).toBe('pillar_page');
      expect(result.contenu).toBe('Page pilier complète.');
    });
  });

  describe('fetchBrandParameters', () => {
    it('should delegate to BrandParametersClientService', async () => {
      mockBrandParametersClientService.fetchBrandParameters.mockResolvedValue({
        ton: 'formel',
        style: 'académique',
        contraintes: [],
      });

      const result = await service.fetchBrandParameters('client-1');

      expect(mockBrandParametersClientService.fetchBrandParameters).toHaveBeenCalledWith('client-1');
      expect(result.ton).toBe('formel');
    });
  });
});