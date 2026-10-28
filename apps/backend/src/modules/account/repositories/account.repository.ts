import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException({
          statusCode: 404,
          code: 'not_found',
          message: 'User not found',
        });
      }
      throw err;
    }
  }
}
