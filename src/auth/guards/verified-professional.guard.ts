import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { CredentialStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../decorators/current-user.decorator';

/**
 * Must run after JwtAuthGuard. Checks the LIVE credential status in the
 * database rather than the JWT claim, since an access token issued before
 * an admin approval/rejection must not grant (or keep granting) authoring
 * rights until the user logs in again.
 */
@Injectable()
export class VerifiedProfessionalGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;

    if (!user || user.role !== Role.HEALTH_PROFESSIONAL) {
      throw this.notVerified();
    }

    const profile = await this.prisma.professionalProfile.findUnique({ where: { userId: user.userId } });
    if (!profile || profile.status !== CredentialStatus.APPROVED) {
      throw this.notVerified();
    }

    return true;
  }

  private notVerified() {
    return new ForbiddenException({
      statusCode: 403,
      code: 'PROFESSIONAL_NOT_VERIFIED',
      message: 'Seu registro profissional ainda não foi verificado e aprovado para criação de conteúdo.',
    });
  }
}
