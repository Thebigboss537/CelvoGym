import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${environment.guardUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-App-Slug': 'celvogym' },
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

      // Don't retry refresh calls
      if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
        router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      // Deduplicate concurrent refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = tryRefresh().finally(() => { isRefreshing = false; });
      }

      return from(refreshPromise!).pipe(
        switchMap((success) => {
          if (success) {
            // Retry the original request with fresh cookies
            return next(req.clone());
          }
          router.navigate(['/auth/login']);
          return throwError(() => error);
        }),
      );
    }),
  );
};
