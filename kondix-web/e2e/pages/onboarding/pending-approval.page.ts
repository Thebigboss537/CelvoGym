import type { Page, Locator } from '@playwright/test';

export class PendingApprovalPage {
  readonly panel: Locator;
  readonly checkStatusBtn: Locator;
  readonly logoutBtn: Locator;
  readonly checkError: Locator;

  constructor(private readonly page: Page) {
    this.panel = page.getByTestId('pending-panel');
    this.checkStatusBtn = page.getByTestId('pending-check-status');
    this.logoutBtn = page.getByTestId('onboarding-logout');
    this.checkError = page.getByTestId('pending-check-error');
  }

  async waitForLoaded(): Promise<void> {
    await this.panel.waitFor();
  }

  async clickCheckStatus(): Promise<void> {
    await this.checkStatusBtn.click();
  }

  async clickLogout(): Promise<void> {
    await this.logoutBtn.click();
    await this.page.waitForURL(/\/auth\/login/);
  }
}
