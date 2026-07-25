import { Controller, Post, Param, Body } from '@nestjs/common';
import { CorrectionsService } from './corrections.service';

@Controller('corrections')
export class CorrectionsController {
  constructor(private correctionsService: CorrectionsService) {}

  @Post('propose/:pageUrl')
  propose(@Param('pageUrl') pageUrl: string, @Body() body: { findings: any }) {
    return this.correctionsService.propose(pageUrl, body.findings);
  }
}