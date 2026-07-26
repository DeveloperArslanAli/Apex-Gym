import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, MemberStatus } from '@prisma/client';

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  async create(
    @Request() req: any,
    @Body() dto: { email: string; name: string; phone?: string; planId?: string },
  ) {
    return this.membersService.create({
      ...dto,
      gymId: req.user.gymId,
    });
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  async findAll(@Request() req: any, @Query('search') search?: string) {
    return this.membersService.findAll(req.user.gymId, search);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  async findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  async update(
    @Param('id') id: string,
    @Body() dto: { name?: string; phone?: string; status?: MemberStatus },
  ) {
    return this.membersService.update(id, dto);
  }

  @Post(':id/biometrics')
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  async registerBiometrics(
    @Param('id') id: string,
    @Body()
    dto: {
      type: 'FACE' | 'FINGERPRINT';
      templateVector?: number[];
      fingerprintIndex?: number;
      faceThumbnailUrl?: string;
    },
  ) {
    return this.membersService.registerBiometrics(id, dto);
  }

  @Post(':id/freeze')
  @Roles(Role.SUPER_ADMIN, Role.STAFF)
  async toggleFreeze(@Param('id') id: string) {
    return this.membersService.toggleFreeze(id);
  }
}
