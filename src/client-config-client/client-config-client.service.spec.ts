import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ClientConfigClientService } from './client-config-client.service';

describe('ClientConfigClientService', () => {
  let service: ClientConfigClientService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientConfigClientService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ClientConfigClientService>(ClientConfigClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a mocked config when MOCK_MODE is true', async () => {
    mockConfigService.get.mockImplementation((key: string) =>
      key === 'MOCK_MODE' ? 'true' : undefined,
    );

    const config = await service.fetchClientConfig('client-1');

    expect(config).toEqual({ plan: 'pro', ragEnabled: true });
  });
});