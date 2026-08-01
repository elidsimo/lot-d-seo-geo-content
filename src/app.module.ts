import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { SeoModule } from './seo/seo.module';
import { GeoModule } from './geo/geo.module';
import { ContentModule } from './content/content.module';
import { CorrectionsModule } from './corrections/corrections.module';
import { HistoryClientModule } from './history-client/history-client.module';
import { RagModule } from './rag/rag.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LlmModule,
    SeoModule,
    GeoModule,
    ContentModule,
    CorrectionsModule,
    HistoryClientModule,
    RagModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}