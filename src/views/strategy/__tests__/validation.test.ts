import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasBlockingError, validateStrategy } from '../validation';
import { installmentDates } from '../schedule';
import { FLAT_TEN, baseConfig, column2Entry, navBook } from './fixtures';
const messagesFor = (id: string, issues: { id: string; message: string }[]): string[] =>
  issues.filter((issue) => issue.id === id).map((issue) => issue.message);
test('a clean configuration produces no issues', () => {
  const config = baseConfig();
  assert.deepEqual(validateStrategy(config, navBook()), []);
});
test('allocation must total exactly 100%', () => {
  const config = baseConfig();
  config.column1.withdrawals = [
    { id: 'wd1', startDate: '2019-01-01', endDate: '2019-01-01', frequency: 'yearly', amount: 450000, toColumn2: 400000, annualStepUpPct: 0 },
  ];
  config.column2 = [
    column2Entry('a', '201', 40, '2019-01-01'),
    column2Entry('b', '202', 30, '2019-01-01'),
  ];
  const issues = validateStrategy(config, navBook({ 201: FLAT_TEN, 202: FLAT_TEN }));
  assert.deepEqual(messagesFor('c2-allocation', issues), [
    'Fund allocation totals 70%. It must total exactly 100%.',
  ]);
  assert.ok(hasBlockingError(issues));
  config.column2[1].allocationPct = 60;
  assert.deepEqual(messagesFor('c2-allocation', validateStrategy(config, navBook())), []);
});
test('an investment date before the fund existed is rejected', () => {
  const config = baseConfig();
  config.column1.investmentDate = '2017-06-01';
  const issues = validateStrategy(config, navBook());
  assert.equal(messagesFor('c1-inception', issues).length, 1);
  assert.ok(issues[0].message.includes('2018-01-01'));
});
test('impossible date sequences are rejected', () => {
  const config = baseConfig();
  config.column1.withdrawals = [
    { id: 'wd1', startDate: '2017-01-01', endDate: '2016-01-01', frequency: 'yearly', amount: 0, toColumn2: 0, annualStepUpPct: 0 },
  ];
  const issues = validateStrategy(config, navBook());
  assert.equal(messagesFor('wd-wd1-start', issues).length, 1);
  assert.equal(messagesFor('wd-wd1-range', issues).length, 1);
  assert.equal(messagesFor('wd-wd1-amount', issues).length, 1);
});
test('an SWP cannot start before its own SIP', () => {
  const config = baseConfig();
  config.column1.withdrawals = [
    { id: 'wd1', startDate: '2019-01-01', endDate: '2019-01-01', frequency: 'yearly', amount: 400000, toColumn2: 400000, annualStepUpPct: 0 },
  ];
  config.column2 = [
    column2Entry('a', '201', 100, '2019-01-01', {
      swp: { enabled: true, startDate: '2018-06-01', endDate: '2021-01-01', amount: 1000, frequency: 'monthly', toColumn3: 2000 },
    }),
  ];
  const issues = validateStrategy(config, navBook({ 201: FLAT_TEN }));
  assert.equal(messagesFor('c2-a-swp-start', issues).length, 1);
  assert.equal(messagesFor('c2-a-swp-split', issues).length, 1);
});
test('a withdrawal cannot route more onward than it takes out', () => {
  const config = baseConfig();
  config.column1.withdrawals = [
    { id: 'wd1', startDate: '2019-01-01', endDate: '2019-01-01', frequency: 'yearly', amount: 100000, toColumn2: 400000, annualStepUpPct: 0 },
  ];
  assert.equal(messagesFor('wd-wd1-split', validateStrategy(config, navBook())).length, 1);
});
test('instalment dates step by the chosen frequency', () => {
  assert.deepEqual(installmentDates('2019-01-15', '2019-04-20', 'monthly'), [
    '2019-01-15',
    '2019-02-15',
    '2019-03-15',
    '2019-04-15',
  ]);
  assert.deepEqual(installmentDates('2019-01-01', '2019-12-31', 'quarterly'), [
    '2019-01-01',
    '2019-04-01',
    '2019-07-01',
    '2019-10-01',
  ]);
  assert.deepEqual(installmentDates('2019-03-01', '2021-01-01', 'yearly'), [
    '2019-03-01',
    '2020-03-01',
  ]);
  assert.deepEqual(installmentDates('2019-05-01', '2019-01-01', 'monthly'), []);
});
