import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListEmergenciesQueryDto } from './dto/list-emergencies-query.dto';

@Injectable()
export class EmergenciesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { procedures: true } } },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      iconUrl: category.iconUrl,
      procedureCount: category._count.procedures,
    }));
  }

  async list(query: ListEmergenciesQueryDto) {
    const where: Prisma.EmergencyProcedureWhereInput = {
      categoryId: query.categoryId,
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { summary: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.prisma.emergencyProcedure.findMany({
      where,
      orderBy: { title: 'asc' },
      include: { category: true },
    });
  }

  async getGuide(id: string) {
    const procedure = await this.prisma.emergencyProcedure.findUnique({
      where: { id },
      include: {
        category: true,
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    if (!procedure) {
      throw new NotFoundException('Procedimento de emergência não encontrado.');
    }

    return procedure;
  }
}
