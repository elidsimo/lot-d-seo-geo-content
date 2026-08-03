import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { LlmModule } from '../llm/llm.module';
import { RagController } from './rag.controller';
import { ClientConfigClientModule } from '../client-config-client/client-config-client.module';

@Module({
  imports: [LlmModule, ClientConfigClientModule],
  controllers: [RagController],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}