import { describe, expect, it } from 'vitest';

// Smoke test so the pipeline has something to run until the engine lands.
describe('test setup', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
