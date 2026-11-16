import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentOrigin, ContentType, NotificationType, Prisma, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { dueLabel } from '../common/business-days';
import { NotificationsService } from '../notifications/notifications.service';
import { SUBMISSION_STATUS_LABELS } from '../submissions/status-labels';
import {
  EmergencySubmissionPayload,
  TrackSubmissionPayload,
  VideoSubmissionPayload,
} from '../submissions/payload-types';
import { ChecklistDto } from './dto/checklist.dto';
import { RequestChangesDto } from './dto/request-changes.dto';
import { PreviewSubmitQuizDto } from './dto/preview-submit-quiz.dto';

const PASS_THRESHOLD = 70;

@Injectable()
export class AdminSubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(tab: 'pending' | 'done', type?: ContentType) {
    const statuses =
      tab === 'pending' ? [SubmissionStatus.IN_REVIEW] : [SubmissionStatus.PUBLISHED, SubmissionStatus.CHANGES_REQUESTED];

    const submissions = await this.prisma.contentSubmission.findMany({
      where: { status: { in: statuses }, ...(type && { type }) },
      include: { author: { include: { professionalProfile: true } } },
      orderBy: tab === 'pending' ? { dueAt: 'asc' } : { updatedAt: 'desc' },
    });

    const counts = await this.prisma.contentSubmission.groupBy({ by: ['status'], _count: true });
    const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));

    return {
      items: submissions.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        status: s.status,
        statusLabel: SUBMISSION_STATUS_LABELS[s.status],
        dueAt: s.dueAt,
        dueLabel: dueLabel(s.dueAt),
        author: {
          name: s.author.name,
          label: this.authorLabel(s.author.professionalProfile),
          verified: s.author.professionalProfile?.status === 'APPROVED',
        },
        updatedAt: s.updatedAt,
      })),
      counts: {
        pending: countMap[SubmissionStatus.IN_REVIEW] ?? 0,
        published: countMap[SubmissionStatus.PUBLISHED] ?? 0,
        changesRequested: countMap[SubmissionStatus.CHANGES_REQUESTED] ?? 0,
      },
    };
  }

  async getDetail(id: string) {
    const submission = await this.findOrThrow(id);
    return {
      id: submission.id,
      type: submission.type,
      title: submission.title,
      status: submission.status,
      statusLabel: SUBMISSION_STATUS_LABELS[submission.status],
      payload: submission.payload,
      checklist: submission.checklist,
      dueAt: submission.dueAt,
      dueLabel: dueLabel(submission.dueAt),
      previewTestedAt: submission.previewTestedAt,
    };
  }

  async preview(adminId: string, id: string) {
    const submission = await this.findOrThrow(id);

    await this.prisma.contentSubmission.update({ where: { id }, data: { previewTestedAt: new Date() } });
    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: 'SUBMISSION_PREVIEW', entity: 'ContentSubmission', entityId: id },
    });

    const previewId = `preview-${submission.id}`;

    if (submission.type === ContentType.EMERGENCY) {
      const payload = submission.payload as unknown as EmergencySubmissionPayload;
      const category = await this.prisma.category.findUnique({ where: { slug: payload.categorySlug } });
      return {
        id: previewId,
        isPreview: true,
        categoryId: category?.id ?? null,
        title: payload.title,
        summary: payload.summary ?? '',
        severityLevel: payload.severity,
        sourceReference: payload.sourceLabel,
        isOfflineAvailable: true,
        dontDoItems: payload.dontDo,
        category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
        steps: payload.steps.map((instruction, index) => ({
          id: `preview-step-${index}`,
          stepNumber: index + 1,
          title: `Passo ${index + 1}`,
          instruction,
          imageUrl: null,
          warningText: index === 0 ? payload.warningText ?? null : null,
        })),
      };
    }

    if (submission.type === ContentType.TRACK) {
      const payload = submission.payload as unknown as TrackSubmissionPayload;
      const category = payload.categorySlug ? await this.prisma.category.findUnique({ where: { slug: payload.categorySlug } }) : null;
      return {
        id: previewId,
        isPreview: true,
        categoryId: category?.id ?? null,
        title: payload.title,
        description: null,
        estimatedTimeMinutes: payload.estimatedMinutes,
        coverImageUrl: null,
        category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
        cards: payload.cards
          .filter((c) => c.title && c.text)
          .map((c, index) => ({ id: `preview-card-${index}`, orderIndex: index + 1, title: c.title, contentText: c.text, mediaUrl: null })),
        questions: payload.questions
          .filter((q) => q.statement && q.options.length === 4)
          .map((q, index) => ({
            id: `preview-question-${index}`,
            questionText: q.statement,
            explanation: q.explanation ?? '',
            options: q.options.map((text, optIndex) => ({ id: `preview-option-${index}-${optIndex}`, optionText: text })),
          })),
        progress: { isCompleted: false, score: 0, completedAt: null },
      };
    }

    const payload = submission.payload as unknown as VideoSubmissionPayload;
    const category = await this.prisma.category.findUnique({ where: { slug: payload.categorySlug } });
    return {
      id: previewId,
      isPreview: true,
      categoryId: category?.id ?? null,
      title: payload.title,
      youtubeVideoId: payload.youtubeVideoId,
      durationSeconds: payload.durationSeconds,
      description: null,
      thumbnailUrl: payload.youtubeVideoId ? `https://img.youtube.com/vi/${payload.youtubeVideoId}/hqdefault.jpg` : null,
      sourceReference: payload.sourceLabel,
      category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
    };
  }

  async previewSubmitQuiz(id: string, dto: PreviewSubmitQuizDto) {
    const submission = await this.findOrThrow(id);
    if (submission.type !== ContentType.TRACK) {
      throw new BadRequestException('Esta submissão não é uma trilha com quiz.');
    }

    const payload = submission.payload as unknown as TrackSubmissionPayload;
    const questions = payload.questions.filter((q) => q.statement && q.options.length === 4);

    let correctCount = 0;
    const feedback = dto.answers.map((answer) => {
      const question = questions[answer.questionIndex];
      const isCorrect = Boolean(question) && question.correctIndex === answer.optionIndex;
      if (isCorrect) correctCount += 1;
      return {
        questionIndex: answer.questionIndex,
        questionText: question?.statement ?? '',
        selectedOptionIndex: answer.optionIndex,
        correctOptionIndex: question?.correctIndex ?? -1,
        isCorrect,
        explanation: question?.explanation ?? '',
      };
    });

    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    return { score, passed: score >= PASS_THRESHOLD, correctCount, totalQuestions: questions.length, feedback };
  }

  async patchChecklist(id: string, dto: ChecklistDto) {
    const submission = await this.findOrThrow(id);
    const checklist = await this.prisma.contentSubmission.update({
      where: { id: submission.id },
      data: { checklist: dto as unknown as Prisma.InputJsonValue },
    });
    return { checklist: checklist.checklist };
  }

  async approve(adminId: string, id: string) {
    const submission = await this.findOrThrow(id);
    this.assertChecklistComplete(submission.checklist);

    const publishedEntityId = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.contentSubmission.updateMany({
        where: { id, status: SubmissionStatus.IN_REVIEW },
        data: { status: SubmissionStatus.PUBLISHED, reviewerId: adminId, reviewedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new ConflictException({ statusCode: 409, code: 'INVALID_STATUS', message: 'Esta submissão não está mais em revisão.' });
      }

      const entityId = await this.materialize(tx, submission.id, submission.type, submission.payload, submission.authorId, adminId);

      await tx.contentSubmission.update({ where: { id }, data: { publishedEntityId: entityId } });
      await tx.auditLog.create({
        data: { actorId: adminId, action: 'SUBMISSION_APPROVE', entity: 'ContentSubmission', entityId: id, meta: { publishedEntityId: entityId } },
      });

      return entityId;
    });

    await this.notifications.notify({
      userId: submission.authorId,
      type: NotificationType.SUBMISSION_PUBLISHED,
      title: 'Conteúdo publicado',
      body: `Seu conteúdo "${submission.title}" foi publicado.`,
      data: { submissionId: submission.id, contentType: submission.type },
    });

    return { id, status: SubmissionStatus.PUBLISHED, publishedEntityId };
  }

  async requestChanges(adminId: string, id: string, dto: RequestChangesDto) {
    await this.findOrThrow(id);

    const reviewNote = `${dto.reasons.join(', ')}. ${dto.note}`;
    const result = await this.prisma.contentSubmission.updateMany({
      where: { id, status: SubmissionStatus.IN_REVIEW },
      data: { status: SubmissionStatus.CHANGES_REQUESTED, changeReasons: dto.reasons, reviewNote, reviewerId: adminId, reviewedAt: new Date() },
    });

    if (result.count === 0) {
      throw new ConflictException({ statusCode: 409, code: 'INVALID_STATUS', message: 'Esta submissão não está mais em revisão.' });
    }

    const submission = await this.prisma.contentSubmission.findUniqueOrThrow({ where: { id } });

    await this.notifications.notify({
      userId: submission.authorId,
      type: NotificationType.SUBMISSION_CHANGES_REQUESTED,
      title: 'Ajustes solicitados',
      body: reviewNote,
      data: { submissionId: id, contentType: submission.type },
    });

    await this.prisma.auditLog.create({
      data: { actorId: adminId, action: 'SUBMISSION_REQUEST_CHANGES', entity: 'ContentSubmission', entityId: id, meta: { reasons: dto.reasons, note: dto.note } },
    });

    return { id, status: submission.status, reviewNote };
  }

  private async findOrThrow(id: string) {
    const submission = await this.prisma.contentSubmission.findUnique({ where: { id } });
    if (!submission) {
      throw new NotFoundException('Submissão não encontrada.');
    }
    return submission;
  }

  private assertChecklistComplete(checklist: unknown) {
    const c = (checklist ?? {}) as Partial<ChecklistDto>;
    const complete = c.matchesSource === true && c.safeForLaypeople === true && c.clearLanguage === true && c.notDuplicate === true;
    if (!complete) {
      throw new ConflictException({ statusCode: 409, code: 'CHECKLIST_INCOMPLETE', message: 'Complete os 4 itens do checklist clínico antes de aprovar.' });
    }
  }

  private authorLabel(profile: { council: string | null; registrationNumber: string | null; uf: string | null } | null) {
    if (!profile || !profile.council || !profile.registrationNumber || !profile.uf) {
      return null;
    }
    return `${profile.council} ${profile.registrationNumber}/${profile.uf}`;
  }

  private async materialize(
    tx: Prisma.TransactionClient,
    submissionId: string,
    type: ContentType,
    payloadJson: unknown,
    authorId: string,
    reviewedById: string,
  ): Promise<string> {
    const publishedAt = new Date();

    if (type === ContentType.EMERGENCY) {
      const payload = payloadJson as unknown as EmergencySubmissionPayload;
      const category = await tx.category.findUniqueOrThrow({ where: { slug: payload.categorySlug } });

      let relatedVideoId: string | null = null;
      if (payload.youtubeVideoId) {
        const existingVideo = await tx.educationalVideo.findFirst({ where: { youtubeVideoId: payload.youtubeVideoId } });
        relatedVideoId = existingVideo?.id ?? null;
      }

      const procedure = await tx.emergencyProcedure.create({
        data: {
          categoryId: category.id,
          title: payload.title,
          summary: payload.summary ?? '',
          severityLevel: payload.severity,
          sourceReference: payload.sourceLabel,
          dontDoItems: payload.dontDo ?? [],
          relatedVideoId,
          origin: ContentOrigin.PROFESSIONAL,
          authorId,
          reviewedById,
          publishedAt,
          submissionId,
        },
      });

      for (const [index, instruction] of payload.steps.entries()) {
        await tx.procedureStep.create({
          data: {
            procedureId: procedure.id,
            stepNumber: index + 1,
            title: `Passo ${index + 1}`,
            instruction,
            warningText: index === 0 ? payload.warningText ?? null : null,
          },
        });
      }

      return procedure.id;
    }

    if (type === ContentType.TRACK) {
      const payload = payloadJson as unknown as TrackSubmissionPayload;
      const category = payload.categorySlug ? await tx.category.findUnique({ where: { slug: payload.categorySlug } }) : null;

      const track = await tx.trainingTrack.create({
        data: {
          categoryId: category?.id,
          title: payload.title,
          estimatedTimeMinutes: payload.estimatedMinutes,
          origin: ContentOrigin.PROFESSIONAL,
          authorId,
          reviewedById,
          publishedAt,
          submissionId,
        },
      });

      let cardIndex = 0;
      for (const card of payload.cards) {
        if (!card.title || !card.text) continue;
        cardIndex += 1;
        await tx.trainingCard.create({
          data: { trackId: track.id, orderIndex: cardIndex, title: card.title, contentText: card.text, mediaUrl: null },
        });
      }

      for (const question of payload.questions) {
        if (!question.statement || question.options.length !== 4 || question.options.some((o) => !o)) continue;
        const createdQuestion = await tx.quizQuestion.create({
          data: { trackId: track.id, questionText: question.statement, explanation: question.explanation ?? '' },
        });
        for (const [optionIndex, optionText] of question.options.entries()) {
          await tx.quizOption.create({
            data: { questionId: createdQuestion.id, optionText, isCorrect: optionIndex === question.correctIndex },
          });
        }
      }

      return track.id;
    }

    const payload = payloadJson as unknown as VideoSubmissionPayload;
    const category = await tx.category.findUnique({ where: { slug: payload.categorySlug } });

    const video = await tx.educationalVideo.create({
      data: {
        categoryId: category?.id,
        title: payload.title,
        youtubeVideoId: payload.youtubeVideoId ?? '',
        durationSeconds: payload.durationSeconds ?? 0,
        sourceReference: payload.sourceLabel,
        thumbnailUrl: payload.youtubeVideoId ? `https://img.youtube.com/vi/${payload.youtubeVideoId}/hqdefault.jpg` : null,
        origin: ContentOrigin.PROFESSIONAL,
        authorId,
        reviewedById,
        publishedAt,
        submissionId,
      },
    });

    if (payload.linkedProcedureSlug) {
      const procedure = await tx.emergencyProcedure.findUnique({ where: { id: payload.linkedProcedureSlug } });
      if (procedure) {
        await tx.emergencyProcedure.update({ where: { id: procedure.id }, data: { relatedVideoId: video.id } });
      }
    }

    return video.id;
  }
}
