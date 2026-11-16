import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { withProvenance } from '../common/content-provenance';

const AUTHOR_INCLUDE = { author: { select: { name: true, professionalProfile: { select: { council: true, registrationNumber: true, uf: true } } } } };

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  async list(categoryId?: string) {
    const videos = await this.prisma.educationalVideo.findMany({
      where: { publishedAt: { not: null }, ...(categoryId && { categoryId }) },
      orderBy: { createdAt: 'desc' },
      include: { category: true, ...AUTHOR_INCLUDE },
    });

    return videos.map(withProvenance);
  }
}
