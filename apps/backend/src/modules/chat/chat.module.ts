import { PrismaModule } from '@/core/prisma/prisma.module';
import { MessageController } from '@/modules/chat/controllers/message.controller';
import { MessageRepository } from '@/modules/chat/repositories/message.repository';
import { MessageService } from '@/modules/chat/services/message.service';
import { AuthModule } from '@/shared/auth/auth.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MessageController],
  providers: [MessageService, MessageRepository],
})
export class ChatModule {}
