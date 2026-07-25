import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class ContentService {
  constructor(private llm: LlmService) {}

  async generate(type: 'article' | 'faq' | 'pillar_page', sujet: string, ton: string) {
    const prompt = `Génère un contenu de type "${type}" sur le sujet "${sujet}", avec un ton "${ton}".`;
    const contenu = await this.llm.generate(prompt);
    return { type, titre: sujet, contenu };
  }
}