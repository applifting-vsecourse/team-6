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
export class AdminGuard implements CanActivate {
  constructor(@InjectBetterAuth private readonly betterAuth: BetterAuth) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const session =
      request.session ??
      (await getSessionFromRequest(request, this.betterAuth));

    if (!session) {
      throw new UnauthorizedException();
    }

    request.session = session;

    if (session.user.role !== 'admin') {
      throw new ForbiddenException({
        code: 'ADMIN_REQUIRED',
        message: 'Only an admin can access this resource',
      });
    }

    return true;
  }
}
