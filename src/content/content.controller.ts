import { Controller, Post, Body } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Post('generate')
  generate(@Body() body: { type: 'article' | 'faq' | 'pillar_page'; sujet: string; ton: string }) {
    return this.contentService.generate(body.type, body.sujet, body.ton);
  }
}