import { PrismaService } from '@/core/prisma/prisma.service';
import {
  BetterAuth,
  InjectBetterAuth,
} from '@/shared/auth/providers/better-auth.provider';
import { getSessionFromRequest } from '@/shared/auth/utils/get-session-from-request';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class MemberGuard implements CanActivate {
  constructor(
    @InjectBetterAuth private readonly betterAuth: BetterAuth,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const session =
      request.session ??
      (await getSessionFromRequest(request, this.betterAuth));

    if (!session) {
      throw new UnauthorizedException();
    }

    request.session = session;

    const membership = await this.prisma.kvintetMember.findUnique({
      where: { userId: session.user.id },
      include: { kvintet: true },
    });

    if (!membership) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'forbidden',
        message: 'Caller is not a member of any kvintet',
      });
    }

    request.kvintetMember = membership;
    return true;
  }
}
