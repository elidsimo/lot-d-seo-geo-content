import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentGenerationRequestSchema, ContentGenerateLegacyRequestSchema } from '../common/schemas/content-request.schema';
import { ApiTags } from '@nestjs/swagger';


@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

// Route existante (CDC section 5) — maintenant validée
  @Post('generate')
  generate(@Body() body: unknown) {
    const parsed = ContentGenerateLegacyRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    return this.contentService.generate(
      parsed.data.type,
      parsed.data.sujet,
      parsed.data.ton,
    );
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