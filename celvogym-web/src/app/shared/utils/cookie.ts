export const CSRF_COOKIE_NAME = 'cg-csrf-celvogym';
export const MUTATING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}
