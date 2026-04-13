export function parseLocalDate(iso: string): Date {
  return new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
}

export function formatDate(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

export function formatDateWithYear(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatSpanishDate(date: Date): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function relativeDate(iso: string): string {
  const date = parseLocalDate(iso);
  const today = new Date();
  const diffMs = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} días`;
  const weeks = Math.floor(diffDays / 7);
  return weeks === 1 ? 'hace 1 semana' : `hace ${weeks} semanas`;
}
