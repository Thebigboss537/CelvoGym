import { HttpInterceptorFn } from '@angular/common/http';

const MUTATING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (MUTATING_METHODS.includes(req.method)) {
    const csrfToken = getCookie('cg-csrf');
    if (csrfToken) {
      req = req.clone({
        setHeaders: { 'X-CSRF-Token': csrfToken },
      });
    }
  }
  return next(req);
};

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}
