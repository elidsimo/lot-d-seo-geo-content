import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  BrandParametersSchema,
  BrandParameters,
} from '../common/schemas/brand-parameters.schema';

const DEFAULT_BRAND_PARAMETERS: BrandParameters = {
  ton: 'neutre',
  style: 'standard',
  contraintes: [],
};

@Injectable()
export class BrandParametersClientService {
  private readonly logger = new Logger(BrandParametersClientService.name);
  private readonly maxRetries = 3;

  constructor(private config: ConfigService) {} 
   
// Récupère le ton, le style et les contraintes de marque d'un client ,depuis le Lot A. En cas d'échec après plusieurs tentatives, retombe
  async fetchBrandParameters(clientId: string): Promise<BrandParameters> {
    if (this.config.get('MOCK_MODE') === 'true') {
      const mock: BrandParameters = {
        ton: 'professionnel',
        style: 'clair et concis',
        contraintes: ['Ne jamais promettre un résultat garanti en SEO'],
      };
      console.log(
        `MOCK - parametres de marque simules pour le client ${clientId}:`,
        mock,
      );
      return mock;
    }

    const endpoint = this.config.get<string>(
      'LOT_A_BRAND_PARAMETERS_ENDPOINT',
    ) as string;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.get(`${endpoint}/${clientId}`);
        const parsed = BrandParametersSchema.safeParse(response.data);
        if (!parsed.success) {
          throw new Error(
            'Format de reponse invalide du Lot A pour les parametres de marque',
          );
        }
        return parsed.data;
      } catch (error) {
        this.logger.warn(
          `Tentative ${attempt}/${this.maxRetries} echouee pour le client ${clientId} : ${error.message}`,
        );

        if (attempt === this.maxRetries) {
          this.logger.error(
            `Echec definitif de la recuperation des parametres de marque pour ${clientId}, utilisation des valeurs par defaut`,
          );
          return DEFAULT_BRAND_PARAMETERS;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 500 * 2 ** (attempt - 1)),
        );
      }
    }

    return DEFAULT_BRAND_PARAMETERS;
  }
}