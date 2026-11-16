import { ContentType } from '@prisma/client';
import { extractYoutubeId, parseMinuteSecondDuration } from '../common/youtube';

export const SOURCE_LABELS = ['AHA 2020', 'Ministério da Saúde', 'SAMU 192', 'Cruz Vermelha'] as const;
export const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM'] as const;

export interface ValidationOutcome {
  missing: string[];
  normalized: Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string').map((v) => v.trim());
}

export function validateSubmissionPayload(
  type: ContentType,
  payload: Record<string, unknown>,
  mode: 'DRAFT' | 'SUBMIT',
  categorySlugs: Set<string>,
): ValidationOutcome {
  switch (type) {
    case ContentType.EMERGENCY:
      return validateEmergency(payload, mode, categorySlugs);
    case ContentType.TRACK:
      return validateTrack(payload, mode, categorySlugs);
    case ContentType.VIDEO:
      return validateVideo(payload, mode, categorySlugs);
  }
}

function validateEmergency(payload: Record<string, unknown>, mode: 'DRAFT' | 'SUBMIT', categorySlugs: Set<string>): ValidationOutcome {
  const missing: string[] = [];
  const title = asString(payload.title);
  const categorySlug = asString(payload.categorySlug);
  const severity = asString(payload.severity).toUpperCase();
  const summary = asString(payload.summary) || undefined;
  const warningText = asString(payload.warningText) || undefined;
  const steps = asStringArray(payload.steps).filter((s) => s.length > 0);
  const dontDo = asStringArray(payload.dontDo).filter((s) => s.length > 0);
  const sourceLabel = asString(payload.sourceLabel);
  const youtubeRaw = asString((payload as { youtubeVideo?: unknown }).youtubeVideo);
  const youtubeVideoId = youtubeRaw ? extractYoutubeId(youtubeRaw) : null;

  if (mode === 'SUBMIT') {
    if (!title) missing.push('Informe o título.');
    else if (title.length > 120) missing.push('Título deve ter até 120 caracteres.');
    if (!categorySlugs.has(categorySlug)) missing.push('Selecione uma categoria válida.');
    if (!SEVERITIES.includes(severity as (typeof SEVERITIES)[number])) missing.push('Selecione a gravidade.');
    if (steps.length < 1) missing.push('Inclua ao menos 1 passo.');
    if (steps.length > 8) missing.push('Inclua no máximo 8 passos.');
    if (dontDo.length > 5) missing.push('Inclua no máximo 5 itens em "O que não fazer".');
    if (!SOURCE_LABELS.includes(sourceLabel as (typeof SOURCE_LABELS)[number])) missing.push('Selecione uma fonte oficial.');
    if (youtubeRaw && !youtubeVideoId) missing.push('Link de vídeo inválido.');
  }

  return {
    missing,
    normalized: { title, categorySlug, severity, summary, warningText, steps, dontDo, sourceLabel, youtubeVideoId },
  };
}

function validateTrack(payload: Record<string, unknown>, mode: 'DRAFT' | 'SUBMIT', categorySlugs: Set<string>): ValidationOutcome {
  const missing: string[] = [];
  const title = asString(payload.title);
  const categorySlug = asString(payload.categorySlug);
  const estimatedMinutes = Number(payload.estimatedMinutes) || 0;
  const sourceLabel = asString(payload.sourceLabel);

  const rawCards = Array.isArray(payload.cards) ? payload.cards : [];
  const cards = rawCards.map((c) => {
    const card = (c ?? {}) as Record<string, unknown>;
    return { title: asString(card.title), text: asString(card.text), tip: asString(card.tip) || undefined };
  });

  const rawQuestions = Array.isArray(payload.questions) ? payload.questions : [];
  const questions = rawQuestions.map((q) => {
    const question = (q ?? {}) as Record<string, unknown>;
    const options = asStringArray(question.options);
    return {
      statement: asString(question.statement),
      options,
      correctIndex: Number(question.correctIndex),
      explanation: asString(question.explanation) || undefined,
    };
  });

  if (mode === 'SUBMIT') {
    if (!title) missing.push('Informe o título.');
    if (!categorySlugs.has(categorySlug)) missing.push('Selecione uma categoria válida.');
    if (!(estimatedMinutes >= 1 && estimatedMinutes <= 999)) missing.push('Informe a duração estimada (1 a 999 minutos).');
    if (cards.length < 1 || cards.length > 10) missing.push('Inclua de 1 a 10 cards.');
    const hasCompleteCard = cards.some((c) => c.title.length > 0 && c.text.length > 0);
    if (!hasCompleteCard) missing.push('Inclua ao menos 1 card com título e texto.');
    if (questions.length < 1 || questions.length > 10) missing.push('Inclua de 1 a 10 perguntas.');
    const hasCompleteQuestion = questions.some(
      (q) => q.statement.length > 0 && q.options.length === 4 && q.options.every((o) => o.length > 0) && q.correctIndex >= 0 && q.correctIndex <= 3,
    );
    if (!hasCompleteQuestion) missing.push('Inclua ao menos 1 pergunta completa, com 4 opções e a resposta correta marcada.');
    if (!SOURCE_LABELS.includes(sourceLabel as (typeof SOURCE_LABELS)[number])) missing.push('Selecione uma fonte oficial.');
  }

  return { missing, normalized: { title, categorySlug, estimatedMinutes, cards, questions, sourceLabel } };
}

function validateVideo(payload: Record<string, unknown>, mode: 'DRAFT' | 'SUBMIT', categorySlugs: Set<string>): ValidationOutcome {
  const missing: string[] = [];
  const title = asString(payload.title);
  const categorySlug = asString(payload.categorySlug);
  const sourceLabel = asString(payload.sourceLabel);
  const linkedProcedureSlug = asString((payload as { linkedProcedureSlug?: unknown }).linkedProcedureSlug) || undefined;

  const youtubeRaw = asString(payload.youtubeVideo);
  const youtubeVideoId = youtubeRaw ? extractYoutubeId(youtubeRaw) : null;

  const durationRaw = asString(payload.duration);
  const durationSeconds = durationRaw ? parseMinuteSecondDuration(durationRaw) : null;

  if (mode === 'SUBMIT') {
    if (!title) missing.push('Informe o título.');
    if (!categorySlugs.has(categorySlug)) missing.push('Selecione uma categoria válida.');
    if (!youtubeRaw || !youtubeVideoId) missing.push('Informe um link de vídeo válido.');
    if (!durationRaw || durationSeconds === null) missing.push('Informe a duração no formato mm:ss.');
    if (!SOURCE_LABELS.includes(sourceLabel as (typeof SOURCE_LABELS)[number])) missing.push('Selecione uma fonte oficial.');
  }

  return {
    missing,
    normalized: { title, categorySlug, youtubeVideoId, durationSeconds, linkedProcedureSlug, sourceLabel },
  };
}
