import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePPF,
  getFyAndMonth,
  type PpfInvestmentRecord,
} from '../ppfCalculations';

describe('PPF Calculation Engine', () => {
  describe('getFyAndMonth', () => {
    it('correctly maps dates from April to December to current calendar year FY', () => {
      const apr = getFyAndMonth('2023-04-05');
      assert.strictEqual(apr.isValid, true);
      assert.strictEqual(apr.fyStartYear, 2023);
      assert.strictEqual(apr.monthIndex, 0); // April
      assert.strictEqual(apr.day, 5);

      const dec = getFyAndMonth('2023-12-25');
      assert.strictEqual(dec.isValid, true);
      assert.strictEqual(dec.fyStartYear, 2023);
      assert.strictEqual(dec.monthIndex, 8); // Dec
      assert.strictEqual(dec.day, 25);
    });

    it('correctly maps dates from January to March to previous calendar year FY', () => {
      const jan = getFyAndMonth('2024-01-02');
      assert.strictEqual(jan.isValid, true);
      assert.strictEqual(jan.fyStartYear, 2023); // FY 2023-24
      assert.strictEqual(jan.monthIndex, 9); // Jan
      assert.strictEqual(jan.day, 2);

      const mar = getFyAndMonth('2024-03-31');
      assert.strictEqual(mar.isValid, true);
      assert.strictEqual(mar.fyStartYear, 2023); // FY 2023-24
      assert.strictEqual(mar.monthIndex, 11); // March
      assert.strictEqual(mar.day, 31);
    });

    it('rejects invalid dates gracefully', () => {
      assert.strictEqual(getFyAndMonth('').isValid, false);
      assert.strictEqual(getFyAndMonth('invalid-date').isValid, false);
      assert.strictEqual(getFyAndMonth(null).isValid, false);
      assert.strictEqual(getFyAndMonth('2024-13-01').isValid, false);
    });
  });

  describe('Pure Projection Mode (No History)', () => {
    it('calculates standard 15-year yearly deposit before 5th April', () => {
      const result = calculatePPF({
        depositAmount: 150000,
        frequency: 'yearly',
        depositTiming: 'before_5th',
        startYear: 2024,
        extensionBlocks: 0,
        extensionMode: 'with_contribution',
        projectedRate: 7.1,
      });

      assert.strictEqual(result.hasHistory, false);
      assert.strictEqual(result.tenureYears, 15);
      assert.strictEqual(result.totalInvested, 150000 * 15);
      assert.strictEqual(result.yearlyBreakdown.length, 15);
      assert.strictEqual(result.yearlyBreakdown[0].months[0].deposit, 150000);
      // First year interest on 150k at 7.1% with April deposit before 5th is exactly 150000 * 0.071 = 10650
      assert.strictEqual(result.yearlyBreakdown[0].totalInterest, 10650);
      assert.strictEqual(result.yearlyBreakdown[0].closingBalance, 160650);
      assert.ok(result.maturityAmount > 4000000); // 150k yearly at 7.1% matures to ~40.68 Lakh
    });

    it('honors after 5th April deposit rule (11 months of interest instead of 12 in year 1)', () => {
      const beforeResult = calculatePPF({
        depositAmount: 150000,
        frequency: 'yearly',
        depositTiming: 'before_5th',
        startYear: 2024,
        extensionBlocks: 0,
        extensionMode: 'with_contribution',
        projectedRate: 7.1,
      });

      const afterResult = calculatePPF({
        depositAmount: 150000,
        frequency: 'yearly',
        depositTiming: 'after_5th',
        startYear: 2024,
        extensionBlocks: 0,
        extensionMode: 'with_contribution',
        projectedRate: 7.1,
      });

      // April interest is 0 when deposited after 5th April
      assert.strictEqual(afterResult.yearlyBreakdown[0].months[0].monthlyInterest, 0);
      // Before 5th earns full 12 months interest in Year 1: 10650
      // After 5th earns 11 months interest in Year 1: 150000 * (0.071/12) * 11 = 9762.5 ~ 9763
      assert.strictEqual(beforeResult.yearlyBreakdown[0].totalInterest, 10650);
      assert.strictEqual(afterResult.yearlyBreakdown[0].totalInterest, 9763);
      assert.ok(beforeResult.maturityAmount > afterResult.maturityAmount);
    });
  });

  describe('Historical Investment Engine', () => {
    it('uses actual deposit dates and 5th-of-the-month rules', () => {
      const history: PpfInvestmentRecord[] = [
        { id: '1', investmentDate: '2022-04-03', amount: 50000 }, // FY 2022-23 Month 0 (before 5th)
        { id: '2', investmentDate: '2022-04-10', amount: 50000 }, // FY 2022-23 Month 0 (after 5th)
        { id: '3', investmentDate: '2023-04-01', amount: 100000 }, // FY 2023-24 Month 0 (before 5th)
      ];

      const result = calculatePPF({
        depositAmount: 100000,
        frequency: 'yearly',
        depositTiming: 'before_5th',
        startYear: 2022,
        extensionBlocks: 0,
        extensionMode: 'with_contribution',
        projectedRate: 7.1,
        history,
        asOfDate: '2023-05-01',
      });

      assert.strictEqual(result.hasHistory, true);
      assert.strictEqual(result.historyEntryCount, 3);
      assert.strictEqual(result.openingFyStart, 2022);

      const yr1 = result.yearlyBreakdown[0];
      assert.strictEqual(yr1.isActualHistory, true);
      assert.strictEqual(yr1.annualDeposit, 100000);

      // In month 0 (April 2022):
      // 50k before 5th, 50k after 5th.
      // Eligible balance for April interest is 50,000!
      // Closing balance at end of April is 100,000!
      const apr2022 = yr1.months[0];
      assert.strictEqual(apr2022.deposit, 100000);
      assert.strictEqual(apr2022.eligibleBalanceForInterest, 50000);
      assert.strictEqual(apr2022.closingBalance, 100000);

      // In month 1 (May 2022):
      // Opening balance is 100,000, so eligible balance is 100,000!
      const may2022 = yr1.months[1];
      assert.strictEqual(may2022.deposit, 0);
      assert.strictEqual(may2022.eligibleBalanceForInterest, 100000);

      // In May 2023 (as of 2023-05-01):
      // Invested to date includes all 3 entries = 200,000
      assert.strictEqual(result.investedToDate, 200000);
      // Interest earned to date includes FY 2022-23 credited interest on 2023-03-31
      assert.strictEqual(result.interestEarnedToDate, yr1.totalInterest);
      // Current balance = Year 1 closing balance + Year 2 April deposit (100,000)
      assert.strictEqual(result.currentBalance, yr1.closingBalance + 100000);
    });

    it('applies historical declared interest rates for earlier years', () => {
      // Historical rate for 2012-13 was 8.8%
      const history: PpfInvestmentRecord[] = [
        { id: '1', investmentDate: '2012-04-04', amount: 100000 },
      ];

      const result = calculatePPF({
        depositAmount: 100000,
        frequency: 'yearly',
        depositTiming: 'before_5th',
        startYear: 2012,
        extensionBlocks: 0,
        extensionMode: 'with_contribution',
        projectedRate: 7.1,
        history,
      });

      const yr2012 = result.yearlyBreakdown[0];
      assert.strictEqual(yr2012.startYear, 2012);
      assert.strictEqual(yr2012.interestRate, 8.8);
      // Year 1 interest: 100,000 * 8.8% = 8,800
      assert.strictEqual(yr2012.totalInterest, 8800);
    });

    it('supports stopping contributions post-history', () => {
      const history: PpfInvestmentRecord[] = [
        { id: '1', investmentDate: '2020-04-02', amount: 150000 },
        { id: '2', investmentDate: '2021-04-02', amount: 150000 },
      ];

      const result = calculatePPF({
        depositAmount: 150000,
        frequency: 'yearly',
        depositTiming: 'before_5th',
        startYear: 2020,
        extensionBlocks: 0,
        extensionMode: 'with_contribution',
        projectedRate: 7.1,
        history,
        futureContributionMode: 'stop',
      });

      // Total invested should only be the historical deposits (300,000)
      assert.strictEqual(result.totalInvested, 300000);
      // Subsequent years should have 0 annual deposit
      const yr3 = result.yearlyBreakdown[2];
      assert.strictEqual(yr3.annualDeposit, 0);
      assert.ok(yr3.totalInterest > 0); // Still earns interest on accumulated corpus
    });
  });
});
