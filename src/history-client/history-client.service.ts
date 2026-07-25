import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Proposition } from '../common/schemas/proposition.schema';

@Injectable()
export class HistoryClientService {
  constructor(private config: ConfigService) {}

  async sendProposition(pageUrl: string, proposition: Proposition) {
    if (this.config.get('MOCK_MODE') === 'true') {
      console.log('MOCK - proposition non envoyée réellement:', proposition);
      return { status: 'proposée', mock: true };
    }
    const response = await axios.post(this.config.get<string>('LOT_A_HISTORY_ENDPOINT') as string, {
      pageUrl,
      ...proposition,
      statut: 'proposée',
    });
    return response.data;
  }
}