import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentGenerationRequestSchema } from '../common/schemas/content-request.schema';

@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Post('generate')
  generate(
    @Body() body: { type: 'article' | 'faq' | 'pillar_page'; sujet: string; ton: string },
  ) {
    return this.contentService.generate(body.type, body.sujet, body.ton);
  }

  // Nouvelles routes dédiées utilisent fetchBrandParameters
  @Post('article')
  async article(@Body() body: unknown) {
    const parsed = ContentGenerationRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    return this.contentService.generateArticle(parsed.data.sujet, parsed.data.clientId);
  }

  @Post('faq')
  async faq(@Body() body: unknown) {
    const parsed = ContentGenerationRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    return this.contentService.generateFaq(parsed.data.sujet, parsed.data.clientId);
  }

  @Post('pillar-page')
  async pillarPage(@Body() body: unknown) {
    const parsed = ContentGenerationRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    return this.contentService.generatePillarPage(parsed.data.sujet, parsed.data.clientId);
  }
}