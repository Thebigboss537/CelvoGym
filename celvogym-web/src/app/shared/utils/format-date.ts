export function formatDate(iso: string): string {
  const date = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

export function formatDateWithYear(iso: string): string {
  const date = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}
