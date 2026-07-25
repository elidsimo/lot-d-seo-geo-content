import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { LlmService } from './llm/llm.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly llmService: LlmService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('content/generate')
  async generateContent(
    @Body()
    body: { type: string; sujet: string; ton?: string },
  ): Promise<{ content: string }> {
    const prompt = `Type: ${body.type}\nSujet: ${body.sujet}\nTon: ${body.ton ?? 'professionnel'}\nRédige un contenu adapté.`;
    const content = await this.llmService.generate(prompt, { maxTokens: 1000 });

    return { content };
  }
}
