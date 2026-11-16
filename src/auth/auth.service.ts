import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import type { ProfessionalProfile, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const SALT_ROUNDS = 10;

const ROLE_LABELS: Record<Role, string> = {
  [Role.USER]: 'Cidadão Capacitado',
  [Role.HEALTH_PROFESSIONAL]: 'Profissional de Saúde',
  [Role.ADMIN]: 'Administrador Clínico',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const role = dto.role ?? Role.USER;
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role,
        ...(role === Role.HEALTH_PROFESSIONAL && {
          professionalProfile: {
            create: {
              registrationNumber: dto.professionalRegistration,
            },
          },
        }),
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.buildAuthResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { professionalProfile: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const { professionalProfile, ...rest } = user;
    return {
      ...this.sanitizeUser(rest),
      roleLabel: ROLE_LABELS[user.role],
      professional: this.buildProfessionalView(professionalProfile),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        avatarUrl: dto.avatarUrl,
      },
    });
    return this.sanitizeUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const currentPasswordMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!currentPasswordMatches) {
      throw new UnauthorizedException('Senha atual incorreta.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Senha alterada com sucesso.' };
  }

  private async buildAuthResponse(user: User) {
    let credentialStatus: string | null = null;
    if (user.role === Role.HEALTH_PROFESSIONAL) {
      const profile = await this.prisma.professionalProfile.findUnique({ where: { userId: user.id } });
      credentialStatus = profile?.status ?? null;
    }

    const payload = { sub: user.id, email: user.email, role: user.role, credentialStatus };

    const accessTokenExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTokenExpiresIn as unknown as number,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshTokenExpiresIn as unknown as number,
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  private sanitizeUser<T extends { passwordHash: string }>(user: T) {
    const { passwordHash: _passwordHash, ...rest } = user;
    return rest;
  }

  private buildProfessionalView(profile: ProfessionalProfile | null) {
    if (!profile) {
      return null;
    }
    const label =
      profile.council && profile.registrationNumber && profile.uf
        ? `${profile.council} ${profile.registrationNumber}/${profile.uf}`
        : profile.registrationNumber ?? null;

    return {
      council: profile.council,
      registrationNumber: profile.registrationNumber,
      uf: profile.uf,
      status: profile.status,
      label,
    };
  }
}
