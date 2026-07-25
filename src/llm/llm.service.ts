import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LlmAdapter } from './llm.interface';

@Injectable()
export class LlmService implements LlmAdapter {
  constructor(private config: ConfigService) {}

  async generate(prompt: string, options?: { maxTokens?: number }): Promise<string> {
    const apiKey = this.config.get('LLM_PROVIDER_API_KEY');
    const baseUrl = this.config.get('LLM_PROVIDER_BASE_URL');

    const response = await axios.post(
      `${baseUrl}/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: options?.maxTokens ?? 1000 },
      },
    );

    return response.data.candidates[0].content.parts[0].text;
  }
}