import { Module } from '@nestjs/common';
import { BrandParametersClientService } from './brand-parameters-client.service';

@Module({
  providers: [BrandParametersClientService],
  exports: [BrandParametersClientService],
})
export class BrandParametersClientModule {}