import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';

@Component({
  selector: 'cg-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      @if (showLabel()) {
        <div class="flex justify-between mb-1.5">
          <span class="text-text-secondary text-xs font-semibold">{{ label() }}</span>
          <span class="text-primary text-xs font-bold">{{ percentage() }}%</span>
        </div>
      }
      <div class="bg-border rounded-full overflow-hidden" [class]="sizeClass()">
        <div class="h-full rounded-full transition-all duration-500"
             style="background: linear-gradient(90deg, #B31D2C, #E62639)"
             [style.width.%]="percentage()">
        </div>
      </div>
    </div>
  `,
})
export class CgProgressBar {
  percentage = input.required<number>();
  label = input<string>('');
  showLabel = input<boolean>(true);
  size = input<'sm' | 'md'>('sm');
  sizeClass = computed(() => this.size() === 'md' ? 'h-1.5' : 'h-1');
}
