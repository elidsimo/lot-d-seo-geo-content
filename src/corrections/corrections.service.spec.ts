import { Test, TestingModule } from '@nestjs/testing';
import { CorrectionsService } from './corrections.service';
import { SeoService } from '../seo/seo.service';
import { GeoService } from '../geo/geo.service';
import { HistoryClientService } from '../history-client/history-client.service';

describe('CorrectionsService', () => {
  let service: CorrectionsService;

  const mockSeoService = {
    auditOnPage: jest.fn(),
  };

  const mockGeoService = {
    optimizeForAiEngines: jest.fn(),
  };

  const mockHistoryClientService = {
    sendProposition: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorrectionsService,
        { provide: SeoService, useValue: mockSeoService },
        { provide: GeoService, useValue: mockGeoService },
        { provide: HistoryClientService, useValue: mockHistoryClientService },
      ],
    }).compile();

    service = module.get<CorrectionsService>(CorrectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCorrectionsForPage', () => {
    it('should use only SEO when pageContent is not provided', async () => {
      mockSeoService.auditOnPage.mockReturnValue({
        url: 'https://example.com',
        score: 70,
        recommendations: [
          {
            type: 'title_missing',
            severity: 'high',
            message: 'Le title est manquant.',
            suggestion: 'Ajouter un title.',
          },
        ],
      });

      const result = await service.generateCorrectionsForPage('https://example.com', {
        url: 'https://example.com',
        title: '',
        metaDescription: 'ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok',
        h1: ['ok'],
        h2: [],
        internalLinks: [],
      });

      expect(mockGeoService.optimizeForAiEngines).not.toHaveBeenCalled();
      expect(result.propositions).toHaveLength(1);
      expect(result.propositions[0].champ).toBe('meta_title');
      expect(result.propositions[0].priorite).toBe('high');
      expect(result.geoScore).toBeUndefined();
    });

    it('should combine SEO and GEO propositions and sort by priority', async () => {
      mockSeoService.auditOnPage.mockReturnValue({
        url: 'https://example.com',
        score: 70,
        recommendations: [
          {
            type: 'meta_description_missing',
            severity: 'low',
            message: 'Meta description manquante.',
            suggestion: 'Ajouter une meta description.',
          },
        ],
      });

      mockGeoService.optimizeForAiEngines.mockResolvedValue({
        score: 60,
        structuredContent: 'Contenu reformulé.',
        faqSuggestions: [
          { question: 'Qu\'est-ce que le SEO ?', answer: 'Une discipline web.' },
        ],
        entities: [],
        recommendations: [
          { type: 'entity_missing', severity: 'high', suggestion: 'Ajouter des entités.' },
        ],
      });

      const result = await service.generateCorrectionsForPage(
        'https://example.com',
        {
          url: 'https://example.com',
          title: 'Un titre correct',
          metaDescription: '',
          h1: ['ok'],
          h2: [],
          internalLinks: [],
        },
        'Contenu de la page suffisamment long pour l\'analyse GEO.',
      );

      expect(mockGeoService.optimizeForAiEngines).toHaveBeenCalledTimes(1);
      expect(result.geoScore).toBe(60);
      // 3 propositions : 1 SEO (low) + 1 GEO recommendation (high) + 1 FAQ (medium)
      expect(result.propositions).toHaveLength(3);
      // La priorité 'high' doit être en premier après le tri
      expect(result.propositions[0].priorite).toBe('high');
      expect(result.propositions[0].champ).toBe('schema_org');
      // La FAQ générée doit être présente avec champ 'faq'
      expect(result.propositions.some((p) => p.champ === 'faq')).toBe(true);
    });
  });

  describe('postProposalsToHistory', () => {
    it('should send every proposition and report success', async () => {
      mockHistoryClientService.sendProposition.mockResolvedValue({ success: true });

      const propositions = [
        {
          champ: 'meta_title' as const,
          valeurAvant: '',
          valeurApres: 'Nouveau titre',
          justification: 'Title manquant',
          priorite: 'high' as const,
        },
      ];

      const results = await service.postProposalsToHistory('https://example.com', propositions);

      expect(mockHistoryClientService.sendProposition).toHaveBeenCalledTimes(1);
      expect(results[0].status).toBe('sent');
    });

    it('should isolate a failure on one proposition without stopping the others', async () => {
      mockHistoryClientService.sendProposition
        .mockRejectedValueOnce(new Error('Lot A injoignable'))
        .mockResolvedValueOnce({ success: true });

      const propositions = [
        {
          champ: 'meta_title' as const,
          valeurAvant: '',
          valeurApres: 'Titre 1',
          justification: 'Raison 1',
          priorite: 'high' as const,
        },
        {
          champ: 'h1' as const,
          valeurAvant: '',
          valeurApres: 'H1 proposé',
          justification: 'Raison 2',
          priorite: 'medium' as const,
        },
      ];

      const results = await service.postProposalsToHistory('https://example.com', propositions);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('failed');
      expect(results[1].status).toBe('sent');
    });
  });

  describe('propose (orchestration complète)', () => {
    it('should generate propositions then send them to the Lot A', async () => {
      mockSeoService.auditOnPage.mockReturnValue({
        url: 'https://example.com',
        score: 70,
        recommendations: [
          {
            type: 'title_missing',
            severity: 'high',
            message: 'Le title est manquant.',
            suggestion: 'Ajouter un title.',
          },
        ],
      });
      mockHistoryClientService.sendProposition.mockResolvedValue({ success: true });

      const result = await service.propose('https://example.com', {
        url: 'https://example.com',
        title: '',
        metaDescription: 'ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok ok',
        h1: ['ok'],
        h2: [],
        internalLinks: [],
      });

      expect(result.propositions).toHaveLength(1);
      expect(result.sendResults[0].status).toBe('sent');
      expect(result.seoScore).toBe(70);
    });
  });
});