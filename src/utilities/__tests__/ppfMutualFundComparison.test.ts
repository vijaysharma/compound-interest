import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMfComparison, findPreInceptionDeposits } from '../ppfMutualFundComparison';
import type { NavType } from '../../types/types';
import type { PPFCalculationResult, PpfInvestmentRecord } from '../ppfCalculations';

describe('PPF vs Mutual Fund Real Outcome Comparison', () => {
  const dummyPpfResult: PPFCalculationResult = {
    totalInvested: 600000,
    totalInterest: 150000,
    maturityAmount: 750000,
    tenureYears: 15,
    depositYears: 16,
    maturityYear: 2036,
    maturityFyLabel: '2035-36',
    maturityDate: '2036-03-31',
    baseMaturityDate: '2036-03-31',
    excessDeposit: 0,
    yearlyBreakdown: [],
    hasHistory: true,
    currentBalance: 750000,
    investedToDate: 600000,
    interestEarnedToDate: 150000,
    historyEntryCount: 4,
    openingFyStart: 2020,
  };

  const dummyNavData: NavType[] = [
    { date: '01-04-2020', nav: '100.00' },
    { date: '01-04-2021', nav: '120.00' },
    { date: '01-04-2022', nav: '150.00' },
    { date: '01-04-2023', nav: '180.00' },
    { date: '01-04-2024', nav: '200.00' },
  ];

  const dummyInvestments: PpfInvestmentRecord[] = [
    { id: '1', investmentDate: '2020-04-05', amount: 150000, notes: 'FY 20-21' },
    { id: '2', investmentDate: '2021-04-05', amount: 150000, notes: 'FY 21-22' },
    { id: '3', investmentDate: '2022-04-05', amount: 150000, notes: 'FY 22-23' },
    { id: '4', investmentDate: '2023-04-05', amount: 150000, notes: 'FY 23-24' },
  ];

  it('calculates units, current value, and outperformance accurately', () => {
    const res = calculateMfComparison(
      dummyInvestments,
      dummyNavData,
      dummyPpfResult,
      '120716',
      'Test Nifty Index'
    );

    assert.ok(res);
    assert.strictEqual(res.schemeCode, '120716');
    assert.strictEqual(res.schemeName, 'Test Nifty Index');
    assert.strictEqual(res.totalInvested, 600000);
    assert.strictEqual(res.latestNav, 200);
    assert.strictEqual(res.latestNavDate, '2024-04-01');

    // Units:
    // 2020: 150000 / 100 = 1500 units
    // 2021: 150000 / 120 = 1250 units
    // 2022: 150000 / 150 = 1000 units
    // 2023: 150000 / 180 = 833.333 units
    // Total: ~4583.333 units
    // Current value at 200 NAV = ~916666.67
    assert.strictEqual(res.outcomes.length, 4);
    assert.strictEqual(res.outcomes[0].units, 1500);
    assert.strictEqual(res.outcomes[0].currentValue, 300000);
    assert.strictEqual(res.outcomes[0].absoluteGain, 150000);

    assert.ok(res.mfCurrentValue > res.ppfCurrentValue);
    assert.ok(res.diffAmount > 0);
    assert.ok(res.diffPercent > 0);
    assert.ok(res.wealthMultiplier > 1);
    assert.strictEqual(findPreInceptionDeposits(dummyInvestments, dummyNavData), null);
    assert.ok(typeof res.xirr === 'number');
  });

  it('refuses to price deposits made before the fund existed', () => {
    const earlyInvestments: PpfInvestmentRecord[] = [
      { id: '0', investmentDate: '2018-04-05', amount: 150000 },
      { id: '00', investmentDate: '2019-06-10', amount: 50000 },
      ...dummyInvestments,
    ];
    assert.deepStrictEqual(findPreInceptionDeposits(earlyInvestments, dummyNavData), {
      inceptionDate: '2020-04-01',
      firstDepositDate: '2018-04-05',
      count: 2,
      amount: 200000,
    });
    // No outcome is computed: a pre-launch deposit would need a NAV from a later date.
    assert.strictEqual(
      calculateMfComparison(earlyInvestments, dummyNavData, dummyPpfResult, '120716', 'Test Nifty Index'),
      null
    );
  });

  it('returns null gracefully on empty inputs', () => {
    assert.strictEqual(calculateMfComparison([], dummyNavData, dummyPpfResult), null);
    assert.strictEqual(calculateMfComparison(dummyInvestments, [], dummyPpfResult), null);
  });
});
