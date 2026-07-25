import { Controller, Post, Param, Body } from '@nestjs/common';
import { SeoService } from './seo.service';

@Controller('seo')
export class SeoController {
  constructor(private seoService: SeoService) {}

  @Post('audit/:siteId')
  audit(@Param('siteId') siteId: string, @Body() body: any) {
    return this.seoService.auditPage(body);
  }
}