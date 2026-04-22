import type { Page, Locator } from '@playwright/test';

export class RoutineWizardPage {
  readonly name: Locator;
  readonly description: Locator;
  readonly tagInput: Locator;
  readonly next: Locator;
  readonly back: Locator;
  readonly cancel: Locator;
  readonly save: Locator;
  readonly dayAdd: Locator;
  readonly groupAdd: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByTestId('wizard-name');
    this.description = page.getByTestId('wizard-description');
    this.tagInput = page.getByTestId('wizard-tag-input');
    this.next = page.getByTestId('wizard-btn-next');
    this.back = page.getByTestId('wizard-btn-back');
    this.cancel = page.getByTestId('wizard-btn-cancel');
    this.save = page.getByTestId('wizard-btn-save');
    this.dayAdd = page.getByTestId('wizard-day-add');
    this.groupAdd = page.getByTestId('wizard-group-add');
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/trainer/routines/new');
    await this.name.waitFor();
  }

  async gotoEdit(routineId: string): Promise<void> {
    await this.page.goto(`/trainer/routines/${routineId}/edit`);
    await this.name.waitFor();
  }

  selectCategory(category: string): Promise<void> {
    return this.page.getByTestId(`wizard-category-${category}`).click();
  }

  dayName(i: number): Locator {
    return this.page.getByTestId(`wizard-day-${i}-name`);
  }

  removeDay(i: number): Promise<void> {
    return this.page.getByTestId(`wizard-day-${i}-remove`).click();
  }

  dayTab(i: number): Promise<void> {
    return this.page.getByTestId(`wizard-day-tab-${i}`).click();
  }

  exerciseName(gi: number, ei: number): Locator {
    return this.page.getByTestId(`wizard-exercise-${gi}-${ei}-name`);
  }

  exerciseToggle(gi: number, ei: number): Locator {
    return this.page.getByTestId(`wizard-exercise-${gi}-${ei}-toggle`);
  }

  setReps(gi: number, ei: number, si: number): Locator {
    return this.page.getByTestId(`wizard-set-${gi}-${ei}-${si}-reps`);
  }

  setWeight(gi: number, ei: number, si: number): Locator {
    return this.page.getByTestId(`wizard-set-${gi}-${ei}-${si}-weight`);
  }

  addSet(gi: number, ei: number): Promise<void> {
    return this.page.getByTestId(`wizard-set-add-${gi}-${ei}`).click();
  }

  addExercise(gi: number): Promise<void> {
    return this.page.getByTestId(`wizard-exercise-add-${gi}`).click();
  }
}
