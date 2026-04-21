import type { Page, Locator } from '@playwright/test';

export class StudentProfilePage {
  readonly logoutBtn: Locator;

  constructor(private readonly page: Page) {
    this.logoutBtn = page.getByTestId('student-logout');
  }

  async goto(): Promise<void> {
    await this.page.goto('/workout/profile');
    await this.logoutBtn.waitFor();
  }

  async logout(): Promise<void> {
    await this.logoutBtn.click();
    await this.page.waitForURL(/\/auth\/login/);
  }
}
