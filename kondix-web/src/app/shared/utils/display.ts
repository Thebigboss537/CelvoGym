/** Avatar gradient pairs used across the app for student/user avatars. */
export const GRADIENT_PAIRS: [string, string][] = [
  ['#E62639', '#B31D2C'],
  ['#A78BFA', '#7C3AED'],
  ['#F59E0B', '#D97706'],
  ['#22D3EE', '#0891B2'],
  ['#F472B6', '#DB2777'],
  ['#3B82F6', '#1D4ED8'],
];

/** Extract 1-2 character initials from a display name. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
