import { Module } from '@nestjs/common';
import { CorrectionsController } from './corrections.controller';
import { CorrectionsService } from './corrections.service';
import { SeoModule } from '../seo/seo.module';
import { GeoModule } from '../geo/geo.module';
import { HistoryClientModule } from '../history-client/history-client.module';

@Module({
  imports: [SeoModule, GeoModule, HistoryClientModule],
  controllers: [CorrectionsController],
  providers: [CorrectionsService],
})
export class CorrectionsModule {}