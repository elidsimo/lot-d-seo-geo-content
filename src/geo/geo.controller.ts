import { Controller, Post, Param, Body } from '@nestjs/common';
import { GeoService } from './geo.service';

@Controller('geo')
export class GeoController {
  constructor(private geoService: GeoService) {}

  @Post('optimize/:pageId')
  optimize(@Param('pageId') pageId: string, @Body() body: { content: string }) {
    return this.geoService.optimizePage(body.content);
  }
}