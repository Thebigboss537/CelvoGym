import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../services/api.service';
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
  withMethods((store, api = inject(ApiService), router = inject(Router)) => ({
    async initialize() {
      if (store.initialized()) return;
      patchState(store, { loading: true });
      try {
        const user = await firstValueFrom(api.get<AuthUser>('/auth/me'));
        patchState(store, { user: user ?? null, initialized: true, loading: false });
      } catch {
        patchState(store, { user: null, initialized: true, loading: false });
      }
    },
    setUser(user: AuthUser) {
      patchState(store, { user, initialized: true });
    },
    logout() {
      patchState(store, { user: null });
      router.navigate(['/auth/login']);
    },
  })),
);
