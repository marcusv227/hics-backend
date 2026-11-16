import { ContentOrigin } from '@prisma/client';

interface AuthorWithProfile {
  name: string;
  professionalProfile: { council: string | null; registrationNumber: string | null; uf: string | null } | null;
}

/**
 * Adds `reviewedLabel`/`author` only for professional-authored content, so
 * seed content keeps the exact response shape it always had.
 */
export function withProvenance<T extends { origin: ContentOrigin; author?: AuthorWithProfile | null }>(entity: T) {
  const { author, ...rest } = entity;
  if (entity.origin !== ContentOrigin.PROFESSIONAL || !author) {
    return rest;
  }

  const profile = author.professionalProfile;
  return {
    ...rest,
    reviewedLabel: 'Revisado HICS',
    author: {
      name: author.name,
      council: profile?.council ?? null,
      registrationNumber: profile?.registrationNumber ?? null,
      uf: profile?.uf ?? null,
    },
  };
}
