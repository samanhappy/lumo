import test from 'node:test';
import assert from 'node:assert/strict';
import { monthDays } from '../src/platform/tasks/date-picker.js';

test('calendar starts Monday, spans six weeks and handles leap years and year boundaries', () => {
  const october = monthDays('2026-10-11');
  assert.equal(october.length, 42);
  assert.equal(october[0], '2026-09-28');
  assert.equal(october[41], '2026-11-08');
  assert.ok(monthDays('2024-02-01').includes('2024-02-29'));
  assert.ok(!monthDays('2025-02-01').includes('2025-02-29'));
  assert.equal(monthDays('2027-01-01')[0], '2026-12-28');
});
