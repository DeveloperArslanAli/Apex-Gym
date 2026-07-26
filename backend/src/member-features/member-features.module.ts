import { Module } from '@nestjs/common';
import { MemberFeaturesService } from './member-features.service';
import { MemberFeaturesController } from './member-features.controller';

@Module({
  providers: [MemberFeaturesService],
  controllers: [MemberFeaturesController],
  exports: [MemberFeaturesService],
})
export class MemberFeaturesModule {}
