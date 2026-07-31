import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Proposition } from '../common/schemas/proposition.schema';

@Injectable()
export class HistoryClientService {
  private readonly logger = new Logger(HistoryClientService.name);
  private readonly maxRetries = 3;

  constructor(private config: ConfigService) {}

  async sendProposition(pageUrl: string, proposition: Proposition) {
    if (this.config.get('MOCK_MODE') === 'true') {
      console.log('MOCK - proposition non envoyée réellement:', proposition);
      return { status: 'proposée', mock: true };
    }

    const endpoint = this.config.get<string>('LOT_A_HISTORY_ENDPOINT') as string;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post(endpoint, {
          pageUrl,
          ...proposition,
          statut: 'proposée',
        });
        return response.data;
      } catch (error) {
        this.logger.warn(
          `Tentative ${attempt}/${this.maxRetries} échouée pour ${pageUrl} : ${error.message}`,
        );

        if (attempt === this.maxRetries) {
          this.logger.error(`Échec définitif de l'envoi au Lot A pour ${pageUrl}`);
          throw new Error(
            `Impossible d'envoyer la proposition au Lot A après ${this.maxRetries} tentatives`,
          );
        }

        // Attente croissante avant nouvelle tentative (backoff exponentiel) : 500ms, 1000ms, 2000ms...
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
      }
    }
  }
}