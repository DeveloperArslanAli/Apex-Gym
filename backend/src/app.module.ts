import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { PlansModule } from './plans/plans.module';
import { CheckInsModule } from './check-ins/check-ins.module';
import { MemberFeaturesModule } from './member-features/member-features.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MembersModule,
    PlansModule,
    CheckInsModule,
    MemberFeaturesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
