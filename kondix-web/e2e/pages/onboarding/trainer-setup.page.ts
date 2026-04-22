import type { Page, Locator } from '@playwright/test';

export class TrainerSetupPage {
  readonly displayName: Locator;
  readonly bio: Locator;
  readonly submitBtn: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.displayName = page.getByTestId('onboarding-displayname');
    this.bio = page.getByTestId('onboarding-bio');
    this.submitBtn = page.getByTestId('onboarding-submit');
    this.error = page.getByTestId('onboarding-error');
  }

  async waitForLoaded(): Promise<void> {
    await this.displayName.waitFor();
  }

  async submit(displayName: string, bio = ''): Promise<void> {
    await this.displayName.fill(displayName);
    if (bio) await this.bio.fill(bio);
    await this.submitBtn.click();
  }
}
