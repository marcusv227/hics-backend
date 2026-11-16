import { SubmissionStatus } from '@prisma/client';

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  [SubmissionStatus.DRAFT]: 'Rascunho',
  [SubmissionStatus.IN_REVIEW]: 'Em revisão',
  [SubmissionStatus.CHANGES_REQUESTED]: 'Ajustes solicitados',
  [SubmissionStatus.PUBLISHED]: 'Publicado',
};
