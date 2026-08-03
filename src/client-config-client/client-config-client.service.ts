import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  ClientConfigSchema,
  ClientConfig,
} from '../common/schemas/client-config.schema';

const DEFAULT_CLIENT_CONFIG: ClientConfig = {
  plan: 'free',
  ragEnabled: false,
};

@Injectable()
export class ClientConfigClientService {
  private readonly logger = new Logger(ClientConfigClientService.name);
  private readonly maxRetries = 3;

  constructor(private config: ConfigService) {}

//    1  — fetch_client_config()

  async fetchClientConfig(clientId: string): Promise<ClientConfig> {
    if (this.config.get('MOCK_MODE') === 'true') {
      const mock: ClientConfig = { plan: 'pro', ragEnabled: true };
      console.log(`MOCK - configuration client simulee pour ${clientId}:`, mock);
      return mock;
    }

    const endpoint = this.config.get<string>('LOT_A_CLIENT_CONFIG_ENDPOINT') as string;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.get(`${endpoint}/${clientId}`);
        const parsed = ClientConfigSchema.safeParse(response.data);
        if (!parsed.success) {
          throw new Error('Format de reponse invalide du Lot A pour la configuration client');
        }
        return parsed.data;
      } catch (error) {
        this.logger.warn(
          `Tentative ${attempt}/${this.maxRetries} echouee pour le client ${clientId} : ${error.message}`,
        );

        if (attempt === this.maxRetries) {
          this.logger.error(
            `Echec definitif de la recuperation de la configuration pour ${clientId}, fallback sur 'free' sans RAG`,
          );
          return DEFAULT_CLIENT_CONFIG;
        }

        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
      }
    }

    return DEFAULT_CLIENT_CONFIG;
  }
}