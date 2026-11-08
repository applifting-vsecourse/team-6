import { ChatMessage } from '@/modules/chat/domain/message';
import { MessageService } from '@/modules/chat/services/message.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import { MemberGuard } from '@/shared/auth/guards/member.guard';
import { OnboardedGuard } from '@/shared/auth/guards/onboarded.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { MessageDto } from './dto/message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UnreadDto } from './dto/unread.dto';

const toDto = (message: ChatMessage): MessageDto => ({
  ...message,
  createdAt: message.createdAt.toISOString(),
});

@ApiTags('chat')
@ApiCookieAuth()
@UseGuards(AuthenticatedUserGuard, OnboardedGuard, MemberGuard)
@Controller('kvintets/mine/messages')
export class MessageController {
  constructor(private readonly service: MessageService) {}

  @SkipThrottle()
  @Get()
  @ApiOperation({
    summary: 'Messages of my kvintet',
    description:
      'Oldest to newest. No cursor returns the latest 50; `after=<id>` returns up to 100 newer messages (poll with the last id you have); `before=<id>` returns up to 50 older ones. Only members of an active kvintet can read.',
  })
  @ApiUnauthorizedResponse({ description: 'Not signed in' })
  @ApiForbiddenResponse({ description: 'Not a member of any kvintet' })
  @ApiConflictResponse({ description: 'The kvintet is not active yet' })
  async list(
    @User() user: Identity,
    @Query() query: ListMessagesQueryDto,
  ): Promise<MessageDto[]> {
    const messages = await this.service.list(user.id, query);
    return messages.map(toDto);
  }

  @SkipThrottle()
  @Get('unread')
  @ApiOperation({
    summary: 'Unread messages in my kvintet',
    description:
      "Messages from other members after the caller's read mark. `active: false` (count 0) while the kvintet is still forming, so a client can poll this without handling 409.",
  })
  @ApiUnauthorizedResponse({ description: 'Not signed in' })
  @ApiForbiddenResponse({ description: 'Not a member of any kvintet' })
  unread(@User() user: Identity): Promise<UnreadDto> {
    return this.service.unread(user.id);
  }

  @Post('read')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Mark messages of my kvintet as read',
    description:
      'Moves the read mark up to `lastMessageId`. It never moves backwards and is capped at the newest message.',
  })
  @ApiNoContentResponse({ description: 'Marked' })
  @ApiUnauthorizedResponse({ description: 'Not signed in' })
  @ApiForbiddenResponse({ description: 'Not a member of any kvintet' })
  @ApiConflictResponse({ description: 'The kvintet is not active yet' })
  async markRead(
    @User() user: Identity,
    @Body() dto: MarkReadDto,
  ): Promise<void> {
    await this.service.markRead(user.id, dto.lastMessageId);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post()
  @ApiOperation({
    summary: 'Send a message to my kvintet',
    description: 'Up to 1000 characters, plain text.',
  })
  @ApiUnauthorizedResponse({ description: 'Not signed in' })
  @ApiForbiddenResponse({ description: 'Not a member of any kvintet' })
  @ApiConflictResponse({ description: 'The kvintet is not active yet' })
  async send(
    @User() user: Identity,
    @Body() dto: SendMessageDto,
  ): Promise<MessageDto> {
    return toDto(await this.service.send(user.id, dto.body));
  }
}
