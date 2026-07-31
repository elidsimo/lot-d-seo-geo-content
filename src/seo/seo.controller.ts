import { Controller, Post, Param, Body, BadRequestException } from '@nestjs/common';
import { SeoService } from './seo.service';
import { CrawlFindingsSchema } from '../common/schemas/crawl-findings.schema';

@Controller('seo')
export class SeoController {
  constructor(private seoService: SeoService) {}

  @Post('audit/:siteId')
  audit(@Param('siteId') siteId: string, @Body() body: any) {
    const parseResult = CrawlFindingsSchema.safeParse(body);

    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Findings invalides reçus du Crawl Agent',
        errors: parseResult.error.issues,
      });
    }

    return this.seoService.auditOnPage(parseResult.data);
  }

  @Post('audit-technique/:siteId')
  auditTechnique(@Param('siteId') siteId: string, @Body() body: any) {
    return this.seoService.auditTechnique(body);
  }
}