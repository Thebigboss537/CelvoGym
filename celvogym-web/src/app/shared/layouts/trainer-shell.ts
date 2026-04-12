import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CgSidebar, SidebarItem } from '../ui/sidebar';
import { CgBottomNav, NavTab } from '../ui/bottom-nav';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'cg-trainer-shell',
  imports: [RouterOutlet, CgSidebar, CgBottomNav],
  template: `
    <div class="flex min-h-screen bg-bg">
      <cg-sidebar
        [items]="sidebarItems"
        [userName]="userName()"
        [userInitials]="userInitials()"
        (create)="onCreateNew()" />
      <main class="flex-1 md:ml-14 lg:ml-60 min-h-screen">
        <router-outlet />
      </main>
    </div>
    <!-- Mobile bottom nav (hidden on md+) -->
    <div class="md:hidden">
      <cg-bottom-nav [tabs]="mobileTabs" />
    </div>
    <!-- Mobile FAB -->
    <button (click)="onCreateNew()"
      class="md:hidden fixed bottom-20 right-5 w-14 h-14 bg-primary rounded-full flex items-center justify-center
             text-white text-2xl shadow-lg shadow-primary/40 z-50 press">
      +
    </button>
  `,
})
export class TrainerShell {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  userName = computed(() => this.authStore.user()?.firstName ?? 'Entrenador');
  userInitials = computed(() => {
    const name = this.authStore.user()?.firstName ?? 'E';
    return name.slice(0, 2).toUpperCase();
  });

  sidebarItems: SidebarItem[] = [
    { label: 'Dashboard', route: './', icon: 'layout-dashboard' },
    { label: 'Rutinas', route: 'routines', icon: 'clipboard-list' },
    { label: 'Programas', route: 'programs', icon: 'package' },
    { label: 'Alumnos', route: 'students', icon: 'users' },
    { label: 'Catálogo', route: 'catalog', icon: 'dumbbell' },
  ];

  mobileTabs: NavTab[] = [
    { label: 'Inicio', route: './', icon: 'layout-dashboard' },
    { label: 'Rutinas', route: 'routines', icon: 'clipboard-list' },
    { label: 'Programas', route: 'programs', icon: 'package' },
    { label: 'Alumnos', route: 'students', icon: 'users' },
    { label: 'Más', route: 'catalog', icon: 'menu' },
  ];

  onCreateNew() {
    this.router.navigate(['/trainer/routines/new']);
  }
}
