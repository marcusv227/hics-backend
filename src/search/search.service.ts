import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(term: string) {
    const query = term.trim();
    if (!query) {
      return { procedures: [], tracks: [], videos: [] };
    }

    const [procedures, tracks, videos] = await Promise.all([
      this.prisma.emergencyProcedure.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { category: true },
        take: 20,
      }),
      this.prisma.trainingTrack.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 20,
      }),
      this.prisma.educationalVideo.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 20,
      }),
    ]);

    return { procedures, tracks, videos };
  }
}
