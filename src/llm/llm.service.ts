import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LlmAdapter } from './llm.interface';

@Injectable()
export class LlmService implements LlmAdapter {
  constructor(private config: ConfigService) {}

  async generate(
    prompt: string,
    options?: { maxTokens?: number },
  ): Promise<string> {
    const apiKey = this.config.get('LLM_PROVIDER_API_KEY');
    const baseUrl = this.config.get('LLM_PROVIDER_BASE_URL');
    const model = this.config.get('LLM_PROVIDER_MODEL') ?? 'gemini-2.5-flash';

    if (!apiKey) {
      throw new HttpException(
        'LLM_PROVIDER_API_KEY is missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!baseUrl) {
      throw new HttpException(
        'LLM_PROVIDER_BASE_URL is missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const response = await axios.post(
        `${baseUrl.replace(/\/$/, '')}/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: options?.maxTokens ?? 1000 },
        },
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new HttpException(
          'Unexpected Gemini response format',
          HttpStatus.BAD_GATEWAY,
        );
      }

      return text;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? HttpStatus.BAD_GATEWAY;
        const message =
          (error.response?.data as { error?: { message?: string } } | undefined)
            ?.error?.message ?? error.message;

        throw new HttpException(
          `Gemini API error: ${message}`,
          status,
        );
      }

      throw error;
    }
  }
}