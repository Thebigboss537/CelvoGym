import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'kx-wizard-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1.5 bg-primary/10 px-3.5 py-1.5 rounded-lg shrink-0">
        <span class="text-primary text-xs font-bold">Paso {{ currentStep() }} de {{ totalSteps() }}</span>
      </div>
      <div class="flex-1 h-[3px] bg-border rounded-full overflow-hidden">
        <div class="h-full bg-primary rounded-full transition-all duration-300"
             [style.width.%]="(currentStep() / totalSteps()) * 100">
        </div>
      </div>
    </div>
  `,
})
export class KxWizardStepper {
  currentStep = input.required<number>();
  totalSteps = input.required<number>();
}
