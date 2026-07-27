import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { LlmModule } from '../llm/llm.module';
import { RagController } from './rag.controller';

@Module({
  imports: [LlmModule],
  controllers: [RagController],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}

