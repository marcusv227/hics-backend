import { ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { addBusinessDays, dueLabel } from '../common/business-days';
import { validateSubmissionPayload } from './payload-validation';
import { SUBMISSION_STATUS_LABELS } from './status-labels';
import { CreateSubmissionDto, SubmissionAction } from './dto/create-submission.dto';

const SUBMIT_DUE_BUSINESS_DAYS = 3;

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, dto: CreateSubmissionDto) {
    const categorySlugs = await this.getCategorySlugs();
    const mode = dto.action === SubmissionAction.SUBMIT ? 'SUBMIT' : 'DRAFT';
    const { missing, normalized } = validateSubmissionPayload(dto.type, dto.payload, mode, categorySlugs);

    if (mode === 'SUBMIT' && missing.length > 0) {
      throw new UnprocessableEntityException({ statusCode: 422, code: 'SUBMISSION_INVALID', missing });
    }

    const title = (normalized.title as string) || 'Sem título';
    const isSubmitting = mode === 'SUBMIT';
    const submittedAt = isSubmitting ? new Date() : null;
    const dueAt = isSubmitting ? addBusinessDays(new Date(), SUBMIT_DUE_BUSINESS_DAYS) : null;

    const submission = await this.prisma.contentSubmission.create({
      data: {
        type: dto.type,
        status: isSubmitting ? SubmissionStatus.IN_REVIEW : SubmissionStatus.DRAFT,
        title,
        payload: normalized as Prisma.InputJsonValue,
        authorId,
        submittedAt,
        dueAt,
      },
    });

    return this.serializeDetail(submission);
  }

  async listMine(authorId: string, status?: SubmissionStatus) {
    const submissions = await this.prisma.contentSubmission.findMany({
      where: { authorId, ...(status && { status }) },
      orderBy: { updatedAt: 'desc' },
    });

    const counts = await this.prisma.contentSubmission.groupBy({
      by: ['status'],
      where: { authorId },
      _count: true,
    });
    const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));

    return {
      items: submissions.map((s) => this.serializeListItem(s)),
      counts: {
        drafts: (countMap[SubmissionStatus.DRAFT] ?? 0) + (countMap[SubmissionStatus.CHANGES_REQUESTED] ?? 0),
        inReview: countMap[SubmissionStatus.IN_REVIEW] ?? 0,
        published: countMap[SubmissionStatus.PUBLISHED] ?? 0,
      },
    };
  }

  async getMine(authorId: string, id: string) {
    const submission = await this.prisma.contentSubmission.findUnique({ where: { id } });
    if (!submission) {
      throw new NotFoundException('Conteúdo não encontrado.');
    }
    if (submission.authorId !== authorId) {
      throw new ForbiddenException('Você não tem acesso a este conteúdo.');
    }
    return this.serializeDetail(submission);
  }

  private async getCategorySlugs(): Promise<Set<string>> {
    const categories = await this.prisma.category.findMany({ select: { slug: true } });
    return new Set(categories.map((c) => c.slug));
  }

  private serializeListItem(submission: {
    id: string;
    type: string;
    title: string;
    status: SubmissionStatus;
    updatedAt: Date;
    reviewNote: string | null;
  }) {
    return {
      id: submission.id,
      type: submission.type,
      title: submission.title,
      status: submission.status,
      statusLabel: SUBMISSION_STATUS_LABELS[submission.status],
      date: submission.updatedAt,
      reviewNote: submission.reviewNote,
    };
  }

  private serializeDetail(submission: {
    id: string;
    type: string;
    title: string;
    status: SubmissionStatus;
    payload: unknown;
    reviewNote: string | null;
    changeReasons: string[];
    publishedEntityId: string | null;
    dueAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: submission.id,
      type: submission.type,
      title: submission.title,
      status: submission.status,
      statusLabel: SUBMISSION_STATUS_LABELS[submission.status],
      payload: submission.payload,
      reviewNote: submission.reviewNote,
      changeReasons: submission.changeReasons,
      publishedEntityId: submission.publishedEntityId,
      dueAt: submission.dueAt,
      dueLabel: dueLabel(submission.dueAt),
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }
}
