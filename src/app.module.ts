import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { SeoModule } from './seo/seo.module';
import { GeoModule } from './geo/geo.module';
import { ContentModule } from './content/content.module';
import { CorrectionsModule } from './corrections/corrections.module';
import { HistoryClientModule } from './history-client/history-client.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), LlmModule,SeoModule,GeoModule,ContentModule,CorrectionsModule,HistoryClientModule],
  
})
export class AppModule {}
