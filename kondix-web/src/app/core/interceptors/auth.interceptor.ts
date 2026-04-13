import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getCookie, CSRF_COOKIE_NAME, MUTATING_METHODS } from '../../shared/utils/cookie';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${environment.guardUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-App-Slug': 'kondix' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
        router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = tryRefresh().finally(() => { isRefreshing = false; });
      }

      return from(refreshPromise!).pipe(
        switchMap((success) => {
          if (success) {
            const csrfToken = getCookie(CSRF_COOKIE_NAME);
            return next(csrfToken && MUTATING_METHODS.includes(req.method)
              ? req.clone({ setHeaders: { 'X-CSRF-Token': csrfToken } })
              : req);
          }
          router.navigate(['/auth/login']);
          return throwError(() => error);
        }),
      );
    }),
  );
};
