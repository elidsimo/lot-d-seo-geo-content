import {
  Controller,
  Post,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { GeoService } from './geo.service';
import { GeoOptimizeRequestSchema } from '../common/schemas/geo-request.schema';

@Controller('geo')
export class GeoController {
  constructor(private geoService: GeoService) {}

  @Post('optimize/:pageId')
  async optimize(@Param('pageId') pageId: string, @Body() body: unknown) {
    const parsed = GeoOptimizeRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    const result = await this.geoService.optimizeForAiEngines(
      parsed.data.content,
      parsed.data.existingFaq,
    );
    return { pageId, ...result };
  }

  @Post('faq-quality/:pageId')
  async faqQuality(@Param('pageId') pageId: string, @Body() body: unknown) {
    const parsed = GeoOptimizeRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    const result = await this.geoService.analyzeFaqQuality(
      parsed.data.content,
      parsed.data.existingFaq,
    );
    return { pageId, ...result };
  }

  @Post('entities/:pageId')
  async entities(@Param('pageId') pageId: string, @Body() body: unknown) {
    const parsed = GeoOptimizeRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    const entities = await this.geoService.enrichEntities(parsed.data.content);
    return { pageId, entities };
  }
}