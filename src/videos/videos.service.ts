import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  list(categoryId?: string) {
    return this.prisma.educationalVideo.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  }
}
