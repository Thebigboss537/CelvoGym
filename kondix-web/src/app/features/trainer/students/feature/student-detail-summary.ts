import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { StudentDto, StudentOverviewDto } from '../../../../shared/models';

@Component({
  selector: 'app-student-detail-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div></div>`,
})
export class StudentDetailSummary {
  student = input.required<StudentDto>();
  overview = input<StudentOverviewDto | null>(null);
  unreadFeedbackCount = input<number>(0);

  openProgress = output<void>();
}
