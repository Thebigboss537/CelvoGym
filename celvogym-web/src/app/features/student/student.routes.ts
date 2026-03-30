import { Routes } from '@angular/router';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./feature/student-layout').then(m => m.StudentLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./feature/my-routines').then(m => m.MyRoutines),
      },
      {
        path: ':id',
        loadComponent: () => import('./feature/workout').then(m => m.Workout),
      },
    ],
  },
];
