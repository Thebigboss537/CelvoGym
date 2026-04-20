export interface TestTrainer {
  email: string;
  password: string;
  displayName: string;
}

export interface TestStudent {
  email: string;
  password: string;
  firstName: string;
}

export function makeTrainer(specTag: string): TestTrainer {
  const ts = Date.now();
  return {
    email: `trainer-${specTag}-${ts}@e2e.test`,
    password: 'Test1234!',
    displayName: `Trainer ${specTag} ${ts}`,
  };
}

export function makeStudent(specTag: string): TestStudent {
  const ts = Date.now();
  return {
    email: `student-${specTag}-${ts}@e2e.test`,
    password: 'Test1234!',
    firstName: `Student ${specTag} ${ts}`,
  };
}
