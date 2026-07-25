import { Module } from '@nestjs/common';
import { HistoryClientService } from './history-client.service';

@Module({
  providers: [HistoryClientService],
  exports: [HistoryClientService],
})
export class HistoryClientModule {}