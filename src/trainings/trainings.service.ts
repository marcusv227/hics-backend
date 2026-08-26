import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@Injectable()
export class TrainingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTracks(userId: string) {
    const tracks = await this.prisma.trainingTrack.findMany({
      orderBy: { title: 'asc' },
      include: {
        category: true,
        userProgress: { where: { userId } },
        _count: { select: { cards: true, questions: true } },
      },
    });

    return tracks.map((track) => {
      const { userProgress, _count, ...rest } = track;
      return {
        ...rest,
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
          include: { options: true },
        },
        userProgress: { where: { userId } },
      },
    });

    if (!track) {
      throw new NotFoundException('Trilha de treinamento não encontrada.');
    }

    const { userProgress, ...rest } = track;
    return {
      ...rest,
      progress: userProgress[0] ?? { isCompleted: false, score: 0, completedAt: null },
    };
  }

  async submitQuiz(trackId: string, userId: string, dto: SubmitQuizDto) {
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
    for (const answer of dto.answers) {
      const question = questions.find((q) => q.id === answer.questionId);
      const option = question?.options.find((o) => o.id === answer.optionId);
      if (option?.isCorrect) {
        correctCount += 1;
      }
    }

    const score = Math.round((correctCount / questions.length) * 100);
    const isCompleted = true;

    const progress = await this.prisma.userTrainingProgress.upsert({
      where: { userId_trackId: { userId, trackId } },
      create: { userId, trackId, score, isCompleted, completedAt: new Date() },
      update: { score, isCompleted, completedAt: new Date() },
    });

    return {
      score,
      correctCount,
      totalQuestions: questions.length,
      progress,
    };
  }
}
