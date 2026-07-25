import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { SeoModule } from './seo/seo.module';
import { GeoModule } from './geo/geo.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), LlmModule,SeoModule,GeoModule],
  
})
export class AppModule {}
