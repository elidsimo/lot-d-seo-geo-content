import {
  Controller,
  Post,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { CorrectionsService } from './corrections.service';
import { CorrectionsRequestSchema } from '../common/schemas/corrections-request.schema';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('corrections')
@Controller('corrections')
export class CorrectionsController {
  constructor(private correctionsService: CorrectionsService) {}

  @Post('propose/:pageUrl')
  async propose(@Param('pageUrl') pageUrl: string, @Body() body: unknown) {
    const parsed = CorrectionsRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }

    return this.correctionsService.propose(
      pageUrl,
      parsed.data.findings,
      parsed.data.pageContent,
    );
  }
}