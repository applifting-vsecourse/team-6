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
export class OnboardedGuard implements CanActivate {
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
      // 401: the caller is not signed in
      throw new UnauthorizedException();
    }

    request.session = session;

    const profile = await this.prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { onboardingCompletedAt: true },
    });

    if (!profile?.onboardingCompletedAt) {
      // 403: signed in, but profile / onboarding is not complete
      throw new ForbiddenException();
    }

    return true;
  }
}
