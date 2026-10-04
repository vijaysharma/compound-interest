import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePPF,
  getFyAndMonth,
  getPPFMaturity,
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
    it('calculates the standard term (opening FY + 15 FYs) with yearly deposits before 5th April', () => {
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
      assert.strictEqual(result.depositYears, 16);
      assert.strictEqual(result.totalInvested, 150000 * 16);
      assert.strictEqual(result.yearlyBreakdown.length, 16);
      assert.strictEqual(result.maturityDate, '2040-03-31');
      assert.strictEqual(result.maturityFyLabel, '2039-40');
      assert.strictEqual(result.yearlyBreakdown[0].months[0].deposit, 150000);
      // First year interest on 150k at 7.1% with April deposit before 5th is exactly 150000 * 0.071 = 10650
      assert.strictEqual(result.yearlyBreakdown[0].totalInterest, 10650);
      assert.strictEqual(result.yearlyBreakdown[0].closingBalance, 160650);
      assert.ok(result.maturityAmount > 4500000); // 16 × 150k at 7.1% matures to ~45.2 Lakh
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
  describe('Maturity and deposit-eligibility rules', () => {
    const base = {
      depositAmount: 150000,
      frequency: 'yearly' as const,
      depositTiming: 'before_5th' as const,
      extensionMode: 'with_contribution' as const,
      projectedRate: 7.1,
    };
    it('account opened 7 Aug 2014 matures 31 Mar 2030 with 16 deposit FYs (2014-15 to 2029-30)', () => {
      const result = calculatePPF({
        ...base,
        startYear: 2014,
        extensionBlocks: 0,
        history: [{ id: 'open', investmentDate: '2014-08-07', amount: 150000 }],
        asOfDate: '2014-08-10',
      });
      assert.strictEqual(result.openingFyStart, 2014);
      assert.strictEqual(result.maturityDate, '2030-03-31');
      assert.strictEqual(result.maturityFyLabel, '2029-30');
      assert.strictEqual(result.depositYears, 16);
      assert.strictEqual(result.yearlyBreakdown[0].fyLabel, '2014-15');
      assert.strictEqual(result.yearlyBreakdown[15].fyLabel, '2029-30');
      assert.strictEqual(result.yearlyBreakdown[15].isMaturityYear, true);
      assert.ok(result.yearlyBreakdown.every((y) => y.annualDeposit === 150000));
      // Maximum principal before maturity: ₹1.5 lakh × 16
      assert.strictEqual(result.totalInvested, 2400000);
    });
    it('any opening date between 1 Apr 2014 and 31 Mar 2015 matures on 31 Mar 2030', () => {
      for (const openDate of ['2014-04-01', '2014-08-07', '2014-12-31', '2015-01-15', '2015-03-31']) {
        const result = calculatePPF({
          ...base,
          startYear: 2030,
          extensionBlocks: 0,
          history: [{ id: 'open', investmentDate: openDate, amount: 500 }],
          asOfDate: openDate,
        });
        assert.strictEqual(result.maturityDate, '2030-03-31', openDate);
        assert.strictEqual(result.depositYears, 16, openDate);
      }
    });
    it('getPPFMaturity applies Opening FY + 15 and 5-year extension blocks', () => {
      assert.deepStrictEqual(getPPFMaturity(2014), {
        maturityFyStart: 2029,
        maturityFyLabel: '2029-30',
        maturityDate: '2030-03-31',
        depositFyCount: 16,
      });
      assert.strictEqual(getPPFMaturity(2014, 1).maturityDate, '2035-03-31');
      assert.strictEqual(getPPFMaturity(2014, 2).maturityDate, '2040-03-31');
    });
    it('an extension block adds 5 FYs after the maturity FY', () => {
      const result = calculatePPF({ ...base, startYear: 2014, extensionBlocks: 1 });
      assert.strictEqual(result.yearlyBreakdown.length, 21);
      assert.strictEqual(result.maturityDate, '2035-03-31');
      assert.strictEqual(result.yearlyBreakdown[15].isExtensionYear, false);
      assert.strictEqual(result.yearlyBreakdown[16].isExtensionYear, true);
      assert.strictEqual(result.yearlyBreakdown[16].fyLabel, '2030-31');
    });
    it('extension without contribution accepts no new deposits after the base maturity FY', () => {
      const result = calculatePPF({ ...base, startYear: 2014, extensionBlocks: 1, extensionMode: 'without_contribution' });
      assert.strictEqual(result.totalInvested, 2400000);
      assert.ok(result.yearlyBreakdown.slice(16).every((y) => y.annualDeposit === 0 && y.totalInterest > 0));
    });
  });
  describe('Real deposit history', () => {
    const base = {
      depositAmount: 150000,
      frequency: 'yearly' as const,
      depositTiming: 'before_5th' as const,
      extensionBlocks: 0,
      extensionMode: 'with_contribution' as const,
      projectedRate: 7.1,
    };
    it('does not invent deposits for past FYs that have no records', () => {
      const result = calculatePPF({
        ...base,
        startYear: 2020,
        history: [
          { id: '1', investmentDate: '2020-04-02', amount: 150000 },
          { id: '2', investmentDate: '2021-04-02', amount: 150000 },
        ],
        asOfDate: '2024-10-01',
      });
      const fy = (label: string) => result.yearlyBreakdown.find((y) => y.fyLabel === label)!;
      assert.strictEqual(fy('2022-23').annualDeposit, 0);
      assert.strictEqual(fy('2023-24').annualDeposit, 0);
      // Current FY: April deposit month has passed with nothing recorded → expected next month
      assert.strictEqual(fy('2024-25').annualDeposit, 150000);
      assert.strictEqual(fy('2024-25').months[7].deposit, 150000);
      // Future FYs are projected
      assert.strictEqual(fy('2025-26').annualDeposit, 150000);
      assert.strictEqual(result.investedToDate, 300000);
    });
    it('deposits above ₹1.5 lakh in an FY are not accepted and earn no interest', () => {
      const result = calculatePPF({
        ...base,
        startYear: 2023,
        history: [
          { id: '1', investmentDate: '2023-04-03', amount: 150000 },
          { id: '2', investmentDate: '2023-04-04', amount: 50000 },
        ],
        asOfDate: '2023-04-30',
        futureContributionMode: 'stop',
      });
      const yr1 = result.yearlyBreakdown[0];
      assert.strictEqual(yr1.annualDeposit, 150000);
      assert.strictEqual(yr1.excessDeposit, 50000);
      assert.strictEqual(yr1.totalInterest, 10650); // 150,000 × 7.1%, not 200,000 × 7.1%
      assert.strictEqual(result.excessDeposit, 50000);
      assert.strictEqual(result.investedToDate, 150000);
    });
    it('applies quarterly notified rates within an FY (FY 2018-19: 7.6 / 7.6 / 8.0 / 8.0)', () => {
      const result = calculatePPF({
        ...base,
        startYear: 2018,
        history: [{ id: '1', investmentDate: '2018-04-02', amount: 100000 }],
        asOfDate: '2018-05-01',
        futureContributionMode: 'stop',
      });
      const yr = result.yearlyBreakdown[0];
      assert.strictEqual(yr.rateLabel, '7.6 / 7.6 / 8 / 8');
      // 100,000 × (6 months @ 7.6% + 6 months @ 8.0%) / 12 = 3,800 + 4,000
      assert.strictEqual(yr.totalInterest, 7800);
    });
    it('calculates exact balance of 21,57,071 with 0 overlimit for actual user portfolio', () => {
      const userHistory: PpfInvestmentRecord[] = [
        { id: '1', investmentDate: '2014-08-07', amount: 500 },
        { id: '2', investmentDate: '2015-04-23', amount: 65000 },
        { id: '3', investmentDate: '2015-07-04', amount: 65000 },
        { id: '4', investmentDate: '2016-08-02', amount: 40000 },
        { id: '5', investmentDate: '2017-10-09', amount: 50000 },
        { id: '6', investmentDate: '2017-11-10', amount: 12000 },
        { id: '7', investmentDate: '2017-12-10', amount: 12000 },
        { id: '8', investmentDate: '2018-01-10', amount: 12000 },
        { id: '9', investmentDate: '2018-02-10', amount: 12000 },
        { id: '10', investmentDate: '2018-03-10', amount: 12000 },
        { id: '11', investmentDate: '2018-04-10', amount: 12000 },
        { id: '12', investmentDate: '2018-05-10', amount: 12000 },
        { id: '13', investmentDate: '2019-01-13', amount: 24000 },
        { id: '14', investmentDate: '2019-05-20', amount: 50000 },
        { id: '15', investmentDate: '2019-06-05', amount: 10000 },
        { id: '16', investmentDate: '2019-09-10', amount: 15000 },
        { id: '17', investmentDate: '2019-10-02', amount: 15000 },
        { id: '18', investmentDate: '2019-11-02', amount: 15000 },
        { id: '19', investmentDate: '2019-12-02', amount: 15000 },
        { id: '20', investmentDate: '2020-01-02', amount: 15000 },
        { id: '21', investmentDate: '2020-02-02', amount: 15000 },
        { id: '22', investmentDate: '2020-04-01', amount: 15000 },
        { id: '23', investmentDate: '2020-05-01', amount: 15000 },
        { id: '24', investmentDate: '2020-06-01', amount: 15000 },
        { id: '25', investmentDate: '2020-07-01', amount: 15000 },
        { id: '26', investmentDate: '2020-08-01', amount: 15000 },
        { id: '27', investmentDate: '2020-09-01', amount: 15000 },
        { id: '28', investmentDate: '2020-10-01', amount: 15000 },
        { id: '29', investmentDate: '2020-11-01', amount: 15000 },
        { id: '30', investmentDate: '2020-12-01', amount: 15000 },
        { id: '31', investmentDate: '2021-01-01', amount: 15000 },
        { id: '32', investmentDate: '2021-05-30', amount: 50000 },
        { id: '33', investmentDate: '2021-06-01', amount: 25000 },
        { id: '34', investmentDate: '2022-01-11', amount: 50000 },
        { id: '35', investmentDate: '2022-02-08', amount: 25000 },
        { id: '36', investmentDate: '2022-07-06', amount: 90000 },
        { id: '37', investmentDate: '2022-08-02', amount: 30000 },
        { id: '38', investmentDate: '2022-08-18', amount: 23000 },
        { id: '39', investmentDate: '2022-10-23', amount: 7000 },
        { id: '40', investmentDate: '2023-04-05', amount: 150000 },
        { id: '41', investmentDate: '2024-09-14', amount: 150000 },
        { id: '42', investmentDate: '2025-06-18', amount: 150000 },
        { id: '43', investmentDate: '2026-04-02', amount: 150000 },
      ];

      const result = calculatePPF({
        depositAmount: 150000,
        frequency: 'yearly',
        depositTiming: 'before_5th',
        startYear: 2014,
        extensionBlocks: 0,
        extensionMode: 'with_contribution',
        projectedRate: 7.1,
        history: userHistory,
        asOfDate: '2026-10-04',
        futureContributionMode: 'continue',
      });

      assert.strictEqual(result.excessDeposit, 0, 'no overlimit in any FY');
      assert.strictEqual(result.currentBalance, 2157071, 'current balance matches exact bank passbook ₹21,57,071');
      assert.strictEqual(result.investedToDate, 1528500);
      assert.strictEqual(result.interestEarnedToDate, 628571);
    });
  });
});
