import { Controller, Post, Body, ForbiddenException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RagService } from './rag.service';
import { ClientConfigClientService } from '../client-config-client/client-config-client.service';

@ApiTags('rag')
@Controller('rag')
export class RagController {
  constructor(
    private ragService: RagService,
    private clientConfigClient: ClientConfigClientService,
  ) {}

  @Post('index')
  async index(@Body() body: { clientId: string; texte: string }) {
    await this.assertRagEnabled(body.clientId);
    return this.ragService.indexDocument(body.clientId, body.texte);
  }

  @Post('search')
  async search(@Body() body: { clientId: string; requete: string }) {
    await this.assertRagEnabled(body.clientId);
    return this.ragService.search(body.clientId, body.requete);
  }

  @Post('retrieve')
  async retrieve(@Body() body: { query: string; clientId?: string }) {
    // Pas de verification de plan ici ,sans clientId, on interroge la base
    // documentaire generique (gratuite pour tous les clients).
    const context = await this.ragService.retrieveSeoKnowledge(body.query, body.clientId);
    return { context };
  }

  private async assertRagEnabled(clientId: string) {
    const config = await this.clientConfigClient.fetchClientConfig(clientId);
    if (!config.ragEnabled) {
      throw new ForbiddenException(
        "Le RAG SEO (fonctionnalité Premium) n'est pas activé pour le plan actuel de ce client.",
      );
    }
  }
}