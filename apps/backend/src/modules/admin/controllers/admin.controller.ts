import { ExportDataset } from '@/modules/admin/domain/admin-export';
import { AdminService } from '@/modules/admin/services/admin.service';
import { AdminGuard } from '@/shared/auth/guards/admin.guard';
import {
  Controller,
  Get,
  Header,
  Param,
  ParseEnumPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
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

  @Get('export/:dataset')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({
    summary: 'Matching data as CSV, with users replaced by a pseudonym',
  })
  @ApiParam({ name: 'dataset', enum: ExportDataset })
  @ApiOkResponse({ description: 'CSV file', type: String })
  @ApiUnauthorizedResponse({ description: 'Not signed in' })
  @ApiForbiddenResponse({ description: 'Not an admin' })
  exportCsv(
    @Param('dataset', new ParseEnumPipe(ExportDataset)) dataset: ExportDataset,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="kvintet-${dataset}.csv"`,
    );
    return this.adminService.exportCsv(dataset);
  }
}
