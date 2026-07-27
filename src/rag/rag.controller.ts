import { Controller, Post, Body } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(private ragService: RagService) {}

  @Post('index')
  index(@Body() body: { clientId: string; texte: string }) {
    return this.ragService.indexDocument(body.clientId, body.texte);
  }

  @Post('search')
  search(@Body() body: { clientId: string; requete: string }) {
    return this.ragService.search(body.clientId, body.requete);
  }
}