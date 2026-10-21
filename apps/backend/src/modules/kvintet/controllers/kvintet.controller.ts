import { OnboardedGuard } from '@/shared/auth/guards/onboarded.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('kvintet')
@ApiBearerAuth()
@UseGuards(OnboardedGuard)
@Controller('kvintets')
export class KvintetController {
  @Get('feed')
  @ApiOperation({
    summary: 'Get proposal feed',
    description:
      'Requires completed profile and questionnaire (OnboardedGuard)',
  })
  @ApiResponse({
    status: 200,
    description: 'Feed retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: onboarding is not complete',
  })
  async getFeed(): Promise<{ proposals: unknown[] }> {
    return { proposals: [] };
  }
}
