import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, icons } from 'lucide-angular';

export interface NavTab {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'cg-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) },
  ],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-bg-sidebar border-t border-border-light
                flex justify-around items-center px-3 pb-[env(safe-area-inset-bottom)] pt-2">
      @for (tab of tabs(); track tab.route) {
        <a [routerLink]="tab.route" routerLinkActive="active-tab" [routerLinkActiveOptions]="{ exact: tab.route === '.' }"
           class="flex flex-col items-center gap-1 flex-1 py-1.5 text-text-muted transition-colors
                  [&.active-tab]:text-primary">
          <lucide-icon [name]="tab.icon" [size]="22" [strokeWidth]="1.5"></lucide-icon>
          <span class="text-[10px] font-semibold">{{ tab.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: `
    :host { display: block; }
  `,
})
export class CgBottomNav {
  tabs = input.required<NavTab[]>();
}
