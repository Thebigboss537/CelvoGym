import { Component, input } from '@angular/core';

@Component({
  selector: 'kx-spinner',
  template: `
    <div class="flex justify-center" [class]="containerClass()">
      <div
        class="border-2 border-primary border-t-transparent rounded-full animate-spin"
        [class.w-8]="size() === 'md'"
        [class.h-8]="size() === 'md'"
        [class.w-5]="size() === 'sm'"
        [class.h-5]="size() === 'sm'"
        role="status"
        aria-label="Cargando"
      ></div>
    </div>
  `,
})
export class KxSpinner {
  size = input<'sm' | 'md'>('md');
  containerClass = input('py-12');
}
