import { Test, TestingModule } from '@nestjs/testing';
import { CorrectionsService } from './corrections.service';
import { SeoService } from '../seo/seo.service';
import { HistoryClientService } from '../history-client/history-client.service';

describe('CorrectionsService', () => {
  let service: CorrectionsService;

  const mockSeoService = {
    auditPage: jest.fn(),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should audit the page and send one proposition per problem found', async () => {
    mockSeoService.auditPage.mockReturnValue({
      url: 'https://example.com',
      problemes: ['Title manquant ou trop long (> 60 caractères)'],
    });
    mockHistoryClientService.sendProposition.mockResolvedValue({
      success: true,
    });

    const result = await service.propose('https://example.com', {
      url: 'https://example.com',
      title: '',
      metaDescription: 'ok',
      h1: ['ok'],
    });

    expect(mockSeoService.auditPage).toHaveBeenCalledTimes(1);
    expect(mockHistoryClientService.sendProposition).toHaveBeenCalledTimes(1);
    expect(result.pageUrl).toBe('https://example.com');
    expect(result.propositions).toHaveLength(1);
    expect(result.propositions[0].champ).toBe('meta_title');
  });

  it('should send one proposition per problem when there are several problems', async () => {
    mockSeoService.auditPage.mockReturnValue({
      url: 'https://example.com',
      problemes: ['Title manquant', 'Meta description manquante'],
    });
    mockHistoryClientService.sendProposition.mockResolvedValue({
      success: true,
    });

    const result = await service.propose('https://example.com', {
      url: 'https://example.com',
      title: '',
      metaDescription: '',
      h1: ['ok'],
    });

    expect(mockHistoryClientService.sendProposition).toHaveBeenCalledTimes(2);
    expect(result.propositions).toHaveLength(2);
  });

  it('should send zero propositions when the page has no issues', async () => {
    mockSeoService.auditPage.mockReturnValue({
      url: 'https://example.com',
      problemes: [],
    });

    const result = await service.propose('https://example.com', {
      url: 'https://example.com',
      title: 'Un titre correct',
      metaDescription: 'Une description correcte et suffisamment longue.',
      h1: ['ok'],
    });

    expect(mockHistoryClientService.sendProposition).not.toHaveBeenCalled();
    expect(result.propositions).toHaveLength(0);
  });
});