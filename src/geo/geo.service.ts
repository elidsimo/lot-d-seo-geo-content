import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class GeoService {
  constructor(private llm: LlmService) {}

  async optimizePage(pageContent: string) {
    const prompt = `Reformule ce contenu pour qu'il soit clair, structuré, et facilement citable par des assistants IA (ChatGPT, Gemini, Claude, Perplexity). Ajoute 3 questions FAQ pertinentes.\n\nContenu:\n${pageContent}`;
    const result = await this.llm.generate(prompt);
    return { optimizedContent: result };
  }
}