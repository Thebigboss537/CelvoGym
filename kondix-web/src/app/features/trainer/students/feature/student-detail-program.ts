import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ProgramAssignmentDto } from '../../../../shared/models';

@Component({
  selector: 'app-student-detail-program',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div></div>`,
})
export class StudentDetailProgram {
  studentId = input.required<string>();
  assignments = input<ProgramAssignmentDto[]>([]);

  assignmentsChange = output<ProgramAssignmentDto[]>();
}
