import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submitBtn: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByTestId('login-email');
    this.password = page.getByTestId('login-password');
    this.submitBtn = page.getByTestId('login-submit');
    this.error = page.getByTestId('login-error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
    await this.email.waitFor();
  }

  async gotoAsStudent(tenantId: string): Promise<void> {
    await this.page.goto(`/auth/login?t=${encodeURIComponent(tenantId)}`);
    await this.email.waitFor();
  }

  async submitCredentials(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submitBtn.click();
  }
}
