/** Adds N business days (Mon–Fri, no holiday calendar yet) to a date. */
export function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const weekday = result.getDay();
    if (weekday !== 0 && weekday !== 6) {
      remaining -= 1;
    }
  }
  return result;
}

export function dueLabel(dueAt: Date | null, now: Date = new Date()): string | null {
  if (!dueAt) {
    return null;
  }
  const dueDay = new Date(dueAt.getFullYear(), dueAt.getMonth(), dueAt.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) return 'Atrasado';
  if (diffDays === 0) return 'Vence hoje';
  return `Prazo: ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
}
