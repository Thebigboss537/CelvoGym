import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { environment } from '../../../environments/environment';
import { AuthUser } from '../../shared/models';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  initialized: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user }) => ({
    isAuthenticated: computed(() => user() !== null),
    isOperator: computed(() => user()?.userType === 'operator'),
    isEndUser: computed(() => user()?.userType === 'enduser'),
    permissions: computed(() => user()?.permissions ?? []),
  })),
  withMethods((store, router = inject(Router)) => ({
    async initialize() {
      if (store.initialized()) return;
      patchState(store, { loading: true });
      try {
        const res = await fetch(`${environment.guardUrl}/api/v1/auth/me`, {
          credentials: 'include',
          headers: { 'X-App-Slug': 'celvogym' },
        });
        if (!res.ok) throw new Error();
        const user = await res.json() as AuthUser;
        patchState(store, { user, initialized: true, loading: false });
      } catch {
        patchState(store, { user: null, initialized: true, loading: false });
      }
    },
    setUser(user: AuthUser) {
      patchState(store, { user, initialized: true });
    },
    reset() {
      patchState(store, { user: null, initialized: false, loading: false });
    },
    logout() {
      patchState(store, { user: null });
      router.navigate(['/auth/login']);
    },
  })),
);
