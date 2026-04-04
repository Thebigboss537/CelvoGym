import { Routes } from '@angular/router';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./feature/student-layout').then(m => m.StudentLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./feature/calendar').then(m => m.Calendar),
      },
      {
        path: 'routines',
        loadComponent: () => import('./feature/my-routines').then(m => m.MyRoutines),
      },
      {
        path: 'records',
        loadComponent: () => import('./feature/my-records').then(m => m.MyRecords),
      },
      {
        path: 'body',
        loadComponent: () => import('./feature/body-tracking').then(m => m.BodyTracking),
      },
      {
        path: ':id',
        loadComponent: () => import('./feature/workout').then(m => m.Workout),
      },
    ],
  },
];
