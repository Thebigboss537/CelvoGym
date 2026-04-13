import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';
import { TENANT_ID_STORAGE_KEY } from '../../features/auth/feature/login';
import { environment } from '../../../environments/environment';
import type { TrainerStatusDto } from '../../shared/models';

async function getTrainerStatus(): Promise<TrainerStatusDto | null> {
  try {
    const res = await fetch(`${environment.apiUrl}/onboarding/trainer/status`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const trainerGuard: CanActivateFn = async () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  await store.initialize();

  if (!store.isOperator()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const status = await getTrainerStatus();
  if (status?.status === 'no_profile') {
    router.navigate(['/onboarding/setup']);
    return false;
  }
  if (status?.status === 'pending_approval') {
    router.navigate(['/onboarding/pending']);
    return false;
  }

  return true;
};

export const onboardingGuard: CanActivateFn = async () => {
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
