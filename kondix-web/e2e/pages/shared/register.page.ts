import type { Page, Locator } from '@playwright/test';
import type { TestTrainer } from '../../fixtures/test-users';

export class RegisterPage {
  readonly displayName: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly confirm: Locator;
  readonly submitBtn: Locator;
  readonly success: Locator;

  constructor(private readonly page: Page) {
    this.displayName = page.getByTestId('register-displayname');
    this.email = page.getByTestId('register-email');
    this.password = page.getByTestId('register-password');
    this.confirm = page.getByTestId('register-confirm');
    this.submitBtn = page.getByTestId('register-submit');
    this.success = page.getByTestId('register-success');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/register');
    await this.email.waitFor();
  }

  async submit(trainer: TestTrainer): Promise<void> {
    await this.displayName.fill(trainer.displayName);
    await this.email.fill(trainer.email);
    await this.password.fill(trainer.password);
    await this.confirm.fill(trainer.password);
    await this.submitBtn.click();
    // Register navigates to /onboarding/setup on success. We wait for URL
    // change instead of expecting the success panel — that panel is only
    // rendered when `registered()` is set true, which in the current
    // implementation happens before the redirect.
    await this.page.waitForURL(/\/onboarding\/setup/);
  }
}
