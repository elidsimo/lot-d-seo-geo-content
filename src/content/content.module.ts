import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { LlmModule } from '../llm/llm.module';
import { BrandParametersClientModule } from '../brand-parameters-client/brand-parameters-client.module';

@Module({
  imports: [LlmModule, BrandParametersClientModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}