import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./feature/login').then(m => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./feature/register').then(m => m.Register),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
