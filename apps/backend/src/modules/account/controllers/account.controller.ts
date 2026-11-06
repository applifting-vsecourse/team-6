import { AccountService } from '@/modules/account/services/account.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Controller,
  Delete,
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
