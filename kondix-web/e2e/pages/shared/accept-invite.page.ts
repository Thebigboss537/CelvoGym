import type { Page, Locator } from '@playwright/test';

export class AcceptInvitePage {
  readonly loading: Locator;
  readonly error: Locator;
  readonly displayName: Locator;
  readonly password: Locator;
  readonly submitBtn: Locator;
  readonly acceptError: Locator;
  readonly success: Locator;
  readonly gotoWorkoutBtn: Locator;

  constructor(private readonly page: Page) {
    this.loading = page.getByTestId('invite-loading');
    this.error = page.getByTestId('invite-error');
    this.displayName = page.getByTestId('invite-displayname');
    this.password = page.getByTestId('invite-password');
    this.submitBtn = page.getByTestId('invite-submit');
    this.acceptError = page.getByTestId('invite-accept-error');
    this.success = page.getByTestId('invite-success');
    this.gotoWorkoutBtn = page.getByTestId('invite-goto-workout');
  }

  async gotoWithToken(token: string): Promise<void> {
    await this.page.goto(`/invite?token=${encodeURIComponent(token)}`);
    await this.page.waitForLoadState('networkidle');
  }

  async submit(displayName: string, password: string): Promise<void> {
    await this.displayName.fill(displayName);
    await this.password.fill(password);
    await this.submitBtn.click();
  }

  async goToWorkout(): Promise<void> {
    await this.gotoWorkoutBtn.click();
    await this.page.waitForURL(/\/workout/);
  }
}
