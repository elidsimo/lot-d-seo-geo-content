import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { SeoModule } from './seo/seo.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), LlmModule,SeoModule],
  
})
export class AppModule {}
