import { AdminService } from '@/modules/admin/services/admin.service';
import { AdminGuard } from '@/shared/auth/guards/admin.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminStatsDto } from './dto/admin-stats.dto';

@ApiTags('admin')
@ApiCookieAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Aggregated pilot numbers' })
  @ApiOkResponse({ type: AdminStatsDto })
  @ApiUnauthorizedResponse({ description: 'Not signed in' })
  @ApiForbiddenResponse({ description: 'Not an admin' })
  getStats(): Promise<AdminStatsDto> {
    return this.adminService.getStats();
  }
}
