import type { Page, Locator } from '@playwright/test';

export class ShellPage {
  readonly trainerLogout: Locator;
  readonly studentLogout: Locator;
  readonly onboardingLogout: Locator;

  constructor(private readonly page: Page) {
    this.trainerLogout = page.getByTestId('trainer-logout');
    this.studentLogout = page.getByTestId('student-logout');
    this.onboardingLogout = page.getByTestId('onboarding-logout');
  }

  async logoutAsTrainer(): Promise<void> {
    await this.trainerLogout.click();
    await this.page.waitForURL(/\/auth\/login/);
  }

  async logoutAsStudent(): Promise<void> {
    await this.page.goto('/workout/profile');
    await this.studentLogout.waitFor();
    await this.studentLogout.click();
    await this.page.waitForURL(/\/auth\/login/);
  }

  async logoutFromOnboardingPending(): Promise<void> {
    await this.onboardingLogout.click();
    await this.page.waitForURL(/\/auth\/login/);
  }
}
