import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  LayoutDashboard,
  Dumbbell,
  Layers,
  BookOpen,
  Users,
  Plus,
  ClipboardList,
  Package,
  Menu,
  LucideIconData,
} from 'lucide-angular';
import { KxLogo } from './logo';
import { KxAvatar } from './avatar';

export interface SidebarItem {
  label: string;
  route: string;
  icon: string;
  count?: number;
}

const ICON_MAP: Record<string, LucideIconData> = {
  'layout-dashboard': LayoutDashboard,
  'dumbbell': Dumbbell,
  'layers': Layers,
  'book-open': BookOpen,
  'users': Users,
  'plus': Plus,
  'clipboard-list': ClipboardList,
  'package': Package,
  'menu': Menu,
};

@Component({
  selector: 'kx-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, KxLogo, KxAvatar, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ LayoutDashboard, Dumbbell, Layers, BookOpen, Users, Plus, ClipboardList, Package, Menu }),
    },
  ],
  template: `
    <aside class="hidden md:flex flex-col w-14 lg:w-60 bg-bg-sidebar border-r border-border-light h-screen sticky top-0 transition-all duration-300">

      <!-- Logo section -->
      <div class="flex items-center h-16 px-3 lg:px-4 border-b border-border-light shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <kx-logo [size]="28" [showText]="false" />
          <div class="hidden lg:flex flex-col min-w-0 overflow-hidden">
            <span class="font-display text-base font-bold leading-tight">
              <span class="text-primary font-bold tracking-wider">KONDIX</span>
            </span>
            <span class="text-text-muted text-xs leading-tight truncate">Panel de entrenador</span>
          </div>
        </div>
      </div>

      <!-- Navigation items -->
      <nav class="flex-1 flex flex-col gap-0.5 py-3 px-2 overflow-y-auto min-h-0">
        @for (item of items(); track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-bg-active border-border-active text-primary"
            [routerLinkActiveOptions]="{ exact: item.route.endsWith('dashboard') }"
            class="group flex items-center gap-3 rounded-lg px-2.5 py-2 text-text-secondary hover:text-text hover:bg-card-hover transition-colors duration-150 min-w-0 border border-transparent"
          >
            <!-- Icon — always visible -->
            <lucide-icon
              [img]="getIcon(item.icon)"
              [size]="18"
              [strokeWidth]="1.5"
              class="shrink-0"
            />

            <!-- Label + badge — lg only -->
            <span class="hidden lg:flex items-center justify-between flex-1 min-w-0">
              <span class="text-sm font-medium truncate">{{ item.label }}</span>
              @if (item.count !== undefined && item.count > 0) {
                <span class="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-primary text-white shrink-0">
                  {{ item.count }}
                </span>
              }
            </span>
          </a>
        }
      </nav>

      <!-- "Crear nuevo" CTA -->
      <div class="px-2 py-3 border-t border-border-light shrink-0">
        <button
          (click)="create.emit()"
          class="press w-full flex items-center justify-center lg:justify-start gap-2.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-active text-white transition-colors duration-150 px-2.5 py-2.5 font-medium text-sm"
        >
          <lucide-icon [img]="plusIcon" [size]="18" [strokeWidth]="2" class="shrink-0" />
          <span class="hidden lg:inline">Crear nuevo</span>
        </button>
      </div>

      <!-- User profile section -->
      <div class="flex items-center gap-3 px-3 py-3.5 border-t border-border-light shrink-0 min-w-0">
        <kx-avatar [name]="userInitials()" size="md" class="shrink-0" />
        <div class="hidden lg:flex flex-col min-w-0 overflow-hidden">
          <span class="text-sm font-medium text-text truncate">{{ userName() }}</span>
          <span class="text-xs text-text-muted truncate">Entrenador</span>
        </div>
      </div>

    </aside>
  `,
})
export class KxSidebar {
  items = input.required<SidebarItem[]>();
  userName = input.required<string>();
  userInitials = input.required<string>();

  create = output<void>();

  readonly plusIcon = Plus;

  getIcon(name: string): LucideIconData {
    return ICON_MAP[name] ?? Plus;
  }
}
