import { KvintetService } from '@/modules/kvintet/services/kvintet.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import { MemberGuard } from '@/shared/auth/guards/member.guard';
import { OnboardedGuard } from '@/shared/auth/guards/onboarded.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FeedItemDto } from './dto/feed-item.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { KvintetDetailsDto } from './dto/kvintet-details.dto';
import { MembershipDto } from './dto/membership.dto';
import { StartedKvintetDto, StartKvintetDto } from './dto/start-kvintet.dto';

@ApiTags('kvintets')
@ApiCookieAuth()
@UseGuards(AuthenticatedUserGuard, OnboardedGuard)
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
      'Kvintets that still have a free seat, newest first, optionally only one category. Members appear by role and interests only. 400 for an unknown category, 409 if the caller is already in a kvintet.',
  })
  feed(
    @User() user: Identity,
    @Query() query: FeedQueryDto,
  ): Promise<FeedItemDto[]> {
    return this.service.feed(user.id, query.category);
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

  @Get('mine')
  @UseGuards(MemberGuard)
  @ApiOperation({
    summary: 'Get my kvintet',
    description:
      'Returns details of the kvintet or proposal the caller belongs to.',
  })
  @ApiOkResponse({ type: KvintetDetailsDto })
  @ApiUnauthorizedResponse({ description: 'Not signed in' })
  @ApiForbiddenResponse({ description: 'Not a member of any kvintet' })
  async getMyKvintet(@User() user: Identity): Promise<KvintetDetailsDto> {
    const details = await this.service.getMyKvintet(user.id);
    return {
      ...details,
      createdAt: details.createdAt.toISOString(),
      activatedAt: details.activatedAt
        ? details.activatedAt.toISOString()
        : null,
    };
  }

  @Post('mine/vote')
  @UseGuards(MemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vote to start kvintet',
    description:
      'Casts a vote to start the kvintet now. Only available in proposals with 3-4 members.',
  })
  @ApiOkResponse({ type: KvintetDetailsDto })
  @ApiUnauthorizedResponse({ description: 'Not signed in' })
  @ApiForbiddenResponse({ description: 'Not a member of any kvintet' })
  async vote(@User() user: Identity): Promise<KvintetDetailsDto> {
    const details = await this.service.vote(user.id);
    return {
      ...details,
      createdAt: details.createdAt.toISOString(),
      activatedAt: details.activatedAt
        ? details.activatedAt.toISOString()
        : null,
    };
  }

  @Delete('mine/membership')
  @UseGuards(MemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Leave kvintet',
    description: 'Leaves the current kvintet or proposal.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { success: { type: 'boolean', example: true } },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not signed in' })
  @ApiForbiddenResponse({ description: 'Not a member of any kvintet' })
  async leave(@User() user: Identity): Promise<{ success: boolean }> {
    return this.service.leave(user.id);
  }
}
