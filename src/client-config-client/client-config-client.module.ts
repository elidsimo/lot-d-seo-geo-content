import { Module } from '@nestjs/common';
import { ClientConfigClientService } from './client-config-client.service';

@Module({
  providers: [ClientConfigClientService],
  exports: [ClientConfigClientService],
})
export class ClientConfigClientModule {}