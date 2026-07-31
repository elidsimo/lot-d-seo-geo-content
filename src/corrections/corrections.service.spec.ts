import { Test, TestingModule } from '@nestjs/testing';
import { CorrectionsService } from './corrections.service';
import { SeoService } from '../seo/seo.service';
import { HistoryClientService } from '../history-client/history-client.service';

describe('CorrectionsService', () => {
  let service: CorrectionsService;

  const mockSeoService = {
    auditOnPage: jest.fn(),
  };

  const mockHistoryClientService = {
    sendProposition: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorrectionsService,
        { provide: SeoService, useValue: mockSeoService },
        { provide: HistoryClientService, useValue: mockHistoryClientService },
      ],
    }).compile();

    service = module.get<CorrectionsService>(CorrectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send one proposition per recommendation', async () => {
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
    });

    expect(mockHistoryClientService.sendProposition).toHaveBeenCalledTimes(1);
    expect(result.propositions[0].champ).toBe('meta_title');
    expect(result.score).toBe(70);
  });
});