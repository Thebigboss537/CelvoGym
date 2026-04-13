import { HttpInterceptorFn } from '@angular/common/http';
import { getCookie, CSRF_COOKIE_NAME, MUTATING_METHODS } from '../../shared/utils/cookie';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (MUTATING_METHODS.includes(req.method)) {
    const csrfToken = getCookie(CSRF_COOKIE_NAME);
    if (csrfToken) {
      req = req.clone({
        setHeaders: { 'X-CSRF-Token': csrfToken },
      });
    }
  }
  return next(req);
};
