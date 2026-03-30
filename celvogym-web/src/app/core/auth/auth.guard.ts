import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

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

  router.navigate(['/auth/login']);
  return false;
};
