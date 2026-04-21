import type { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly greeting: Locator;
  readonly statActiveStudents: Locator;
  readonly statActiveWeek: Locator;
  readonly statActivePrograms: Locator;
  readonly statAdherence: Locator;
  readonly activityEmpty: Locator;
  readonly alertsEmpty: Locator;
  readonly quickCreateRoutine: Locator;
  readonly quickCreateProgram: Locator;
  readonly quickInviteStudent: Locator;
  readonly activitySeeAll: Locator;

  constructor(private readonly page: Page) {
    this.greeting = page.getByTestId('dashboard-greeting');
    this.statActiveStudents = page.getByTestId('stat-active-students');
    this.statActiveWeek = page.getByTestId('stat-active-week');
    this.statActivePrograms = page.getByTestId('stat-active-programs');
    this.statAdherence = page.getByTestId('stat-adherence');
    this.activityEmpty = page.getByTestId('activity-empty');
    this.alertsEmpty = page.getByTestId('alerts-empty');
    this.quickCreateRoutine = page.getByTestId('quick-create-routine');
    this.quickCreateProgram = page.getByTestId('quick-create-program');
    this.quickInviteStudent = page.getByTestId('quick-invite-student');
    this.activitySeeAll = page.getByTestId('activity-see-all');
  }

  async goto(): Promise<void> {
    await this.page.goto('/trainer');
    await this.greeting.waitFor();
  }

  async clickCreateRoutine(): Promise<void> {
    await this.quickCreateRoutine.click();
    await this.page.waitForURL(/\/trainer\/routines\/new/);
  }

  async clickCreateProgram(): Promise<void> {
    await this.quickCreateProgram.click();
    await this.page.waitForURL(/\/trainer\/programs\/new/);
  }

  async clickInviteStudent(): Promise<void> {
    await this.quickInviteStudent.click();
    await this.page.waitForURL(/\/trainer\/students/);
  }
}
