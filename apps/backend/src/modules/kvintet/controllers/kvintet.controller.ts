import { KvintetService } from '@/modules/kvintet/services/kvintet.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeedItemDto } from './dto/feed-item.dto';
import { MembershipDto } from './dto/membership.dto';
import { StartedKvintetDto, StartKvintetDto } from './dto/start-kvintet.dto';

@ApiTags('kvintets')
@ApiCookieAuth()
@UseGuards(AuthenticatedUserGuard)
@Controller('kvintets')
export class KvintetController {
  constructor(private readonly service: KvintetService) {}

  @Get('membership')
  @ApiOperation({
    summary: 'Is the caller in a kvintet?',
    description:
      'Lets the UI tell members from everyone else; the feed itself answers 409 to members.',
  })
  membership(@User() user: Identity): Promise<MembershipDto> {
    return this.service.membership(user.id);
  }

  @Get('feed')
  @ApiOperation({
    summary: 'Open kvintets',
    description:
      'Kvintets that still have a free seat, newest first. Members appear by role and interests only. 409 if the caller is already in a kvintet.',
  })
  feed(@User() user: Identity): Promise<FeedItemDto[]> {
    return this.service.feed(user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Start a kvintet',
    description: 'Creates a kvintet with the caller as its first member.',
  })
  start(
    @User() user: Identity,
    @Body() dto: StartKvintetDto,
  ): Promise<StartedKvintetDto> {
    return this.service.start(user.id, {
      title: dto.title,
      categorySlug: dto.categorySlug,
      description: dto.description || null,
    });
  }

  @Post(':id/members')
  @HttpCode(204)
  @ApiOperation({ summary: 'Join a kvintet' })
  join(
    @User() user: Identity,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.service.join(user.id, id);
  }
}
