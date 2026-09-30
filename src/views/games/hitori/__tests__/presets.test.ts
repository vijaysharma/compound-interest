import test from 'node:test';
import assert from 'node:assert/strict';
import { HITORI_PRESETS } from '../presets';
import { validateHitori } from '../engine';
test('validate presets solution against hitori rules', () => {
  for (const diff of ['easy', 'medium', 'hard'] as const) {
    const list = HITORI_PRESETS[diff];
    for (const preset of list) {
      const flattened = preset.solution.flat();
      const res = validateHitori(preset.grid, flattened);
      console.log(`Checking ${preset.label}: complete=${res.isComplete}, violations=`, res.violations);
      assert.equal(res.isComplete, true, `Preset ${preset.label} failed validation: ${JSON.stringify(res.violations)}`);
    }
  }
});
