export function progressColor(pct: number): string {
  if (pct === 100) return 'var(--color-success)';
  if (pct >= 70) return 'var(--color-warning)';
  return 'var(--color-primary)';
}

export function groupTypeLabel(type: string): string {
  const labels: Record<string, string> = { Single: 'Individual', Superset: 'Biserie', Triset: 'Triserie', Circuit: 'Circuito' };
  return labels[type] ?? type;
}

export function setTypeLabel(type: string): string {
  const labels: Record<string, string> = { Warmup: 'Calent.', Effective: 'Efectiva', DropSet: 'Drop set', RestPause: 'Rest-pause', AMRAP: 'AMRAP' };
  return labels[type] ?? type;
}

export function setTypeColor(type: string): string {
  const colors: Record<string, string> = {
    Warmup: 'var(--color-set-warmup)',
    Effective: 'var(--color-set-effective)',
    DropSet: 'var(--color-set-dropset)',
    RestPause: 'var(--color-set-restpause)',
    AMRAP: 'var(--color-set-amrap)',
  };
  return colors[type] ?? 'var(--color-text-muted)';
}
