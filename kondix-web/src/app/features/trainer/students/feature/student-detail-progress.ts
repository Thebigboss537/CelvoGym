import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-student-detail-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div></div>`,
})
export class StudentDetailProgress {
  studentId = input.required<string>();
}
