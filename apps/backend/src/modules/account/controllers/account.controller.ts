import { AccountService } from '@/modules/account/services/account.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('account')
@ApiCookieAuth()
@UseGuards(AuthenticatedUserGuard)
@Controller('me')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('export')
  @Header('Content-Type', 'application/json; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="kvintet-my-data.json"')
  @ApiOperation({
    summary: 'Download my data',
    description:
      'Everything held about the caller as JSON: account, sessions, profile, membership, own messages and matching-data rows (GDPR Art. 15 and 20)',
  })
  @ApiOkResponse({ description: 'JSON file' })
  @ApiUnauthorizedResponse({ description: 'Not signed in' })
  exportData(@User() user: Identity): Promise<Record<string, unknown>> {
    return this.accountService.exportData(user.id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete current user account',
    description:
      'Atomically leaves any current kvintet, deletes the user account, and cascades related records',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { success: { type: 'boolean', example: true } },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not signed in' })
  async deleteAccount(@User() user: Identity): Promise<{ success: boolean }> {
    await this.accountService.deleteAccount(user.id);
    return { success: true };
  }
}
