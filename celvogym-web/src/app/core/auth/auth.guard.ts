import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';
import { TENANT_ID_STORAGE_KEY } from '../../features/auth/feature/login';

export const trainerGuard: CanActivateFn = async () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  await store.initialize();

  if (store.isOperator()) return true;

  router.navigate(['/auth/login']);
  return false;
};

export const studentGuard: CanActivateFn = async () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  await store.initialize();

  if (store.isEndUser()) return true;

  const tenantId = localStorage.getItem(TENANT_ID_STORAGE_KEY);
  if (tenantId) {
    router.navigate(['/auth/login'], { queryParams: { t: tenantId } });
  } else {
    router.navigate(['/auth/login']);
  }
  return false;
};
