function parseDate(iso: string): Date | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function formatDate(iso: string | null, locale = 'zh-CN'): string {
  if (!iso) {
    return '—';
  }

  const date = parseDate(iso);
  if (!date) {
    return iso;
  }

  try {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatMonthDay(iso: string | null, locale = 'zh-CN'): string {
  if (!iso) {
    return '—';
  }

  const date = parseDate(iso);
  if (!date) {
    return iso;
  }

  try {
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
