import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-student-detail-notes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div></div>`,
})
export class StudentDetailNotes {
  studentId = input.required<string>();
}
