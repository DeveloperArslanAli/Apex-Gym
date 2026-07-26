import { Module } from '@nestjs/common';
import { CheckInsService } from './check-ins.service';
import { CheckInsController } from './check-ins.controller';
import { CheckInsGateway } from './check-ins.gateway';

@Module({
  providers: [CheckInsService, CheckInsGateway],
  controllers: [CheckInsController],
  exports: [CheckInsService],
})
export class CheckInsModule {}
