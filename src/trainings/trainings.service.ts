import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { withProvenance } from '../common/content-provenance';

const PASS_THRESHOLD = 70;
const AUTHOR_INCLUDE = { author: { select: { name: true, professionalProfile: { select: { council: true, registrationNumber: true, uf: true } } } } };

@Injectable()
export class TrainingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTracks(userId: string) {
    const tracks = await this.prisma.trainingTrack.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { title: 'asc' },
      include: {
        category: true,
        userProgress: { where: { userId } },
        _count: { select: { cards: true, questions: true } },
        ...AUTHOR_INCLUDE,
      },
    });

    return tracks.map((track) => {
      const { userProgress, _count, ...rest } = track;
      return {
        ...withProvenance(rest),
        cardCount: _count.cards,
        questionCount: _count.questions,
        progress: userProgress[0] ?? { isCompleted: false, score: 0, completedAt: null },
      };
    });
  }

  async getTrack(id: string, userId: string) {
    const track = await this.prisma.trainingTrack.findUnique({
      where: { id },
      include: {
        category: true,
        cards: { orderBy: { orderIndex: 'asc' } },
        questions: {
          orderBy: { createdAt: 'asc' },
          include: {
            options: {
              select: { id: true, questionId: true, optionText: true },
            },
          },
        },
        userProgress: { where: { userId } },
        ...AUTHOR_INCLUDE,
      },
    });

    if (!track || !track.publishedAt) {
      throw new NotFoundException('Trilha de treinamento não encontrada.');
    }

    const { userProgress, ...rest } = track;
    return {
      ...withProvenance(rest),
      progress: userProgress[0] ?? { isCompleted: false, score: 0, completedAt: null },
    };
  }

  async submitQuiz(trackId: string, userId: string, dto: SubmitQuizDto) {
    const track = await this.prisma.trainingTrack.findUnique({ where: { id: trackId } });
    if (!track || !track.publishedAt) {
      throw new NotFoundException('Trilha de treinamento não encontrada.');
    }

    const questions = await this.prisma.quizQuestion.findMany({
      where: { trackId },
      include: { options: true },
    });

    if (questions.length === 0) {
      throw new NotFoundException('Trilha de treinamento não encontrada ou sem perguntas.');
    }

    const answeredQuestionIds = new Set(dto.answers.map((a) => a.questionId));
    const missing = questions.filter((q) => !answeredQuestionIds.has(q.id));
    if (missing.length > 0) {
      throw new BadRequestException('Todas as perguntas da trilha devem ser respondidas.');
    }

    let correctCount = 0;
    const feedback = dto.answers.map((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      const correctOption = question?.options.find((o) => o.isCorrect);
      const selectedOption = question?.options.find((o) => o.id === answer.optionId);
      const isCorrect = Boolean(selectedOption?.isCorrect);
      if (isCorrect) {
        correctCount += 1;
      }

      return {
        questionId: answer.questionId,
        questionText: question?.questionText ?? '',
        selectedOptionId: answer.optionId,
        correctOptionId: correctOption?.id ?? '',
        isCorrect,
        explanation: question?.explanation ?? '',
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= PASS_THRESHOLD;

    const progress = await this.prisma.userTrainingProgress.upsert({
      where: { userId_trackId: { userId, trackId } },
      create: { userId, trackId, score, isCompleted: passed, completedAt: new Date() },
      update: { score, isCompleted: passed, completedAt: new Date() },
    });

    return {
      score,
      passed,
      correctCount,
      totalQuestions: questions.length,
      feedback,
      progress,
    };
  }
}
